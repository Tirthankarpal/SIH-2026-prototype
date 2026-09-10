import type { EngineState } from '../../interview/engine/branchingEngine';
import type { ClinicalSummary } from '../../../types/clinical';
import { calculatePrakriti, type PrakritiResult } from '../../ayush/engine/prakritiAssessment';
import { QUESTION_BANK } from '../../interview/engine/questionBank';
import type { InterviewQuestion, QuestionOption } from '../../../types/clinical';

/**
 * Extracts the label for a given option ID from the question bank.
 * Assumes English labels for the generated clinical summary.
 */
function getOptionLabel(questionId: string, optionId: string | number | string[]): string {
  const question = QUESTION_BANK.find((q: InterviewQuestion) => q.id === questionId);
  if (!question || !question.options) return String(optionId);

  const ids = Array.isArray(optionId) ? optionId : [optionId];
  
  const labels = ids.map((id) => {
    const opt = question.options!.find((o: QuestionOption) => o.id === id);
    return opt ? opt.label_en : String(id);
  });

  return labels.join(', ');
}

export interface FormattedSummary extends ClinicalSummary {
  prakritiResult?: PrakritiResult;
}

export function generateSummary(engineState: EngineState): FormattedSummary {
  // When EngineState is round-tripped through JSON (localStorage / Supabase),
  // the Map is serialized as a plain object. Normalize it back to a Map.
  let answers: Map<string, any>;
  if (engineState.answers instanceof Map) {
    answers = engineState.answers;
  } else {
    // It's a plain object from JSON deserialization
    answers = new Map(Object.entries(engineState.answers as any));
  }
  
  // Basic structure
  const summary: FormattedSummary = {
    chiefComplaint: 'None recorded',
    hpiNarrative: '',
    pastMedicalHistory: [],
    currentMedications: [],
    allergies: [],
    familyHistory: [],
    socialHistory: {},
    reviewOfSystems: {},
    redFlagAlerts: engineState.redFlags,
  };

  // 1. Chief Complaint
  const ccAnswer = answers.get('cc_main');
  if (ccAnswer) {
    const ccLabel = getOptionLabel('cc_main', ccAnswer.value);
    
    // Check if we have duration
    const durationAnswer = answers.get('cc_duration');
    const duration = durationAnswer ? getOptionLabel('cc_duration', durationAnswer.value) : '';
    
    summary.chiefComplaint = duration ? `${ccLabel} × ${duration}` : ccLabel;
  }

  // 2. SOCRATES (if applicable)
  const socratesIds = ['soc_site', 'soc_onset', 'soc_character', 'soc_radiation', 'soc_associated', 'soc_time', 'soc_exacerbating', 'soc_relieving', 'soc_severity'];
  const hasSocrates = socratesIds.some(id => answers.has(id));
  
  if (hasSocrates) {
    summary.socratesAssessment = {
      site: answers.has('soc_site') ? getOptionLabel('soc_site', answers.get('soc_site')!.value) : 'N/A',
      onset: answers.has('soc_onset') ? getOptionLabel('soc_onset', answers.get('soc_onset')!.value) : 'N/A',
      character: answers.has('soc_character') ? getOptionLabel('soc_character', answers.get('soc_character')!.value) : 'N/A',
      radiation: answers.has('soc_radiation') ? getOptionLabel('soc_radiation', answers.get('soc_radiation')!.value) : 'N/A',
      associations: answers.has('soc_associated') ? getOptionLabel('soc_associated', answers.get('soc_associated')!.value) : 'N/A',
      timeCourse: answers.has('soc_time') ? getOptionLabel('soc_time', answers.get('soc_time')!.value) : 'N/A',
      exacerbating: answers.has('soc_exacerbating') ? getOptionLabel('soc_exacerbating', answers.get('soc_exacerbating')!.value) : 'N/A',
      severity: answers.has('soc_severity') ? getOptionLabel('soc_severity', answers.get('soc_severity')!.value) + '/10' : 'N/A',
    };
  }

  // 3. Past Medical History
  const pmhAnswer = answers.get('pmh_conditions');
  if (pmhAnswer && pmhAnswer.value !== 'none') {
    summary.pastMedicalHistory = getOptionLabel('pmh_conditions', pmhAnswer.value).split(', ');
  } else if (pmhAnswer && pmhAnswer.value === 'none') {
    summary.pastMedicalHistory = ['No significant past medical history'];
  }

  // 4. Medications
  const medsAnswer = answers.get('meds_current');
  if (medsAnswer && medsAnswer.value !== 'none') {
    summary.currentMedications = getOptionLabel('meds_current', medsAnswer.value).split(', ');
  } else if (medsAnswer && medsAnswer.value === 'none') {
    summary.currentMedications = ['Not currently taking any medications'];
  }

  // 5. Allergies
  const allergiesAnswer = answers.get('alg_status');
  if (allergiesAnswer && allergiesAnswer.value === 'yes') {
    const specificAlg = answers.get('alg_specific');
    if (specificAlg) {
      summary.allergies = [String(specificAlg.value)];
    } else {
      summary.allergies = ['Allergies reported, details not specified'];
    }
  } else {
    summary.allergies = ['No known allergies (NKA)'];
  }

  // 6. Family History
  const fhAnswer = answers.get('fh_conditions');
  if (fhAnswer && fhAnswer.value !== 'none') {
    summary.familyHistory = getOptionLabel('fh_conditions', fhAnswer.value).split(', ');
  } else if (fhAnswer && fhAnswer.value === 'none') {
    summary.familyHistory = ['No significant family history'];
  }

  // 7. Social History
  const shSmoking = answers.get('sh_smoking');
  const shAlcohol = answers.get('sh_alcohol');
  if (shSmoking) summary.socialHistory.smoking = getOptionLabel('sh_smoking', shSmoking.value);
  if (shAlcohol) summary.socialHistory.alcohol = getOptionLabel('sh_alcohol', shAlcohol.value);

  // 8. Review of Systems
  const rosGeneral = answers.get('ros_general');
  const rosResp = answers.get('ros_respiratory');
  const rosCardio = answers.get('ros_cardio');
  
  if (rosGeneral) summary.reviewOfSystems['General'] = getOptionLabel('ros_general', rosGeneral.value).split(', ');
  if (rosResp) summary.reviewOfSystems['Respiratory'] = getOptionLabel('ros_respiratory', rosResp.value).split(', ');
  if (rosCardio) summary.reviewOfSystems['Cardiovascular'] = getOptionLabel('ros_cardio', rosCardio.value).split(', ');

  // 9. Generate HPI Narrative
  let narrative = `Patient presents with ${summary.chiefComplaint}. `;
  if (hasSocrates && summary.socratesAssessment) {
    const s = summary.socratesAssessment;
    narrative += `Pain is located in ${s.site}. It began ${s.onset} and is described as ${s.character}. `;
    if (s.radiation !== 'No, stays in one place') narrative += `Pain radiates to ${s.radiation}. `;
    narrative += `Severity is ${s.severity}. `;
    if (s.exacerbating !== 'Nothing specific') narrative += `Exacerbated by ${s.exacerbating}. `;
    if (s.associations !== 'None of these') narrative += `Associated symptoms include ${s.associations}. `;
  }
  summary.hpiNarrative = narrative;

  // 10. AYUSH Extensions
  if (engineState.mode === 'ayush') {
    // Calculate Prakriti Score
    summary.prakritiResult = calculatePrakriti(answers);
    
    // Add other AYUSH parameters to ROS or create a specific AYUSH section.
    // For simplicity, we add them to ROS in this MVP.
    const addAyushParam = (id: string, label: string) => {
      if (answers.has(id)) {
        summary.reviewOfSystems[label] = [getOptionLabel(id, answers.get(id)!.value)];
      }
    };

    addAyushParam('ayush_vikriti_symptoms', 'Vikriti (Imbalance)');
    addAyushParam('ayush_sara_quality', 'Sara (Tissue Quality)');
    addAyushParam('ayush_samhanana', 'Samhanana (Build)');
    addAyushParam('ayush_satmya', 'Satmya (Adaptability)');
    addAyushParam('ayush_satva', 'Satva (Mental Strength)');
    addAyushParam('ayush_ahara', 'Ahara (Digestion)');
    addAyushParam('ayush_vyayama', 'Vyayama (Exercise Capacity)');
  }

  return summary;
}
