/**
 * Question Bank — All interview questions across all sections.
 *
 * Questions are organized by section and include branching conditions
 * for dynamic flow based on the patient's chief complaint.
 */

import type { InterviewQuestion } from '../../../types/clinical';
import { SOCRATES_QUESTIONS } from './socratesFramework';
import { AYUSH_QUESTION_BANK } from '../../ayush/engine/dashavidhaQuestions';

/* ═══════════════════ Chief Complaint ═══════════════════ */

const CHIEF_COMPLAINT_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'cc_main',
    section: 'chief_complaint',
    type: 'single_choice',
    text_en: 'What is your main health problem today?',
    text_hi: 'आज आपकी मुख्य स्वास्थ्य समस्या क्या है?',
    help_en: 'Select the problem that is bothering you the most right now.',
    help_hi: 'वो समस्या चुनें जो अभी सबसे ज़्यादा परेशान कर रही है।',
    allowVoice: true,
    required: true,
    options: [
      { id: 'cc_chest_pain',       label_en: 'Chest Pain',             label_hi: 'सीने में दर्द',          icon: '❤️‍🩹', branchTo: 'socrates', isRedFlag: true },
      { id: 'cc_headache',         label_en: 'Headache',               label_hi: 'सिरदर्द',               icon: '🤕',  branchTo: 'socrates' },
      { id: 'cc_abdominal_pain',   label_en: 'Stomach / Abdominal Pain', label_hi: 'पेट दर्द',            icon: '🤢',  branchTo: 'socrates' },
      { id: 'cc_fever',            label_en: 'Fever',                  label_hi: 'बुखार',                 icon: '🌡️',  branchTo: 'hpi' },
      { id: 'cc_cough',            label_en: 'Cough / Cold',           label_hi: 'खांसी / सर्दी',          icon: '🤧',  branchTo: 'hpi' },
      { id: 'cc_breathing',        label_en: 'Breathing Difficulty',   label_hi: 'सांस लेने में तकलीफ',    icon: '😮‍💨', branchTo: 'hpi', isRedFlag: true },
      { id: 'cc_joint_pain',       label_en: 'Joint / Bone Pain',     label_hi: 'जोड़ों / हड्डी का दर्द',  icon: '🦴',  branchTo: 'socrates' },
      { id: 'cc_back_pain',        label_en: 'Back Pain',              label_hi: 'कमर दर्द',              icon: '🔙',  branchTo: 'socrates' },
      { id: 'cc_skin',             label_en: 'Skin Problem / Rash',    label_hi: 'त्वचा समस्या / दाने',    icon: '🩹',  branchTo: 'hpi' },
      { id: 'cc_diabetes',         label_en: 'Diabetes Follow-up',     label_hi: 'मधुमेह जांच',           icon: '💉',  branchTo: 'hpi' },
      { id: 'cc_eye',              label_en: 'Eye Problem',            label_hi: 'आँखों की समस्या',        icon: '👁️',  branchTo: 'hpi' },
      { id: 'cc_ear',              label_en: 'Ear Problem / Hearing',  label_hi: 'कान की समस्या',         icon: '👂',  branchTo: 'hpi' },
      { id: 'cc_urinary',          label_en: 'Urinary Problem',        label_hi: 'पेशाब की समस्या',       icon: '🚽',  branchTo: 'hpi' },
      { id: 'cc_weakness',         label_en: 'Weakness / Fatigue',     label_hi: 'कमज़ोरी / थकान',        icon: '😫',  branchTo: 'hpi' },
      { id: 'cc_other',            label_en: 'Other',                  label_hi: 'अन्य',                 icon: '📝',  branchTo: 'hpi' },
    ],
  },
  {
    id: 'cc_duration',
    section: 'chief_complaint',
    type: 'single_choice',
    text_en: 'How long have you had this problem?',
    text_hi: 'यह समस्या कितने समय से है?',
    allowVoice: true,
    required: true,
    options: [
      { id: 'hours',    label_en: 'A few hours',       label_hi: 'कुछ घंटे',         icon: '⏰' },
      { id: '1day',     label_en: 'Since today',       label_hi: 'आज से',           icon: '📅' },
      { id: 'days',     label_en: '2–7 days',          label_hi: '2–7 दिन',         icon: '📅' },
      { id: 'weeks',    label_en: '1–4 weeks',         label_hi: '1–4 हफ्ते',        icon: '📅' },
      { id: 'months',   label_en: '1–6 months',        label_hi: '1–6 महीने',        icon: '📅' },
      { id: 'long',     label_en: 'More than 6 months',label_hi: '6 महीने से ज़्यादा', icon: '📅' },
    ],
  },
];

/* ═══════════════════ History of Present Illness ═══════════════════ */

const HPI_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'hpi_describe',
    section: 'hpi',
    type: 'voice_open',
    text_en: 'Tell us more about your problem. When did it start? How is it getting worse or better?',
    text_hi: 'अपनी समस्या के बारे में और बताएं। यह कब शुरू हुई? क्या यह बढ़ रही है या कम हो रही है?',
    help_en: 'Speak in your own words. Tell us everything you think the doctor should know.',
    help_hi: 'अपने शब्दों में बताएं। डॉक्टर को जो कुछ भी बताना चाहते हैं, बता दें।',
    allowVoice: true,
    required: true,
  },
  {
    id: 'hpi_severity',
    section: 'hpi',
    type: 'single_choice',
    text_en: 'How much is this problem affecting your daily life?',
    text_hi: 'यह समस्या आपकी रोज़मर्रा की ज़िंदगी पर कितना असर डाल रही है?',
    allowVoice: true,
    options: [
      { id: 'mild',     label_en: 'Mild — I can do my work',        label_hi: 'हल्का — काम कर पा रहा हूँ',     icon: '🟢' },
      { id: 'moderate', label_en: 'Moderate — Some difficulty',     label_hi: 'मध्यम — कुछ परेशानी',           icon: '🟡' },
      { id: 'severe',   label_en: 'Severe — Cannot work / rest',   label_hi: 'गंभीर — काम / आराम नहीं कर पा रहा', icon: '🔴' },
    ],
  },
  {
    id: 'hpi_first_time',
    section: 'hpi',
    type: 'yes_no',
    text_en: 'Is this the first time you are having this problem?',
    text_hi: 'क्या यह पहली बार हो रहा है?',
    allowVoice: true,
    options: [
      { id: 'yes', label_en: 'Yes, first time',      label_hi: 'हाँ, पहली बार',       icon: '✅' },
      { id: 'no',  label_en: 'No, happened before',  label_hi: 'नहीं, पहले भी हुआ',    icon: '🔄' },
    ],
  },
  {
    id: 'hpi_treatment_tried',
    section: 'hpi',
    type: 'voice_open',
    text_en: 'Have you taken any medicine or treatment for this problem? If yes, what did you take?',
    text_hi: 'क्या आपने इस समस्या के लिए कोई दवाई या इलाज लिया है? अगर हाँ, तो क्या लिया?',
    allowVoice: true,
  },
];

/* ═══════════════════ Past Medical History ═══════════════════ */

const PAST_MEDICAL_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'pmh_conditions',
    section: 'past_medical',
    type: 'multi_choice',
    text_en: 'Do you have any of these health conditions? Select all that apply.',
    text_hi: 'क्या आपको इनमें से कोई बीमारी है? सब चुनें जो लागू हों।',
    allowVoice: true,
    required: true,
    options: [
      { id: 'pmh_diabetes',       label_en: 'Diabetes (Sugar)',         label_hi: 'मधुमेह (शुगर)',          icon: '💉' },
      { id: 'pmh_hypertension',   label_en: 'High Blood Pressure',     label_hi: 'उच्च रक्तचाप (BP)',      icon: '❤️' },
      { id: 'pmh_heart',          label_en: 'Heart Disease',           label_hi: 'हृदय रोग',              icon: '🫀' },
      { id: 'pmh_asthma',         label_en: 'Asthma / Lung Disease',  label_hi: 'दमा / फेफड़ों की बीमारी', icon: '🫁' },
      { id: 'pmh_thyroid',        label_en: 'Thyroid Problem',         label_hi: 'थायरॉयड',               icon: '🦋' },
      { id: 'pmh_kidney',         label_en: 'Kidney Disease',          label_hi: 'गुर्दे की बीमारी',       icon: '🫘' },
      { id: 'pmh_liver',          label_en: 'Liver Disease',           label_hi: 'जिगर की बीमारी',        icon: '🫀' },
      { id: 'pmh_tb',             label_en: 'Tuberculosis (TB)',       label_hi: 'टीबी',                  icon: '🦠' },
      { id: 'pmh_cancer',         label_en: 'Cancer',                  label_hi: 'कैंसर',                 icon: '🎗️' },
      { id: 'pmh_none',           label_en: 'None of these',           label_hi: 'इनमें से कोई नहीं',      icon: '✅' },
    ],
  },
  {
    id: 'pmh_surgery',
    section: 'past_medical',
    type: 'yes_no',
    text_en: 'Have you ever had any surgery or been admitted to a hospital?',
    text_hi: 'क्या कभी कोई ऑपरेशन हुआ है या अस्पताल में भर्ती हुए हैं?',
    allowVoice: true,
    options: [
      { id: 'yes', label_en: 'Yes',  label_hi: 'हाँ', icon: '✅' },
      { id: 'no',  label_en: 'No',   label_hi: 'नहीं', icon: '❌' },
    ],
  },
  {
    id: 'pmh_surgery_details',
    section: 'past_medical',
    type: 'voice_open',
    text_en: 'Please tell us about your surgery or hospitalization.',
    text_hi: 'कृपया अपने ऑपरेशन या भर्ती के बारे में बताएं।',
    allowVoice: true,
    showIf: [{ questionId: 'pmh_surgery', operator: 'equals', value: 'yes' }],
  },
];

/* ═══════════════════ Medications ═══════════════════ */

const MEDICATION_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'med_taking',
    section: 'medications',
    type: 'yes_no',
    text_en: 'Are you currently taking any medicines regularly?',
    text_hi: 'क्या आप अभी नियमित रूप से कोई दवाई ले रहे हैं?',
    allowVoice: true,
    required: true,
    options: [
      { id: 'yes', label_en: 'Yes',  label_hi: 'हाँ', icon: '💊' },
      { id: 'no',  label_en: 'No',   label_hi: 'नहीं', icon: '❌' },
    ],
  },
  {
    id: 'med_list',
    section: 'medications',
    type: 'voice_open',
    text_en: 'Please tell us the names and doses of your medicines. You can also show us your prescription.',
    text_hi: 'कृपया अपनी दवाइयों के नाम और खुराक बताएं। आप अपना प्रिस्क्रिप्शन भी दिखा सकते हैं।',
    help_en: 'For example: "Metformin 500 mg twice a day, Amlodipine 5 mg once a day"',
    help_hi: 'उदाहरण: "Metformin 500 mg दिन में दो बार, Amlodipine 5 mg दिन में एक बार"',
    allowVoice: true,
    showIf: [{ questionId: 'med_taking', operator: 'equals', value: 'yes' }],
  },
];

/* ═══════════════════ Allergies ═══════════════════ */

const ALLERGY_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'allergy_has',
    section: 'allergies',
    type: 'yes_no',
    text_en: 'Do you have any allergies to medicines, food, or anything else?',
    text_hi: 'क्या आपको किसी दवाई, खाने, या किसी अन्य चीज़ से एलर्जी है?',
    allowVoice: true,
    required: true,
    options: [
      { id: 'yes',     label_en: 'Yes',       label_hi: 'हाँ',         icon: '⚠️' },
      { id: 'no',      label_en: 'No',        label_hi: 'नहीं',        icon: '✅' },
      { id: 'unsure',  label_en: 'Not sure',  label_hi: 'पक्का नहीं', icon: '🤷' },
    ],
  },
  {
    id: 'allergy_details',
    section: 'allergies',
    type: 'voice_open',
    text_en: 'Please describe your allergies and what reaction you get.',
    text_hi: 'कृपया अपनी एलर्जी और क्या प्रतिक्रिया होती है बताएं।',
    allowVoice: true,
    showIf: [{ questionId: 'allergy_has', operator: 'equals', value: 'yes' }],
  },
];

/* ═══════════════════ Family History ═══════════════════ */

const FAMILY_HISTORY_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'fh_conditions',
    section: 'family_history',
    type: 'multi_choice',
    text_en: 'Does anyone in your family (parents, siblings) have any of these conditions?',
    text_hi: 'क्या आपके परिवार (माता-पिता, भाई-बहन) में किसी को इनमें से कोई बीमारी है?',
    allowVoice: true,
    options: [
      { id: 'fh_diabetes',     label_en: 'Diabetes',             label_hi: 'मधुमेह',           icon: '💉' },
      { id: 'fh_heart',        label_en: 'Heart Disease',        label_hi: 'हृदय रोग',         icon: '❤️' },
      { id: 'fh_bp',           label_en: 'High Blood Pressure',  label_hi: 'उच्च रक्तचाप',     icon: '❤️' },
      { id: 'fh_cancer',       label_en: 'Cancer',               label_hi: 'कैंसर',            icon: '🎗️' },
      { id: 'fh_asthma',       label_en: 'Asthma',               label_hi: 'दमा',              icon: '🫁' },
      { id: 'fh_tb',           label_en: 'Tuberculosis',         label_hi: 'टीबी',             icon: '🦠' },
      { id: 'fh_none',         label_en: 'None / Not sure',      label_hi: 'कोई नहीं / पता नहीं', icon: '✅' },
    ],
  },
];

/* ═══════════════════ Social History ═══════════════════ */

const SOCIAL_HISTORY_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'sh_smoking',
    section: 'social_history',
    type: 'single_choice',
    text_en: 'Do you smoke or use tobacco in any form?',
    text_hi: 'क्या आप धूम्रपान करते हैं या किसी रूप में तंबाकू का उपयोग करते हैं?',
    allowVoice: true,
    options: [
      { id: 'current',     label_en: 'Yes, currently',        label_hi: 'हाँ, अभी करता हूँ',     icon: '🚬' },
      { id: 'former',      label_en: 'Used to, quit now',     label_hi: 'पहले करता था, छोड़ दिया', icon: '🚭' },
      { id: 'never',       label_en: 'Never',                 label_hi: 'कभी नहीं',             icon: '✅' },
    ],
  },
  {
    id: 'sh_alcohol',
    section: 'social_history',
    type: 'single_choice',
    text_en: 'Do you drink alcohol?',
    text_hi: 'क्या आप शराब पीते हैं?',
    allowVoice: true,
    options: [
      { id: 'regular',     label_en: 'Yes, regularly',        label_hi: 'हाँ, नियमित',          icon: '🍺' },
      { id: 'occasional',  label_en: 'Occasionally',          label_hi: 'कभी-कभी',             icon: '🍷' },
      { id: 'never',       label_en: 'Never',                 label_hi: 'कभी नहीं',             icon: '✅' },
    ],
  },
  {
    id: 'sh_occupation',
    section: 'social_history',
    type: 'voice_open',
    text_en: 'What is your occupation? What work do you do?',
    text_hi: 'आपका पेशा क्या है? आप क्या काम करते हैं?',
    allowVoice: true,
  },
];

/* ═══════════════════ Review of Systems ═══════════════════ */

const ROS_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'ros_general',
    section: 'review_of_systems',
    type: 'multi_choice',
    text_en: 'In the last few weeks, have you experienced any of these? Select all that apply.',
    text_hi: 'पिछले कुछ हफ्तों में, क्या आपको इनमें से कुछ हुआ? सब चुनें जो लागू हों।',
    allowVoice: true,
    options: [
      { id: 'ros_weight_loss',    label_en: 'Unexplained weight loss',  label_hi: 'बिना कारण वज़न घटना',    icon: '⚖️', isRedFlag: true },
      { id: 'ros_night_sweats',   label_en: 'Night sweats',             label_hi: 'रात को पसीना',          icon: '🌙' },
      { id: 'ros_appetite_loss',  label_en: 'Loss of appetite',         label_hi: 'भूख न लगना',            icon: '🍽️' },
      { id: 'ros_sleep',          label_en: 'Sleep problems',           label_hi: 'नींद की समस्या',        icon: '😴' },
      { id: 'ros_mood',           label_en: 'Feeling sad / anxious',    label_hi: 'उदास / चिंतित',         icon: '😔' },
      { id: 'ros_urinary',        label_en: 'Urinary changes',          label_hi: 'पेशाब में बदलाव',       icon: '🚽' },
      { id: 'ros_bowel',          label_en: 'Bowel changes',            label_hi: 'मल में बदलाव',          icon: '🔄' },
      { id: 'ros_none',           label_en: 'None of these',            label_hi: 'इनमें से कोई नहीं',      icon: '✅' },
    ],
  },
  {
    id: 'ros_anything_else',
    section: 'review_of_systems',
    type: 'voice_open',
    text_en: 'Is there anything else you want to tell the doctor?',
    text_hi: 'क्या आप डॉक्टर को कुछ और बताना चाहते हैं?',
    help_en: 'This is your chance to share anything else on your mind.',
    help_hi: 'यह आपका मौका है कोई भी बात बताने का जो आपके मन में हो।',
    allowVoice: true,
  },
];

/* ═══════════════════ Master Question Bank ═══════════════════ */

/**
 * All questions in the interview, organized by section.
 * The branching engine uses this to determine which questions
 * to present and in what order.
 */
export const QUESTION_BANK: InterviewQuestion[] = [
  ...CHIEF_COMPLAINT_QUESTIONS,
  ...HPI_QUESTIONS,
  ...SOCRATES_QUESTIONS,
  ...PAST_MEDICAL_QUESTIONS,
  ...MEDICATION_QUESTIONS,
  ...ALLERGY_QUESTIONS,
  ...FAMILY_HISTORY_QUESTIONS,
  ...SOCIAL_HISTORY_QUESTIONS,
  ...ROS_QUESTIONS,
  ...AYUSH_QUESTION_BANK,
];

/**
 * Get all questions for a specific section.
 */
export function getQuestionsForSection(sectionId: string): InterviewQuestion[] {
  return QUESTION_BANK.filter((q) => q.section === sectionId);
}

/**
 * Get a single question by its ID.
 */
export function getQuestionById(id: string): InterviewQuestion | undefined {
  return QUESTION_BANK.find((q) => q.id === id);
}
