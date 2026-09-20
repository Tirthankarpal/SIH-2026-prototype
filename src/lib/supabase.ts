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
   * Uploads a base64 image to Supabase Storage and returns the public URL.
   */
  async uploadDocument(base64Str: string): Promise<string | null> {
    if (!supabase) return null;

    try {
      // 1. Convert base64 to Blob
      const matches = base64Str.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (!matches) throw new Error('Invalid base64 string');
      
      const mimeType = matches[1];
      const b64Data = matches[2];
      
      const byteCharacters = atob(b64Data);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
      }
      const blob = new Blob(byteArrays, { type: mimeType });
      
      // 2. Generate unique filename
      const fileExt = mimeType.split('/')[1];
      const fileName = `${Date.now()}_${crypto.randomUUID()}.${fileExt}`;
      const filePath = `scans/${fileName}`;
      
      // 3. Upload to Supabase Storage
      if (!navigator.onLine) {
        return null;
      }
      
      const { error: uploadError } = await supabase.storage
        .from('medical_documents')
        .upload(filePath, blob, { contentType: mimeType });
        
      if (uploadError) throw uploadError;
      
      // 4. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('medical_documents')
        .getPublicUrl(filePath);
        
      return publicUrl;
    } catch (err) {
      console.error('Failed to upload document to Supabase Storage:', err);
      return null;
    }
  },

  /**
   * Submit a new patient encounter from the tablet
   */
  async submitEncounter(encounter: Omit<PatientEncounter, 'id' | 'created_at' | 'status' | 'doctor_diagnosis' | 'doctor_prescription' | 'doctor_plan'>) {
    const payloadToSave = {
      ...encounter,
      status: 'intake_completed' as const
    };

    if (supabase) {
      if (!navigator.onLine) {
        // MANUAL OFFLINE SYNC
        const pending = JSON.parse(localStorage.getItem('pending_offline_sync') || '[]');
        pending.push(payloadToSave); // Save full payload WITH Base64 images
        localStorage.setItem('pending_offline_sync', JSON.stringify(pending));
        console.log('[Offline Sync] Saved to manual local queue.');
        return payloadToSave;
      }

      // Online: Strip massive Base64 images to prevent 3-minute database load times
      const cleanedDocuments = encounter.scanned_documents?.map(doc => {
        const isBase64 = doc.imageUrl?.startsWith('data:');
        return {
          ...doc,
          imageUrl: isBase64 ? undefined : doc.imageUrl
        };
      }) || null;
      
      payloadToSave.scanned_documents = cleanedDocuments;

      const { data, error } = await supabase
        .from('encounters')
        .insert(payloadToSave)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } else {
      // Mock DB
      const db = getMockDb();
      const newEncounter: PatientEncounter = {
        ...payloadToSave,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
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
  },

  /**
   * Supabase Authentication Methods
   */
  async signIn(email: string, password: string) {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data;
    } else {
      // Mock Login
      if (password !== 'password') throw new Error('Invalid mock credentials (use password: "password")');
      const mockUser = { id: 'mock-doctor-id', email };
      localStorage.setItem('swasthyalipi_mock_user', JSON.stringify(mockUser));
      return { user: mockUser };
    }
  },

  async signOut() {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      localStorage.removeItem('swasthyalipi_mock_user');
    }
  },

  /**
   * Manually flushes the offline encounter queue
   */
  async flushOfflineQueue() {
    if (!navigator.onLine || !supabase) return;
    
    const pendingText = localStorage.getItem('pending_offline_sync');
    if (!pendingText) return;
    
    const pending: any[] = JSON.parse(pendingText);
    if (pending.length === 0) return;
    
    console.log(`[Offline Sync] Flushing ${pending.length} encounters...`);
    
    // Dynamic import to avoid circular dependency
    const { extractMedicalDocument } = await import('./gemini');
    const remaining = [];
    
    for (const encounter of pending) {
      try {
        // 1. Process documents
        if (encounter.scanned_documents) {
          for (let i = 0; i < encounter.scanned_documents.length; i++) {
            const doc = encounter.scanned_documents[i];
            if (doc.imageUrl && doc.imageUrl.startsWith('data:')) {
              console.log(`[Offline Sync] Uploading delayed image...`);
              const publicUrl = await api.uploadDocument(doc.imageUrl);
              
              if (publicUrl) {
                console.log(`[Offline Sync] Running delayed AI OCR...`);
                const extracted = await extractMedicalDocument(doc.imageUrl).catch(() => ({ type: 'other', date: 'Unknown', extractedData: {}, rawText: 'OCR Failed' }));
                doc.imageUrl = publicUrl;
                doc.type = extracted.type || 'other';
                doc.date = extracted.date || 'Unknown';
                doc.extractedData = extracted.extractedData || {};
                doc.rawText = extracted.rawText || 'No text extracted';
              } else {
                doc.imageUrl = undefined;
              }
            }
          }
        }
        
        // 2. Insert to Supabase
        const { error } = await supabase.from('encounters').insert(encounter);
        if (error) throw error;
        
        console.log(`[Offline Sync] Successfully synced encounter.`);
      } catch (err) {
        console.error('[Offline Sync] Failed to sync encounter, keeping in queue', err);
        remaining.push(encounter);
      }
    }
    
    localStorage.setItem('pending_offline_sync', JSON.stringify(remaining));
  }
};
