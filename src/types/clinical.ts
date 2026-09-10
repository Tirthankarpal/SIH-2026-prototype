/**
 * Clinical Types — Core type definitions for the interview engine.
 *
 * These types define the structure of questions, answers, sections,
 * branching rules, and the interview session state.
 */

/* ═══════════════════ Question Types ═══════════════════ */

/** All possible question input modes */
export type QuestionType =
  | 'single_choice'   // Tap one option
  | 'multi_choice'    // Tap multiple options
  | 'yes_no'          // Binary yes/no
  | 'voice_open'      // Open-ended voice/text input
  | 'pain_scale'      // 0-10 visual pain scale
  | 'body_region'     // Tap on body diagram
  | 'number_input';   // Numeric entry (age, weight, etc.)

/** Clinical interview section categories */
export type SectionId =
  | 'chief_complaint'
  | 'hpi'              // History of Present Illness
  | 'socrates'         // SOCRATES pain assessment
  | 'past_medical'
  | 'medications'
  | 'allergies'
  | 'family_history'
  | 'social_history'
  | 'review_of_systems'
  // AYUSH (Dashavidha Pariksha) Sections
  | 'ayush_prakriti'
  | 'ayush_vikriti'
  | 'ayush_sara'
  | 'ayush_samhanana'
  | 'ayush_pramana'
  | 'ayush_satmya'
  | 'ayush_satva'
  | 'ayush_ahara'
  | 'ayush_vyayama';

/** Section metadata for display */
export interface SectionMeta {
  id: SectionId;
  label_en: string;
  label_hi: string;
  icon: string;
  /** Order in the interview flow (lower = earlier) */
  order: number;
}

/** A selectable option for choice-type questions */
export interface QuestionOption {
  id: string;
  label_en: string;
  label_hi: string;
  icon?: string;
  /** If selecting this option should trigger a specific branch */
  branchTo?: string;
  /** If this option is a red-flag indicator */
  isRedFlag?: boolean;
}

/** Condition for showing/skipping a question */
export interface BranchCondition {
  /** Question ID whose answer determines this branch */
  questionId: string;
  /** Operator for comparison */
  operator: 'equals' | 'includes' | 'not_equals' | 'any';
  /** Value(s) to compare against */
  value: string | string[];
}

/** A single interview question */
export interface InterviewQuestion {
  id: string;
  section: SectionId;
  type: QuestionType;
  text_en: string;
  text_hi: string;
  /** Help text / additional instruction */
  help_en?: string;
  help_hi?: string;
  /** Available options (for choice/yes_no types) */
  options?: QuestionOption[];
  /** Whether this question allows voice input alongside options */
  allowVoice?: boolean;
  /** Conditions that must be met for this question to appear */
  showIf?: BranchCondition[];
  /** Conditions that cause this question to be skipped */
  skipIf?: BranchCondition[];
  /** If true, this question is required before proceeding */
  required?: boolean;
  /** Min/max for numeric inputs */
  min?: number;
  max?: number;
  /** For pain_scale: emoji set to display */
  scaleEmojis?: string[];
  /** Which body regions are valid for body_region type */
  validRegions?: string[];
  /** Tags for red-flag detection cross-referencing */
  redFlagTags?: string[];
}

/* ═══════════════════ Answer Types ═══════════════════ */

/** A recorded answer to a question */
export interface InterviewAnswer {
  questionId: string;
  section: SectionId;
  /** The raw value(s) selected or spoken */
  value: string | string[] | number;
  /** Display-friendly text of the answer */
  displayText_en: string;
  displayText_hi: string;
  /** Whether this was entered via voice or touch */
  inputMethod: 'voice' | 'touch' | 'demo';
  /** ISO timestamp when answered */
  timestamp: string;
  /** Confidence score if from voice recognition */
  confidence?: number;
}

/* ═══════════════════ Red Flag Types ═══════════════════ */

/** Severity level for red-flag alerts */
export type RedFlagSeverity = 'critical' | 'urgent' | 'warning';

/** A red-flag rule definition */
export interface RedFlagRule {
  id: string;
  name_en: string;
  name_hi: string;
  severity: RedFlagSeverity;
  /** Description of the clinical concern */
  description_en: string;
  description_hi: string;
  /** What action triage staff should take */
  action_en: string;
  action_hi: string;
  /** Required symptom combination: ALL of these must be present */
  requiredSymptoms: string[];
  /** Optional supporting symptoms: ANY of these increases confidence */
  supportingSymptoms?: string[];
}

/** A triggered red-flag alert */
export interface RedFlagAlert {
  rule: RedFlagRule;
  /** Which answer IDs matched this rule */
  matchedAnswers: string[];
  /** Timestamp when triggered */
  triggeredAt: string;
}

/* ═══════════════════ Session State ═══════════════════ */

/** The full interview session state */
export interface InterviewSession {
  /** Unique session ID */
  sessionId: string;
  /** Patient's selected language */
  language: 'en-IN' | 'hi-IN';
  /** Interview mode */
  mode: 'modern' | 'ayush';
  /** Current section being assessed */
  currentSection: SectionId;
  /** Current question index within the active question list */
  currentQuestionIndex: number;
  /** All answered questions */
  answers: Map<string, InterviewAnswer>;
  /** Active red-flag alerts */
  redFlags: RedFlagAlert[];
  /** Sections that have been completed */
  completedSections: SectionId[];
  /** Session start time */
  startedAt: string;
  /** Whether the interview is complete */
  isComplete: boolean;
}

/* ═══════════════════ Summary Types ═══════════════════ */

/** Structured clinical summary output */
export interface ClinicalSummary {
  chiefComplaint: string;
  hpiNarrative: string;
  socratesAssessment?: {
    site: string;
    onset: string;
    character: string;
    radiation: string;
    associations: string;
    timeCourse: string;
    exacerbating: string;
    severity: string;
  };
  pastMedicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  familyHistory: string[];
  socialHistory: {
    smoking?: string;
    alcohol?: string;
    occupation?: string;
    diet?: string;
  };
  reviewOfSystems: Record<string, string[]>;
  redFlagAlerts: RedFlagAlert[];
}

/* ═══════════════════ Body Region Types ═══════════════════ */

/** Body regions for pain localization */
export type BodyRegion =
  | 'head'
  | 'forehead'
  | 'eyes'
  | 'ears'
  | 'nose_throat'
  | 'neck'
  | 'chest_left'
  | 'chest_right'
  | 'chest_center'
  | 'upper_abdomen'
  | 'lower_abdomen'
  | 'left_shoulder'
  | 'right_shoulder'
  | 'left_arm'
  | 'right_arm'
  | 'left_hand'
  | 'right_hand'
  | 'upper_back'
  | 'lower_back'
  | 'left_hip'
  | 'right_hip'
  | 'left_knee'
  | 'right_knee'
  | 'left_leg'
  | 'right_leg'
  | 'left_foot'
  | 'right_foot';

/** Label mapping for body regions */
export const BODY_REGION_LABELS: Record<BodyRegion, { en: string; hi: string }> = {
  head:           { en: 'Head',            hi: 'सिर' },
  forehead:       { en: 'Forehead',        hi: 'माथा' },
  eyes:           { en: 'Eyes',            hi: 'आँखें' },
  ears:           { en: 'Ears',            hi: 'कान' },
  nose_throat:    { en: 'Nose / Throat',   hi: 'नाक / गला' },
  neck:           { en: 'Neck',            hi: 'गर्दन' },
  chest_left:     { en: 'Left Chest',      hi: 'बायाँ सीना' },
  chest_right:    { en: 'Right Chest',     hi: 'दायाँ सीना' },
  chest_center:   { en: 'Center Chest',    hi: 'छाती के बीच' },
  upper_abdomen:  { en: 'Upper Abdomen',   hi: 'पेट ऊपरी हिस्सा' },
  lower_abdomen:  { en: 'Lower Abdomen',   hi: 'पेट निचला हिस्सा' },
  left_shoulder:  { en: 'Left Shoulder',   hi: 'बायाँ कंधा' },
  right_shoulder: { en: 'Right Shoulder',  hi: 'दायाँ कंधा' },
  left_arm:       { en: 'Left Arm',        hi: 'बायाँ हाथ' },
  right_arm:      { en: 'Right Arm',       hi: 'दायाँ हाथ' },
  left_hand:      { en: 'Left Hand',       hi: 'बायाँ हथेली' },
  right_hand:     { en: 'Right Hand',      hi: 'दायाँ हथेली' },
  upper_back:     { en: 'Upper Back',      hi: 'ऊपरी पीठ' },
  lower_back:     { en: 'Lower Back',      hi: 'कमर' },
  left_hip:       { en: 'Left Hip',        hi: 'बायाँ कूल्हा' },
  right_hip:      { en: 'Right Hip',       hi: 'दायाँ कूल्हा' },
  left_knee:      { en: 'Left Knee',       hi: 'बायाँ घुटना' },
  right_knee:     { en: 'Right Knee',      hi: 'दायाँ घुटना' },
  left_leg:       { en: 'Left Leg',        hi: 'बायाँ पैर' },
  right_leg:      { en: 'Right Leg',       hi: 'दायाँ पैर' },
  left_foot:      { en: 'Left Foot',       hi: 'बायाँ पंजा' },
  right_foot:     { en: 'Right Foot',      hi: 'दायाँ पंजा' },
};

/* ═══════════════════ Section Definitions ═══════════════════ */

export const SECTIONS: SectionMeta[] = [
  { id: 'chief_complaint',   label_en: 'Chief Complaint',       label_hi: 'मुख्य शिकायत',        icon: '🩺', order: 1 },
  { id: 'hpi',               label_en: 'History of Present Illness', label_hi: 'वर्तमान बीमारी का इतिहास', icon: '📋', order: 2 },
  { id: 'socrates',          label_en: 'Pain Assessment',       label_hi: 'दर्द मूल्यांकन',       icon: '🎯', order: 3 },
  { id: 'past_medical',      label_en: 'Past Medical History',  label_hi: 'पिछला चिकित्सा इतिहास', icon: '🏥', order: 4 },
  { id: 'medications',       label_en: 'Current Medications',   label_hi: 'वर्तमान दवाइयाँ',      icon: '💊', order: 5 },
  { id: 'allergies',         label_en: 'Allergies',             label_hi: 'एलर्जी',              icon: '⚠️', order: 6 },
  { id: 'family_history',    label_en: 'Family History',        label_hi: 'पारिवारिक इतिहास',     icon: '👨‍👩‍👧‍👦', order: 7 },
  { id: 'social_history',    label_en: 'Social History',        label_hi: 'सामाजिक इतिहास',      icon: '🏠', order: 8 },
  { id: 'review_of_systems', label_en: 'Review of Systems',     label_hi: 'प्रणालीगत समीक्षा',    icon: '🔍', order: 9 },
  // AYUSH Sections
  { id: 'ayush_prakriti',    label_en: 'Prakriti (Constitution)', label_hi: 'प्रकृति',           icon: '🌿', order: 10 },
  { id: 'ayush_vikriti',     label_en: 'Vikriti (Imbalance)',     label_hi: 'विकृति',           icon: '⚖️', order: 11 },
  { id: 'ayush_sara',        label_en: 'Sara (Tissue Quality)',   label_hi: 'सार',             icon: '🧬', order: 12 },
  { id: 'ayush_samhanana',   label_en: 'Samhanana (Build)',       label_hi: 'संहनन',           icon: '🧍', order: 13 },
  { id: 'ayush_pramana',     label_en: 'Pramana (Proportions)',   label_hi: 'प्रमाण',           icon: '📏', order: 14 },
  { id: 'ayush_satmya',      label_en: 'Satmya (Adaptability)',   label_hi: 'सात्म्य',           icon: '🔄', order: 15 },
  { id: 'ayush_satva',       label_en: 'Satva (Mind)',            label_hi: 'सत्व',            icon: '🧠', order: 16 },
  { id: 'ayush_ahara',       label_en: 'Ahara (Digestion)',       label_hi: 'आहार शक्ति',        icon: '🍽️', order: 17 },
  { id: 'ayush_vyayama',     label_en: 'Vyayama (Exercise)',      label_hi: 'व्यायाम शक्ति',      icon: '💪', order: 18 },
];
