/**
 * useSpeechRecognition — Browser-native speech-to-text hook
 *
 * Uses the Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 * with support for Hindi (hi-IN) and English (en-IN).
 *
 * Exports:
 *   - transcript        : the current recognized text
 *   - interimTranscript  : live partial recognition while speaking
 *   - isListening        : whether the mic is active
 *   - confidence         : recognition confidence (0–1)
 *   - error              : last error message, or null
 *   - isSupported        : whether the browser supports speech recognition
 *   - isDemoMode         : whether demo mode is currently active
 *   - startListening()   : begin listening
 *   - stopListening()    : stop listening
 *   - resetTranscript()  : clear the transcript
 *   - setLanguage()      : switch recognition language
 *   - triggerDemoMode()  : 🎯 GOD MODE — inject a pre-written clinical narrative
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  type DemoScenarioId,
  getDemoScenario,
  DEMO_SCENARIOS,
} from './demoScenarios';

/* ───────────────────────── Types ───────────────────────── */

export type SupportedLanguage = 
  | 'as-IN'   // Assamese
  | 'bn-IN'   // Bengali
  | 'brx-IN'  // Bodo
  | 'doi-IN'  // Dogri
  | 'gu-IN'   // Gujarati
  | 'hi-IN'   // Hindi
  | 'kn-IN'   // Kannada
  | 'ks-IN'   // Kashmiri
  | 'gom-IN'  // Konkani
  | 'mai-IN'  // Maithili
  | 'ml-IN'   // Malayalam
  | 'mni-IN'  // Manipuri (Meitei)
  | 'mr-IN'   // Marathi
  | 'ne-NP'   // Nepali
  | 'or-IN'   // Odia
  | 'pa-IN'   // Punjabi
  | 'sa-IN'   // Sanskrit
  | 'sat-IN'  // Santali
  | 'sd-IN'   // Sindhi
  | 'ta-IN'   // Tamil
  | 'te-IN'   // Telugu
  | 'ur-IN'   // Urdu
  | 'en-IN';  // English

export interface UseSpeechRecognitionReturn {
  /** Final committed transcript text */
  transcript: string;
  /** Interim (partial) recognition — updates in real time as user speaks */
  interimTranscript: string;
  /** Whether the mic is currently capturing */
  isListening: boolean;
  /** Recognition confidence for the latest final result (0–1) */
  confidence: number;
  /** Last error, if any */
  error: string | null;
  /** Whether the browser supports the Web Speech API */
  isSupported: boolean;
  /** Whether the current transcript was injected by demo mode */
  isDemoMode: boolean;
  /** Currently active language code */
  language: SupportedLanguage;
  /** Start capturing speech */
  startListening: () => void;
  /** Stop capturing speech */
  stopListening: () => void;
  /** Clear the transcript and error state */
  resetTranscript: () => void;
  /** Manually update the transcript text (for keyboard fallback) */
  setTranscript: (text: string) => void;
  /** Switch the recognition language */
  setLanguage: (lang: SupportedLanguage) => void;
  /**
   * 🎯 GOD MODE — Inject a pre-written clinical narrative instantly.
   *
   * Call this to simulate a patient speaking a perfect clinical history.
   * The transcript is populated character-by-character with a typewriter
   * effect to look realistic during demos.
   *
   * @param scenario  — which pre-written narrative to use
   * @param typewriter — if true (default), text appears character by character;
   *                     if false, it's injected instantly
   */
  triggerDemoMode: (scenario: DemoScenarioId, typewriter?: boolean) => void;
  /** Cancel an in-progress demo mode typewriter animation */
  cancelDemoMode: () => void;
}

/* ─────────────── Browser compatibility check ─────────────── */

function getSpeechRecognitionConstructor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/* ─────────────────────── Constants ─────────────────────── */

/** How fast characters appear in demo-mode typewriter (ms per char) */
const TYPEWRITER_SPEED_MS = 18;

/** Human-readable language labels for error messages */
export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  'as-IN': 'Assamese (অসমীয়া)',
  'bn-IN': 'Bengali (বাংলা)',
  'brx-IN': 'Bodo (बड़ो)',
  'doi-IN': 'Dogri (डोगरी)',
  'en-IN': 'English (India)',
  'gu-IN': 'Gujarati (ગુજરાતી)',
  'hi-IN': 'Hindi (हिन्दी)',
  'kn-IN': 'Kannada (ಕನ್ನಡ)',
  'ks-IN': 'Kashmiri (कॉशुर)',
  'gom-IN': 'Konkani (कोंकणी)',
  'mai-IN': 'Maithili (मैथिली)',
  'ml-IN': 'Malayalam (മലയാളം)',
  'mni-IN': 'Manipuri (ꯃꯤꯇꯩꯂꯣꯟ)',
  'mr-IN': 'Marathi (मराठी)',
  'ne-NP': 'Nepali (नेपाली)',
  'or-IN': 'Odia (ଓଡ଼ିଆ)',
  'pa-IN': 'Punjabi (ਪੰਜਾਬੀ)',
  'sa-IN': 'Sanskrit (संस्कृतम्)',
  'sat-IN': 'Santali (ᱥᱟᱱᱛᱟᱲᱤ)',
  'sd-IN': 'Sindhi (سنڌي)',
  'ta-IN': 'Tamil (தமிழ்)',
  'te-IN': 'Telugu (తెలుగు)',
  'ur-IN': 'Urdu (اردو)',
};

/* ═══════════════════════ HOOK ═══════════════════════ */

export function useSpeechRecognition(
  initialLanguage: SupportedLanguage = 'en-IN',
): UseSpeechRecognitionReturn {
  /* ─── State ─── */
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguageState] = useState<SupportedLanguage>(initialLanguage);
  const [isDemoMode, setIsDemoMode] = useState(false);

  /* ─── Refs ─── */
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const typewriterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isListeningRef = useRef(false); // avoids stale-closure issues in callbacks

  /* ─── Browser support ─── */
  const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
  const isSupported = SpeechRecognitionCtor !== null;

  /* ─────────────────── Recognition setup ─────────────────── */

  const createRecognition = useCallback(
    (lang: SupportedLanguage): SpeechRecognition | null => {
      const Ctor = getSpeechRecognitionConstructor();
      if (!Ctor) return null;

      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalText = '';
        let interimText = '';
        let latestConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
            latestConfidence = result[0].confidence;
          } else {
            interimText += result[0].transcript;
          }
        }

        if (finalText) {
          setTranscript((prev) => (prev ? prev + ' ' + finalText.trim() : finalText.trim()));
          setConfidence(latestConfidence);
          setInterimTranscript('');
        } else {
          setInterimTranscript(interimText);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // 'no-speech' and 'aborted' are non-critical — user just didn't say anything
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }

        const friendlyMessages: Record<string, string> = {
          'not-allowed':
            'Microphone access was denied. Please allow microphone permissions in your browser settings.',
          'service-not-available': `Speech recognition service is not available. Check your internet connection for ${LANGUAGE_LABELS[lang]}.`,
          'network': 'Network error. Speech recognition requires an internet connection in most browsers.',
          'audio-capture': 'No microphone was found. Please connect a microphone and try again.',
        };

        setError(friendlyMessages[event.error] || `Speech recognition error: ${event.error}`);
        setIsListening(false);
        isListeningRef.current = false;
      };

      recognition.onend = () => {
        // Auto-restart if we're supposed to still be listening
        // (Chrome stops recognition after ~60s of silence)
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            // Already started — ignore
          }
        } else {
          setIsListening(false);
        }
      };

      return recognition;
    },
    [],
  );

  /* ─────────────────── Public methods ─────────────────── */

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError(
        'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.',
      );
      return;
    }

    // Cancel any running demo mode
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
    setIsDemoMode(false);
    setError(null);
    setInterimTranscript('');

    // Tear down previous instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* noop */
      }
    }

    const recognition = createRecognition(language);
    if (!recognition) return;

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
      isListeningRef.current = true;
    } catch (err) {
      setError(`Failed to start speech recognition: ${err}`);
    }
  }, [isSupported, language, createRecognition]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript('');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
    setError(null);
    setIsDemoMode(false);

    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
  }, []);

  const setLanguage = useCallback(
    (lang: SupportedLanguage) => {
      setLanguageState(lang);

      // If currently listening, restart with new language
      if (isListeningRef.current) {
        stopListening();
        // Small delay to allow cleanup, then restart
        setTimeout(() => {
          const recognition = createRecognition(lang);
          if (!recognition) return;
          recognitionRef.current = recognition;
          try {
            recognition.start();
            setIsListening(true);
            isListeningRef.current = true;
          } catch {
            /* noop */
          }
        }, 100);
      }
    },
    [stopListening, createRecognition],
  );

  /* ───────────── 🎯 GOD MODE: Demo Mode ───────────── */

  const triggerDemoMode = useCallback(
    (scenarioId: DemoScenarioId, typewriter = true) => {
      const scenario = getDemoScenario(scenarioId);
      if (!scenario) {
        console.warn(
          `[SwasthyaLipi] Unknown demo scenario: "${scenarioId}". Available: ${Object.keys(DEMO_SCENARIOS).join(', ')}`,
        );
        return;
      }

      // Stop any real listening
      stopListening();

      // Clear previous state
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }

      setIsDemoMode(true);
      setError(null);
      setConfidence(0.97); // Demo mode always shows high confidence
      setIsListening(true); // Fake "listening" state for visual effect

      // Pick the right language variant
      const langKey = language === 'hi-IN' ? 'hi' : 'en';
      const fullText = scenario.transcript[langKey];

      if (!typewriter) {
        // Instant injection
        setTranscript(fullText);
        setInterimTranscript('');
        setIsListening(false);
        return;
      }

      // ── Typewriter effect ──
      // Shows text appearing character-by-character, split between
      // "interim" (current word being typed) and "transcript" (committed words)
      setTranscript('');
      setInterimTranscript('');

      let charIndex = 0;
      const committedWords: string[] = [];
      let currentWord = '';

      typewriterTimerRef.current = setInterval(() => {
        if (charIndex >= fullText.length) {
          // Done — commit everything
          clearInterval(typewriterTimerRef.current!);
          typewriterTimerRef.current = null;
          setTranscript(fullText);
          setInterimTranscript('');
          setIsListening(false);
          return;
        }

        const char = fullText[charIndex];
        charIndex++;

        if (char === ' ' || char === ',' || char === '।') {
          // Word boundary — commit current word to transcript
          committedWords.push(currentWord + char);
          currentWord = '';
          setTranscript(committedWords.join(''));
          setInterimTranscript('');
        } else {
          currentWord += char;
          setInterimTranscript(currentWord);
        }
      }, TYPEWRITER_SPEED_MS);
    },
    [language, stopListening],
  );

  const cancelDemoMode = useCallback(() => {
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
    setIsDemoMode(false);
    setIsListening(false);
  }, []);

  /* ─── Cleanup on unmount ─── */
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* noop */
        }
      }
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
      }
    };
  }, []);

  /* ─── Return ─── */
  return {
    transcript,
    interimTranscript,
    isListening,
    confidence,
    error,
    isSupported,
    isDemoMode,
    language,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
    setLanguage,
    triggerDemoMode,
    cancelDemoMode,
  };
}
