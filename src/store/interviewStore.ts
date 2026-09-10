import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { EngineState } from '../features/interview/engine/branchingEngine';

interface InterviewStore {
  completedInterview: EngineState | null;
  setCompletedInterview: (state: EngineState) => void;
  clearInterview: () => void;
}

export const useInterviewStore = create<InterviewStore>()(
  persist(
    (set) => ({
      completedInterview: null,
      
      setCompletedInterview: (state) => set({ completedInterview: state }),
      
      clearInterview: () => set({ completedInterview: null }),
    }),
    {
      name: 'swasthyalipi-interview',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
