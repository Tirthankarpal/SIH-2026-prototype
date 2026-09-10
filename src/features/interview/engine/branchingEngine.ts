/**
 * Branching Engine — State machine that drives the interview flow.
 *
 * Determines which question to show next based on:
 *   1. Chief complaint → determines section order (pain → SOCRATES first)
 *   2. Branch conditions on individual questions (showIf / skipIf)
 *   3. Section completion tracking
 *
 * This is a pure-logic module with no React dependencies — it takes
 * the current answers and returns the next question to display.
 */

import type {
  InterviewQuestion,
  InterviewAnswer,
  SectionId,
  BranchCondition,
  RedFlagAlert,
} from '../../../types/clinical';
import { QUESTION_BANK } from './questionBank';
import { detectRedFlags } from './redFlagDetector';

/* ═══════════════════ Section Flow ═══════════════════ */

/**
 * Standard section order for modern medicine interview.
 * Pain-related complaints insert SOCRATES after chief complaint.
 * Non-pain complaints skip SOCRATES.
 */
const SECTION_ORDER_WITH_PAIN: SectionId[] = [
  'chief_complaint',
  'socrates',
  'hpi',
  'past_medical',
  'medications',
  'allergies',
  'family_history',
  'social_history',
  'review_of_systems',
];

const SECTION_ORDER_WITHOUT_PAIN: SectionId[] = [
  'chief_complaint',
  'hpi',
  'past_medical',
  'medications',
  'allergies',
  'family_history',
  'social_history',
  'review_of_systems',
];

const SECTION_ORDER_AYUSH_WITH_PAIN: SectionId[] = [
  'chief_complaint',
  'socrates',
  'ayush_prakriti',
  'ayush_vikriti',
  'ayush_sara',
  'ayush_samhanana',
  'ayush_satmya',
  'ayush_satva',
  'ayush_ahara',
  'ayush_vyayama'
];

const SECTION_ORDER_AYUSH_WITHOUT_PAIN: SectionId[] = [
  'chief_complaint',
  'ayush_prakriti',
  'ayush_vikriti',
  'ayush_sara',
  'ayush_samhanana',
  'ayush_satmya',
  'ayush_satva',
  'ayush_ahara',
  'ayush_vyayama'
];

/** Chief complaints that trigger SOCRATES pain assessment */
const PAIN_COMPLAINTS = new Set([
  'cc_chest_pain',
  'cc_headache',
  'cc_abdominal_pain',
  'cc_joint_pain',
  'cc_back_pain',
]);

/* ═══════════════════ Condition Evaluator ═══════════════════ */

/**
 * Evaluate whether a branch condition is met by the current answers.
 */
function evaluateCondition(
  condition: BranchCondition,
  answers: Map<string, InterviewAnswer>,
): boolean {
  const answer = answers.get(condition.questionId);
  if (!answer) return false;

  const answerValues = Array.isArray(answer.value)
    ? answer.value
    : [String(answer.value)];

  switch (condition.operator) {
    case 'equals':
      return answerValues.includes(String(condition.value));

    case 'not_equals':
      return !answerValues.includes(String(condition.value));

    case 'includes': {
      const checkValues = Array.isArray(condition.value) ? condition.value : [condition.value];
      return checkValues.some((v: string) => answerValues.includes(v));
    }

    case 'any':
      return answerValues.length > 0;

    default:
      return false;
  }
}

/**
 * Check if all showIf conditions are met (AND logic).
 */
function shouldShowQuestion(
  question: InterviewQuestion,
  answers: Map<string, InterviewAnswer>,
): boolean {
  // If skipIf conditions are met, skip this question
  if (question.skipIf) {
    const shouldSkip = question.skipIf.some((cond: BranchCondition) =>
      evaluateCondition(cond, answers),
    );
    if (shouldSkip) return false;
  }

  // If showIf conditions are defined, ALL must be met
  if (question.showIf && question.showIf.length > 0) {
    return question.showIf.every((cond: BranchCondition) => evaluateCondition(cond, answers));
  }

  // No conditions → always show
  return true;
}

/* ═══════════════════ Engine State ═══════════════════ */

export interface EngineState {
  /** The interview mode (modern vs ayush) */
  mode: 'modern' | 'ayush';
  /** Ordered list of sections for this interview */
  sectionOrder: SectionId[];
  /** Index into sectionOrder for current section */
  currentSectionIndex: number;
  /** Index into the filtered question list for the current section */
  currentQuestionIndex: number;
  /** All answers collected so far */
  answers: Map<string, InterviewAnswer>;
  /** Currently active red-flag alerts */
  redFlags: RedFlagAlert[];
  /** Whether the interview has concluded */
  isComplete: boolean;
  /** The current question to display (computed) */
  currentQuestion: InterviewQuestion | null;
  /** All visible questions for the current section (computed) */
  currentSectionQuestions: InterviewQuestion[];
  /** Progress percentage (0–100) */
  progress: number;
}

/* ═══════════════════ Engine Functions ═══════════════════ */

export function initEngine(mode: 'modern' | 'ayush' = 'modern'): EngineState {
  const sectionOrder = mode === 'ayush' ? SECTION_ORDER_AYUSH_WITHOUT_PAIN : SECTION_ORDER_WITHOUT_PAIN;
  const firstSectionQuestions = getVisibleQuestions('chief_complaint', new Map());

  return {
    mode,
    sectionOrder,
    currentSectionIndex: 0,
    currentQuestionIndex: 0,
    answers: new Map(),
    redFlags: [],
    isComplete: false,
    currentQuestion: firstSectionQuestions[0] || null,
    currentSectionQuestions: firstSectionQuestions,
    progress: 0,
  };
}

/**
 * Get all visible questions for a section, filtered by branch conditions.
 */
function getVisibleQuestions(
  sectionId: SectionId,
  answers: Map<string, InterviewAnswer>,
): InterviewQuestion[] {
  return QUESTION_BANK.filter(
    (q) => q.section === sectionId && shouldShowQuestion(q, answers),
  );
}

/**
 * Calculate overall progress percentage.
 */
function calculateProgress(state: EngineState): number {
  const totalSections = state.sectionOrder.length;
  if (totalSections === 0) return 0;

  // Each section contributes equally
  const sectionWeight = 100 / totalSections;
  const completedSectionProgress = state.currentSectionIndex * sectionWeight;

  // Progress within current section
  const currentSectionTotal = state.currentSectionQuestions.length;
  const withinSectionProgress =
    currentSectionTotal > 0
      ? (state.currentQuestionIndex / currentSectionTotal) * sectionWeight
      : 0;

  return Math.min(100, Math.round(completedSectionProgress + withinSectionProgress));
}

/**
 * Submit an answer and advance to the next question.
 *
 * This is the main state transition function. It:
 *   1. Records the answer
 *   2. Checks for red flags
 *   3. After chief complaint, determines whether to use SOCRATES flow
 *   4. Advances to the next visible question (or next section)
 *   5. Returns the new engine state
 */
export function submitAnswer(
  state: EngineState,
  answer: InterviewAnswer,
): EngineState {
  // Clone state
  const newAnswers = new Map(state.answers);
  newAnswers.set(answer.questionId, answer);

  // Detect red flags with updated answers
  const redFlags = detectRedFlags(newAnswers);

  // Determine section order after chief complaint
  let sectionOrder = state.sectionOrder;
  if (answer.questionId === 'cc_main') {
    const selectedComplaint = Array.isArray(answer.value)
      ? answer.value[0]
      : String(answer.value);

    const hasPain = PAIN_COMPLAINTS.has(selectedComplaint);
    
    if (state.mode === 'ayush') {
      sectionOrder = hasPain ? [...SECTION_ORDER_AYUSH_WITH_PAIN] : [...SECTION_ORDER_AYUSH_WITHOUT_PAIN];
    } else {
      sectionOrder = hasPain ? [...SECTION_ORDER_WITH_PAIN] : [...SECTION_ORDER_WITHOUT_PAIN];
    }
  }

  // Current section
  const currentSectionId = sectionOrder[state.currentSectionIndex];

  // Re-evaluate visible questions for current section (answers may affect visibility)
  const sectionQuestions = getVisibleQuestions(currentSectionId, newAnswers);

  // Try to advance within current section
  let nextQuestionIndex = state.currentQuestionIndex + 1;
  let nextSectionIndex = state.currentSectionIndex;
  let isComplete = false;

  if (nextQuestionIndex >= sectionQuestions.length) {
    // Current section is done — move to next section
    nextSectionIndex++;
    nextQuestionIndex = 0;

    if (nextSectionIndex >= sectionOrder.length) {
      // All sections complete
      isComplete = true;
    }
  }

  // Get questions for the new section
  let newSectionQuestions: InterviewQuestion[] = [];
  let newCurrentQuestion: InterviewQuestion | null = null;

  if (!isComplete) {
    const newSectionId = sectionOrder[nextSectionIndex];
    newSectionQuestions = getVisibleQuestions(newSectionId, newAnswers);

    // If new section has no visible questions, skip it
    while (newSectionQuestions.length === 0 && nextSectionIndex < sectionOrder.length - 1) {
      nextSectionIndex++;
      const skipSectionId = sectionOrder[nextSectionIndex];
      newSectionQuestions = getVisibleQuestions(skipSectionId, newAnswers);
    }

    if (newSectionQuestions.length === 0) {
      isComplete = true;
    } else {
      newCurrentQuestion = newSectionQuestions[nextQuestionIndex] || newSectionQuestions[0] || null;
      if (!newCurrentQuestion && nextQuestionIndex > 0) {
        nextQuestionIndex = 0;
        newCurrentQuestion = newSectionQuestions[0] || null;
      }
    }
  }

  const newState: EngineState = {
    mode: state.mode,
    sectionOrder,
    currentSectionIndex: nextSectionIndex,
    currentQuestionIndex: nextQuestionIndex,
    answers: newAnswers,
    redFlags,
    isComplete,
    currentQuestion: newCurrentQuestion,
    currentSectionQuestions: newSectionQuestions,
    progress: 0,
  };

  newState.progress = calculateProgress(newState);

  return newState;
}

/**
 * Get the current section metadata.
 */
export function getCurrentSection(state: EngineState) {
  const sectionId = state.sectionOrder[state.currentSectionIndex];
  return {
    id: sectionId,
    index: state.currentSectionIndex,
    total: state.sectionOrder.length,
    questionsInSection: state.currentSectionQuestions.length,
    currentQuestionInSection: state.currentQuestionIndex + 1,
  };
}

/**
 * Get summary of all answers organized by section.
 */
export function getAnswersBySection(
  answers: Map<string, InterviewAnswer>,
): Record<string, InterviewAnswer[]> {
  const grouped: Record<string, InterviewAnswer[]> = {};

  for (const answer of answers.values()) {
    if (!grouped[answer.section]) {
      grouped[answer.section] = [];
    }
    grouped[answer.section].push(answer);
  }

  return grouped;
}
