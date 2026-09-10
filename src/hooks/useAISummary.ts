import { useState, useCallback } from 'react';
import { generateAISummary, isGeminiConfigured, type AISummaryResult } from '../lib/gemini';
import type { FormattedSummary } from '../features/summary/formatters/clinicalFormatters';

interface UseAISummaryReturn {
  result: AISummaryResult | null;
  isLoading: boolean;
  error: string | null;
  isAvailable: boolean;
  generate: (summary: FormattedSummary, mode: 'modern' | 'ayush') => Promise<void>;
}

/**
 * Hook that wraps Gemini AI calls for SOAP note and differential generation.
 * Returns `isAvailable: false` when no API key is configured.
 */
export function useAISummary(): UseAISummaryReturn {
  const [result, setResult] = useState<AISummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (summary: FormattedSummary, mode: 'modern' | 'ayush') => {
    if (!isGeminiConfigured) {
      setError('Gemini API key not configured.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const aiResult = await generateAISummary(summary, mode);
      setResult(aiResult);
    } catch (err: any) {
      setError(err.message || 'AI generation failed.');
      console.error('[SwasthyaLipi AI]', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    result,
    isLoading,
    error,
    isAvailable: isGeminiConfigured,
    generate,
  };
}
