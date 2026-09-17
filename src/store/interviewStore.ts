import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { EngineState } from '../features/interview/engine/branchingEngine';
import type { ScannedDocument } from '../types/clinical';

interface InterviewStore {
  completedInterview: EngineState | null;
  scannedDocuments: ScannedDocument[];
  setCompletedInterview: (state: EngineState) => void;
  addScannedDocument: (doc: ScannedDocument) => void;
  clearInterview: () => void;
}

export const useInterviewStore = create<InterviewStore>()(
  persist(
    (set) => ({
      completedInterview: null,
      scannedDocuments: [],
      
      setCompletedInterview: (state) => set({ completedInterview: state }),
      
      addScannedDocument: (doc) => set((state) => ({ 
        scannedDocuments: [...state.scannedDocuments, doc] 
      })),
      
      clearInterview: () => set({ completedInterview: null, scannedDocuments: [] }),
    }),
    {
      name: 'swasthyalipi-interview',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
