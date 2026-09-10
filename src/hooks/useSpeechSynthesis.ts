import { useState, useEffect, useCallback } from 'react';
import type { SupportedLanguage } from './useSpeechRecognition';

export interface UseSpeechSynthesisResult {
  speak: (text: string, lang?: SupportedLanguage) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function useSpeechSynthesis(defaultLang: SupportedLanguage = 'en-IN'): UseSpeechSynthesisResult {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);

      const loadVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };

      loadVoices();
      
      // Some browsers load voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  const speak = useCallback((text: string, lang: SupportedLanguage = defaultLang) => {
    if (!isSupported) return;

    window.speechSynthesis.cancel(); // Stop anything currently speaking

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower for better comprehension in clinical settings

    // Try to find a matching voice for the language
    if (voices.length > 0) {
      const languagePrefix = lang.split('-')[0]; // 'hi' or 'en'
      const matchedVoice = voices.find(v => v.lang.startsWith(languagePrefix) || v.lang === lang);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported, voices, defaultLang]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported };
}
