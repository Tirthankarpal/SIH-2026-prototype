import { GoogleGenAI } from '@google/genai';
import type { FormattedSummary } from '../features/summary/formatters/clinicalFormatters';

/* ═══════════════════ CONFIG ═══════════════════ */

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
export const isGeminiConfigured = Boolean(apiKey);

const ai = isGeminiConfigured ? new GoogleGenAI({ apiKey }) : null;
const MODEL = 'gemini-3.5-flash-lite';

/* ═══════════════════ TYPES ═══════════════════ */

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface DifferentialDiagnosis {
  condition: string;
  likelihood: 'High' | 'Moderate' | 'Low';
  reasoning: string;
}

export interface AISummaryResult {
  soapNote: SOAPNote;
  differentials: DifferentialDiagnosis[];
  ayushRecommendations?: string;
}

/* ═══════════════════ PROMPT BUILDERS ═══════════════════ */


/* ═══════════════════ API CALLS ═══════════════════ */

async function fetchWithRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      const isTemporary = error?.status === 503 || error?.status === 429 || error?.message?.includes('503') || error?.message?.includes('UNAVAILABLE');
      if (isTemporary) {
        attempt++;
        if (attempt >= maxRetries) throw error;
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.warn(`[Gemini API] Temporary error (503/429). Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries reached');
}

export async function generateAISummary(
  summary: FormattedSummary,
  mode: 'modern' | 'ayush'
): Promise<AISummaryResult> {
  // Call the new FastAPI backend engine
  const backendUrl = import.meta.env.VITE_CLINICAL_ENGINE_URL || 'http://localhost:8000';
  
  const payload = {
    mode,
    ...summary,
  };

  const response = await fetchWithRetry(() => fetch(`${backendUrl}/api/analyze-encounter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(async res => {
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Clinical Engine Error (${res.status}): ${errorText}`);
    }
    return res.json();
  }));

  // The backend already strictly validated the output with Pydantic!
  return response as AISummaryResult;
}

export async function extractMedicalDocument(dataUrl: string): Promise<any> {
  if (!ai) {
    throw new Error('Gemini API key not configured.');
  }

  // Extract mime type and base64 data from data URL
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid image data URL');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  const prompt = `You are a clinical OCR engine.
Extract the key medical information from this document.
Respond ONLY with a valid JSON object matching this schema:
{
  "type": "prescription" | "lab_report" | "discharge_summary" | "other",
  "date": "YYYY-MM-DD or Unknown",
  "extractedData": {
     // Include a summary of key findings, diagnoses, abnormal values, or prescribed medications. Structure it sensibly.
  },
  "rawText": "Brief summary of the raw text"
}`;

  try {
    const response = await fetchWithRetry(() => ai!.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.1,
      },
    }));

    const text = response.text?.trim() || '';
    let jsonStr = text;
    if (jsonStr.startsWith('\`\`\`')) {
      jsonStr = jsonStr.replace(/^\`\`\`(?:json)?\n?/, '').replace(/\n?\`\`\`$/, '');
    }

    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to extract document:', err);
    throw err;
  }
}
