import type { FormattedSummary } from '../features/summary/formatters/clinicalFormatters';
import type { EngineState } from '../features/interview/engine/branchingEngine';

export type EncounterStatus = 'intake_completed' | 'waiting' | 'in_consultation' | 'completed';

/**
 * Represents a single patient visit to the OPD.
 */
export interface PatientEncounter {
  id: string; // UUID
  patient_id: string; // ABHA ID or phone number
  created_at: string; // ISO string
  status: EncounterStatus;
  mode: 'modern' | 'ayush';
  
  // Data captured by the tablet
  engine_state: EngineState | null;
  generated_summary: FormattedSummary | null;
  
  // Doctor's Workspace (filled during consultation)
  doctor_diagnosis: string | null;
  doctor_prescription: string | null;
  doctor_plan: string | null;
  
  // Metadata
  red_flag_count: number;
}
