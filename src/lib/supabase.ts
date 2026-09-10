import { createClient } from '@supabase/supabase-js';
import type { PatientEncounter } from '../types/backend';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/* ═══════════════════ MOCK BACKEND FALLBACK ═══════════════════ */
// This allows the app to function for demo purposes without a real database

const MOCK_DB_KEY = 'swasthyalipi_mock_db';

function getMockDb(): PatientEncounter[] {
  try {
    const data = localStorage.getItem(MOCK_DB_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveMockDb(data: PatientEncounter[]) {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(data));
  
  // Dispatch a custom event so other tabs/hooks can update
  window.dispatchEvent(new Event('mock_db_updated'));
}

export const api = {
  /**
   * Submit a new patient encounter from the tablet
   */
  async submitEncounter(encounter: Omit<PatientEncounter, 'id' | 'created_at' | 'status' | 'doctor_diagnosis' | 'doctor_prescription' | 'doctor_plan'>) {
    if (supabase) {
      // Real DB
      const { data, error } = await supabase
        .from('encounters')
        .insert({
          ...encounter,
          status: 'intake_completed'
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } else {
      // Mock DB
      const db = getMockDb();
      const newEncounter: PatientEncounter = {
        ...encounter,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        status: 'intake_completed',
        doctor_diagnosis: null,
        doctor_prescription: null,
        doctor_plan: null,
      };
      
      db.unshift(newEncounter); // Add to top of queue
      saveMockDb(db);
      return newEncounter;
    }
  },

  /**
   * Fetch all active encounters for the doctor dashboard
   */
  async getQueue(): Promise<PatientEncounter[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('encounters')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as PatientEncounter[];
    } else {
      return getMockDb();
    }
  },

  /**
   * Update the status of an encounter
   */
  async updateEncounterStatus(id: string, status: PatientEncounter['status']) {
    if (supabase) {
      const { error } = await supabase
        .from('encounters')
        .update({ status })
        .eq('id', id);
        
      if (error) throw error;
    } else {
      const db = getMockDb();
      const idx = db.findIndex(e => e.id === id);
      if (idx > -1) {
        db[idx].status = status;
        saveMockDb(db);
      }
    }
  },

  /**
   * Save doctor's notes
   */
  async saveDoctorNotes(id: string, notes: { doctor_diagnosis: string, doctor_prescription: string, doctor_plan: string }) {
    if (supabase) {
      const { error } = await supabase
        .from('encounters')
        .update(notes)
        .eq('id', id);
        
      if (error) throw error;
    } else {
      const db = getMockDb();
      const idx = db.findIndex(e => e.id === id);
      if (idx > -1) {
        db[idx] = { ...db[idx], ...notes };
        saveMockDb(db);
      }
    }
  }
};
