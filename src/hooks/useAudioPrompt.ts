import { useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useSpeechSynthesis } from './useSpeechSynthesis';

/**
 * A hook that auto-plays a speech synthesis prompt when a component mounts.
 * Useful for providing audio instructions on onboarding screens.
 */
export function useAudioPrompt(
  promptTextEn: string,
  promptTextHi: string,
  autoPlay: boolean = true
) {
  const language = useSessionStore((s) => s.language);
  const { speak, stop, isSpeaking, isSupported } = useSpeechSynthesis(language);
  const hasPlayed = useRef(false);

  const playPrompt = useCallback(() => {
    const textToSpeak = language === 'hi-IN' ? promptTextHi : promptTextEn;
    speak(textToSpeak, language);
  }, [language, promptTextEn, promptTextHi, speak]);

  useEffect(() => {
    if (autoPlay && !hasPlayed.current && isSupported) {
      // Small delay to ensure smooth transition before speaking
      const timer = setTimeout(() => {
        playPrompt();
        hasPlayed.current = true;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, isSupported, playPrompt]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { playPrompt, stop, isSpeaking, isSupported };
}
