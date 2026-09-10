import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SupportedLanguage } from '../hooks/useSpeechRecognition';

export type InterviewMode = 'modern' | 'ayush';

interface SessionState {
  // State
  language: SupportedLanguage;
  patientId: string;
  hasConsented: boolean;
  mode: InterviewMode | null;
  
  // Actions
  setLanguage: (lang: SupportedLanguage) => void;
  setPatientId: (id: string) => void;
  setConsent: (consented: boolean) => void;
  setMode: (mode: InterviewMode) => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      // Initial state
      language: 'en-IN',
      patientId: '',
      hasConsented: false,
      mode: null,

      // Actions
      setLanguage: (lang) => set({ language: lang }),
      setPatientId: (id) => set({ patientId: id }),
      setConsent: (consented) => set({ hasConsented: consented }),
      setMode: (mode) => set({ mode }),
      
      resetSession: () => set({
        patientId: '',
        hasConsented: false,
        mode: null,
      }),
    }),
    {
      name: 'swasthyalipi-session', // unique name for localStorage
      storage: createJSONStorage(() => sessionStorage), // use sessionStorage so it clears when tab closes
    }
  )
);
