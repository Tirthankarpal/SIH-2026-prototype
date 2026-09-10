/**
 * Red-Flag Detector — Real-time emergency symptom detection
 *
 * Monitors interview answers for dangerous symptom combinations
 * that require immediate triage escalation. Runs after every answer
 * is submitted, checking the cumulative answer set against rules.
 */

import type { InterviewAnswer, RedFlagRule, RedFlagAlert } from '../../../types/clinical';

/* ═══════════════════ Red-Flag Rules ═══════════════════ */

export const RED_FLAG_RULES: RedFlagRule[] = [
  {
    id: 'rf_cardiac',
    name_en: '🚨 Possible Cardiac Emergency',
    name_hi: '🚨 संभावित हृदय आपातकाल',
    severity: 'critical',
    description_en: 'Chest pain with features suggestive of acute coronary syndrome.',
    description_hi: 'सीने में दर्द जो तीव्र हृदय रोग का संकेत दे सकता है।',
    action_en: 'IMMEDIATE TRIAGE — Route patient to emergency. Call code if available. Do NOT let patient walk unassisted.',
    action_hi: 'तुरंत ट्राइएज — मरीज़ को इमरजेंसी भेजें। कोड बुलाएं। मरीज़ को अकेले न चलने दें।',
    requiredSymptoms: ['chest_pain', 'dyspnea'],
    supportingSymptoms: ['diaphoresis', 'radiation_left_arm', 'radiation_jaw', 'crushing_pain', 'sudden_onset', 'exertion_trigger', 'palpitations'],
  },
  {
    id: 'rf_stroke',
    name_en: '🚨 Possible Stroke',
    name_hi: '🚨 संभावित स्ट्रोक',
    severity: 'critical',
    description_en: 'Sudden onset neurological symptoms suggestive of stroke.',
    description_hi: 'अचानक शुरू हुए तंत्रिका संबंधी लक्षण जो स्ट्रोक का संकेत हो सकते हैं।',
    action_en: 'IMMEDIATE TRIAGE — Note time of onset. FAST assessment. Route to stroke-ready facility.',
    action_hi: 'तुरंत ट्राइएज — शुरुआत का समय नोट करें। FAST जांच करें। स्ट्रोक-तैयार सुविधा में भेजें।',
    requiredSymptoms: ['sudden_onset', 'weakness_one_side'],
    supportingSymptoms: ['speech_difficulty', 'vision_change', 'severe_headache', 'confusion'],
  },
  {
    id: 'rf_meningitis',
    name_en: '🚨 Possible Meningitis / SAH',
    name_hi: '🚨 संभावित मेनिनजाइटिस',
    severity: 'critical',
    description_en: 'Worst headache with neck stiffness — rule out meningitis or subarachnoid hemorrhage.',
    description_hi: 'सबसे तेज़ सिरदर्द और गर्दन में अकड़न — मेनिनजाइटिस या सबअरेक्नॉइड हेमरेज को रूल-आउट करें।',
    action_en: 'URGENT — Route to emergency for LP and imaging. Isolate if infectious suspected.',
    action_hi: 'तुरंत — इमरजेंसी में LP और इमेजिंग के लिए भेजें। संक्रमण की शंका हो तो अलग रखें।',
    requiredSymptoms: ['severe_headache', 'neck_stiffness'],
    supportingSymptoms: ['fever', 'photophobia', 'confusion', 'rash', 'sudden_onset'],
  },
  {
    id: 'rf_acute_abdomen',
    name_en: '🚨 Acute Abdomen',
    name_hi: '🚨 तीव्र पेट दर्द',
    severity: 'critical',
    description_en: 'Severe abdominal pain with rigidity — possible surgical emergency.',
    description_hi: 'पेट में तेज़ दर्द और कड़ापन — संभावित सर्जिकल इमरजेंसी।',
    action_en: 'URGENT — NPO, IV access, surgical consult. Route to emergency.',
    action_hi: 'तुरंत — कुछ न खिलाएं, IV लगाएं, सर्जिकल सलाह लें। इमरजेंसी में भेजें।',
    requiredSymptoms: ['severe_abdominal_pain', 'abdominal_rigidity'],
    supportingSymptoms: ['vomiting', 'fever', 'no_bowel_sounds', 'rebound_tenderness'],
  },
  {
    id: 'rf_anaphylaxis',
    name_en: '🚨 Possible Anaphylaxis',
    name_hi: '🚨 संभावित एनाफिलैक्सिस',
    severity: 'critical',
    description_en: 'Acute allergic reaction with breathing difficulty.',
    description_hi: 'सांस की तकलीफ़ के साथ तीव्र एलर्जिक प्रतिक्रिया।',
    action_en: 'IMMEDIATE — Epinephrine, airway management, call emergency.',
    action_hi: 'तुरंत — एपिनेफ्रिन, वायुमार्ग प्रबंधन, इमरजेंसी बुलाएं।',
    requiredSymptoms: ['allergy_exposure', 'dyspnea'],
    supportingSymptoms: ['swelling_face', 'rash', 'hypotension', 'wheezing'],
  },
  {
    id: 'rf_hemoptysis',
    name_en: '⚠️ Hemoptysis with Weight Loss',
    name_hi: '⚠️ खांसी में खून और वज़न घटना',
    severity: 'urgent',
    description_en: 'Coughing blood with unintentional weight loss — urgent investigation needed.',
    description_hi: 'खांसी में खून आना और अनजाने में वज़न घटना — तुरंत जांच ज़रूरी।',
    action_en: 'URGENT — Priority chest X-ray, sputum for AFB, refer to pulmonologist.',
    action_hi: 'तुरंत — प्राथमिकता छाती एक्स-रे, बलगम AFB जांच, पल्मोनोलॉजिस्ट को रेफर करें।',
    requiredSymptoms: ['hemoptysis', 'weight_loss'],
    supportingSymptoms: ['chronic_cough', 'night_sweats', 'fever', 'smoking'],
  },
  {
    id: 'rf_dka',
    name_en: '⚠️ Possible DKA',
    name_hi: '⚠️ संभावित DKA',
    severity: 'urgent',
    description_en: 'Diabetic patient with excessive thirst, vomiting, and rapid breathing.',
    description_hi: 'मधुमेह रोगी में अत्यधिक प्यास, उल्टी, और तेज़ सांस।',
    action_en: 'URGENT — Check blood sugar stat. If >300 mg/dL with ketonuria, start IV fluids and insulin.',
    action_hi: 'तुरंत — रक्त शर्करा तुरंत जांचें। अगर 300 mg/dL से ज़्यादा हो, IV और इंसुलिन शुरू करें।',
    requiredSymptoms: ['diabetes_known', 'excessive_thirst', 'vomiting'],
    supportingSymptoms: ['rapid_breathing', 'abdominal_pain', 'confusion', 'fruity_breath'],
  },
];

/* ═══════════════════ Symptom Tag Mapping ═══════════════════ */

/**
 * Maps answer values (from question options) to red-flag symptom tags.
 * This is how we bridge "user tapped 'crushing pain'" to the detector's
 * concept of 'crushing_pain'.
 */
const ANSWER_TO_SYMPTOM_MAP: Record<string, string[]> = {
  // Chief complaint selections
  'cc_chest_pain':       ['chest_pain'],
  'cc_headache':         ['headache'],
  'cc_abdominal_pain':   ['abdominal_pain', 'severe_abdominal_pain'],
  'cc_breathing':        ['dyspnea'],
  'cc_cough_blood':      ['hemoptysis'],
  'cc_allergy':          ['allergy_exposure'],

  // SOCRATES: Onset
  'sudden':              ['sudden_onset'],

  // SOCRATES: Character
  'crushing':            ['crushing_pain'],
  'sharp':               ['sharp_pain'],

  // SOCRATES: Radiation
  'left_arm':            ['radiation_left_arm'],
  'jaw_neck':            ['radiation_jaw'],

  // SOCRATES: Associations
  'breathless':          ['dyspnea'],
  'sweating':            ['diaphoresis'],
  'nausea':              ['nausea', 'vomiting'],
  'palpitations':        ['palpitations'],
  'fever':               ['fever'],
  'dizziness':           ['dizziness'],
  'vision_change':       ['vision_change'],
  'weakness':            ['weakness_one_side'],

  // SOCRATES: Exacerbating
  'exertion':            ['exertion_trigger'],

  // SOCRATES: Relieving
  'nothing':             ['nothing_relieves'],

  // SOCRATES: Severity (high scores)
  'pain_9':              ['severe_pain'],
  'pain_10':             ['severe_pain'],

  // Past medical
  'pmh_diabetes':        ['diabetes_known'],
  'pmh_hypertension':    ['hypertension_known'],

  // Other symptoms
  'excessive_thirst':    ['excessive_thirst'],
  'weight_loss':         ['weight_loss'],
  'neck_stiffness':      ['neck_stiffness'],
};

/* ═══════════════════ Detector Functions ═══════════════════ */

/**
 * Extracts all active symptom tags from the current set of answers.
 */
function extractSymptomTags(answers: Map<string, InterviewAnswer>): Set<string> {
  const tags = new Set<string>();

  for (const answer of answers.values()) {
    const values = Array.isArray(answer.value)
      ? answer.value
      : [String(answer.value)];

    for (const val of values) {
      // Check direct mapping
      const mapped = ANSWER_TO_SYMPTOM_MAP[val];
      if (mapped) {
        mapped.forEach((tag) => tags.add(tag));
      }

      // Special case: pain severity >= 8
      if (answer.questionId === 'socrates_severity') {
        const numVal = typeof answer.value === 'number' ? answer.value : parseInt(String(answer.value), 10);
        if (numVal >= 8) tags.add('severe_pain');
        if (numVal >= 9) {
          // Map to appropriate severity tag
          ANSWER_TO_SYMPTOM_MAP[`pain_${numVal}`]?.forEach((t) => tags.add(t));
        }
      }

      // Special case: chief complaint pain site → chest pain
      if (answer.questionId === 'socrates_site') {
        if (val === 'chest_left' || val === 'chest_right' || val === 'chest_center') {
          tags.add('chest_pain');
        }
        if (val === 'head' || val === 'forehead') {
          tags.add('headache');
          // Check severity for "worst headache"
          const severityAnswer = answers.get('socrates_severity');
          if (severityAnswer) {
            const sev = typeof severityAnswer.value === 'number'
              ? severityAnswer.value
              : parseInt(String(severityAnswer.value), 10);
            if (sev >= 9) tags.add('severe_headache');
          }
        }
        if (val === 'upper_abdomen' || val === 'lower_abdomen') {
          tags.add('abdominal_pain');
          tags.add('severe_abdominal_pain');
        }
      }
    }
  }

  return tags;
}

/**
 * Check all red-flag rules against the current symptom set.
 *
 * Returns an array of triggered alerts, sorted by severity
 * (critical first, then urgent, then warning).
 */
export function detectRedFlags(answers: Map<string, InterviewAnswer>): RedFlagAlert[] {
  const symptomTags = extractSymptomTags(answers);
  const alerts: RedFlagAlert[] = [];

  for (const rule of RED_FLAG_RULES) {
    // ALL required symptoms must be present
    const requiredMet = rule.requiredSymptoms.every((s: string) => symptomTags.has(s));
    if (!requiredMet) continue;

    // Check how many supporting symptoms match (for confidence)
    const matchedSupporting = (rule.supportingSymptoms || []).filter((s: string) =>
      symptomTags.has(s),
    );

    // Find which answer IDs contributed
    const matchedAnswers: string[] = [];
    for (const [, answer] of answers) {
      const values = Array.isArray(answer.value)
        ? answer.value
        : [String(answer.value)];

      for (const val of values) {
        const mapped = ANSWER_TO_SYMPTOM_MAP[val] || [];
        const isRelevant = mapped.some(
          (tag) =>
            rule.requiredSymptoms.includes(tag) ||
            (rule.supportingSymptoms || []).includes(tag),
        );
        if (isRelevant && !matchedAnswers.includes(answer.questionId)) {
          matchedAnswers.push(answer.questionId);
        }
      }
    }

    // Only trigger if we have required + at least one supporting symptom
    // OR if the rule has no supporting symptoms defined
    if (matchedSupporting.length > 0 || !rule.supportingSymptoms?.length) {
      alerts.push({
        rule,
        matchedAnswers,
        triggeredAt: new Date().toISOString(),
      });
    }
  }

  // Sort: critical → urgent → warning
  const severityOrder: Record<string, number> = { critical: 0, urgent: 1, warning: 2 };
  alerts.sort((a, b) => severityOrder[a.rule.severity] - severityOrder[b.rule.severity]);

  return alerts;
}

/**
 * Quick check — does the current answer set trigger any CRITICAL alerts?
 */
export function hasCriticalRedFlag(answers: Map<string, InterviewAnswer>): boolean {
  return detectRedFlags(answers).some((a) => a.rule.severity === 'critical');
}
