import { GoogleGenAI } from '@google/genai';
import type { FormattedSummary } from '../features/summary/formatters/clinicalFormatters';

/* ═══════════════════ CONFIG ═══════════════════ */

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
export const isGeminiConfigured = Boolean(apiKey);

const ai = isGeminiConfigured ? new GoogleGenAI({ apiKey }) : null;
const MODEL = 'gemini-3.6-flash';

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

function buildSOAPPrompt(summary: FormattedSummary, mode: 'modern' | 'ayush'): string {
  const sections: string[] = [];

  sections.push(`You are an expert clinical documentation assistant for an Indian hospital OPD.`);
  sections.push(`Generate a professional SOAP note from the following structured patient intake data.`);
  sections.push(`Respond ONLY with valid JSON matching this exact schema (no markdown, no backticks):`);
  sections.push(`{
  "soapNote": {
    "subjective": "string (detailed narrative of patient's complaints, HPI, and relevant history)",
    "objective": "string (write 'Pending physician examination' since vitals are not yet taken)",
    "assessment": "string (clinical impression based on subjective data, list possible diagnoses)",
    "plan": "string (suggested investigations, initial management, follow-up)"
  },
  "differentials": [
    {
      "condition": "string (diagnosis name)",
      "likelihood": "High" | "Moderate" | "Low",
      "reasoning": "string (brief clinical reasoning)"
    }
  ]${mode === 'ayush' ? ',\n  "ayushRecommendations": "string (Ayurvedic treatment principles based on Prakriti and symptoms)"' : ''}
}`);

  sections.push(`\n--- PATIENT DATA ---`);
  sections.push(`Chief Complaint: ${summary.chiefComplaint}`);
  
  if (summary.hpiNarrative) {
    sections.push(`HPI Narrative: ${summary.hpiNarrative}`);
  }

  if (summary.socratesAssessment) {
    const s = summary.socratesAssessment;
    sections.push(`SOCRATES Pain Assessment:`);
    sections.push(`  Site: ${s.site}`);
    sections.push(`  Onset: ${s.onset}`);
    sections.push(`  Character: ${s.character}`);
    sections.push(`  Radiation: ${s.radiation}`);
    sections.push(`  Associations: ${s.associations}`);
    sections.push(`  Time Course: ${s.timeCourse}`);
    sections.push(`  Exacerbating/Relieving: ${s.exacerbating}`);
    sections.push(`  Severity: ${s.severity}`);
  }

  sections.push(`Past Medical History: ${summary.pastMedicalHistory.length ? summary.pastMedicalHistory.join(', ') : 'None reported'}`);
  sections.push(`Current Medications: ${summary.currentMedications.length ? summary.currentMedications.join(', ') : 'None reported'}`);
  sections.push(`Allergies: ${summary.allergies.length ? summary.allergies.join(', ') : 'NKDA'}`);
  sections.push(`Family History: ${summary.familyHistory.length ? summary.familyHistory.join(', ') : 'Non-contributory'}`);

  if (summary.socialHistory) {
    const sh = summary.socialHistory;
    sections.push(`Social History: Smoking: ${sh.smoking || 'Not assessed'}, Alcohol: ${sh.alcohol || 'Not assessed'}`);
  }

  if (Object.keys(summary.reviewOfSystems).length > 0) {
    sections.push(`Review of Systems:`);
    for (const [system, findings] of Object.entries(summary.reviewOfSystems)) {
      sections.push(`  ${system}: ${findings.join(', ')}`);
    }
  }

  if (summary.redFlagAlerts.length > 0) {
    sections.push(`\n⚠️ RED FLAG ALERTS:`);
    for (const flag of summary.redFlagAlerts) {
      sections.push(`  - ${flag.rule.name_en}: ${flag.rule.description_en}`);
    }
  }

  if (mode === 'ayush' && summary.prakritiResult) {
    const p = summary.prakritiResult;
    sections.push(`\nAYUSH / Prakriti Assessment:`);
    sections.push(`  Primary Dosha: ${p.primaryDosha}`);
    if (p.secondaryDosha) sections.push(`  Secondary Dosha: ${p.secondaryDosha}`);
    sections.push(`  Vata: ${p.percentages.vata}%, Pitta: ${p.percentages.pitta}%, Kapha: ${p.percentages.kapha}%`);
  }

  sections.push(`\nProvide 3-5 differential diagnoses ranked by likelihood.`);
  sections.push(`Use clinical terminology appropriate for an Indian medical context.`);
  sections.push(`Be concise but thorough. Do NOT include any text outside the JSON.`);

  return sections.join('\n');
}

/* ═══════════════════ API CALLS ═══════════════════ */

export async function generateAISummary(
  summary: FormattedSummary,
  mode: 'modern' | 'ayush'
): Promise<AISummaryResult> {
  if (!ai) {
    throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.');
  }

  const prompt = buildSOAPPrompt(summary, mode);

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      temperature: 0.3, // Low temperature for clinical accuracy
      maxOutputTokens: 2048,
    },
  });

  const text = response.text?.trim() || '';

  // Parse the JSON response — handle potential markdown wrapping
  let jsonStr = text;
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(jsonStr) as AISummaryResult;
    return parsed;
  } catch {
    // If JSON parsing fails, create a structured response from raw text
    return {
      soapNote: {
        subjective: text,
        objective: 'Pending physician examination.',
        assessment: 'AI analysis could not be fully parsed. Please review the subjective narrative above.',
        plan: 'Proceed with standard clinical evaluation.',
      },
      differentials: [],
    };
  }
}
