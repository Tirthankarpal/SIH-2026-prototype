import { create } from 'zustand';
import { api } from '../lib/supabase';
import type { PatientEncounter } from '../types/backend';

interface DoctorState {
  encounters: PatientEncounter[];
  isLoading: boolean;
  error: string | null;
  fetchQueue: () => Promise<void>;
  updateStatus: (id: string, status: PatientEncounter['status']) => Promise<void>;
  saveNotes: (id: string, notes: { doctor_diagnosis: string, doctor_prescription: string, doctor_plan: string }) => Promise<void>;
}

export const useDoctorStore = create<DoctorState>((set, get) => ({
  encounters: [],
  isLoading: false,
  error: null,

  fetchQueue: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getQueue();
      set({ encounters: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch queue', isLoading: false });
    }
  },

  updateStatus: async (id, status) => {
    try {
      await api.updateEncounterStatus(id, status);
      // Optimistic update
      set({
        encounters: get().encounters.map(e => 
          e.id === id ? { ...e, status } : e
        )
      });
    } catch (err: any) {
      console.error('Failed to update status:', err);
    }
  },

  saveNotes: async (id, notes) => {
    try {
      await api.saveDoctorNotes(id, notes);
      // Optimistic update
      set({
        encounters: get().encounters.map(e => 
          e.id === id ? { ...e, ...notes } : e
        )
      });
    } catch (err: any) {
      console.error('Failed to save notes:', err);
    }
  }
}));
