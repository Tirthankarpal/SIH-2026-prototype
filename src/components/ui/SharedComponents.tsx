/**
 * Shared UI Components — TouchOptionGrid, PainScale, BodyDiagram, RedFlagAlert
 *
 * These are the core interactive components used throughout the interview.
 * Each supports bilingual labels and is designed for 48px+ touch targets.
 */

import { useCallback, useEffect } from 'react';
import type { QuestionOption, RedFlagAlert as RedFlagAlertType, BodyRegion } from '../../types/clinical';
import { BODY_REGION_LABELS } from '../../types/clinical';
import { useTranslation } from '../../hooks/useTranslation';
import './SharedComponents.css';

/* ═══════════════════ Touch Option Grid ═══════════════════ */

interface TouchOptionGridProps {
  options: QuestionOption[];
  /** If true, allow multiple selections (checkboxes). If false, radio behavior. */
  multiSelect?: boolean;
  /** Currently selected option ID(s) */
  selected: string[];
  /** Callback when selection changes */
  onSelect: (selectedIds: string[]) => void;
  /** Use 2-column layout instead of auto-fill */
  twoColumns?: boolean;
  /** Language for display */
  language: 'en-IN' | 'hi-IN';
}

export function TouchOptionGrid({
  options,
  multiSelect = false,
  selected,
  onSelect,
  twoColumns = false,
  language,
}: TouchOptionGridProps) {
  const handleTap = useCallback(
    (optionId: string) => {
      if (multiSelect) {
        // Toggle in multi-select mode
        const newSelected = selected.includes(optionId)
          ? selected.filter((id) => id !== optionId)
          : [...selected, optionId];
        onSelect(newSelected);
      } else {
        // Single-select: replace
        onSelect([optionId]);
      }
    },
    [multiSelect, selected, onSelect],
  );

  return (
    <div
      className={`touch-option-grid${twoColumns ? ' touch-option-grid--two-col' : ''}`}
      role={multiSelect ? 'group' : 'radiogroup'}
    >
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            className={`touch-option${isSelected ? ' touch-option--selected' : ''}${
              opt.isRedFlag ? ' touch-option--red-flag' : ''
            }`}
            onClick={() => handleTap(opt.id)}
            role={multiSelect ? 'checkbox' : 'radio'}
            aria-checked={isSelected}
            aria-label={language === 'hi-IN' ? opt.label_hi : opt.label_en}
          >
            {opt.icon && <span className="touch-option__icon">{opt.icon}</span>}
            <span className="touch-option__label">
              {language === 'hi-IN' ? opt.label_hi : opt.label_en}
            </span>
            {language === 'en-IN' && opt.label_hi && (
              <span className="touch-option__label-hi">{opt.label_hi}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════ Pain Scale ═══════════════════ */

interface PainScaleProps {
  /** Currently selected value (0-10) or null */
  value: number | null;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Emoji array for 0-10 */
  emojis?: string[];
  /** Language for labels */
  language: 'en-IN' | 'hi-IN';
}

const DEFAULT_EMOJIS = ['😊', '🙂', '😐', '😕', '😣', '😖', '😫', '😩', '😭', '🤯', '😱'];

const SEVERITY_LABELS: Record<number, { en: string; hi: string }> = {
  0:  { en: 'No pain',        hi: 'कोई दर्द नहीं' },
  1:  { en: 'Barely noticeable', hi: 'बहुत हल्का' },
  2:  { en: 'Mild',           hi: 'हल्का' },
  3:  { en: 'Uncomfortable',  hi: 'असहज' },
  4:  { en: 'Moderate',       hi: 'मध्यम' },
  5:  { en: 'Distracting',    hi: 'ध्यान भटकाने वाला' },
  6:  { en: 'Distressing',    hi: 'कष्टकारी' },
  7:  { en: 'Hard to bear',   hi: 'सहना मुश्किल' },
  8:  { en: 'Intense',        hi: 'तीव्र' },
  9:  { en: 'Excruciating',   hi: 'असहनीय' },
  10: { en: 'Unbearable',     hi: 'बिल्कुल बर्दाश्त नहीं' },
};

export function PainScale({
  value,
  onChange,
  emojis = DEFAULT_EMOJIS,
  language,
}: PainScaleProps) {
  return (
    <div className="pain-scale">
      <div className="pain-scale__track">
        {emojis.map((emoji, i) => {
          const isSelected = value === i;
          const isHigh = i >= 8;
          return (
            <button
              key={i}
              className={`pain-scale__point${isSelected ? ' pain-scale__point--selected' : ''}${
                isHigh ? ' pain-scale__point--high' : ''
              }`}
              onClick={() => onChange(i)}
              aria-label={`Pain level ${i}: ${SEVERITY_LABELS[i]?.en || ''}`}
              role="radio"
              aria-checked={isSelected}
            >
              <span className="pain-scale__emoji">{emoji}</span>
              <span className="pain-scale__number">{i}</span>
            </button>
          );
        })}
      </div>

      <div className="pain-scale__labels">
        <span>{language === 'hi-IN' ? 'कोई दर्द नहीं' : 'No pain'}</span>
        <span>{language === 'hi-IN' ? 'सबसे तेज़ दर्द' : 'Worst pain'}</span>
      </div>

      {value !== null && (
        <div className="pain-scale__value-display">
          <div className={`pain-scale__value-number${value >= 8 ? ' pain-scale__value-number--high' : ''}`}>
            {value}/10
          </div>
          <div className="pain-scale__value-text">
            {language === 'hi-IN'
              ? SEVERITY_LABELS[value]?.hi
              : SEVERITY_LABELS[value]?.en}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ Body Diagram ═══════════════════ */

interface BodyDiagramProps {
  /** Currently selected region(s) */
  selected: BodyRegion[];
  /** Callback when a region is tapped */
  onSelect: (regions: BodyRegion[]) => void;
  /** Allow multiple regions */
  multiSelect?: boolean;
  /** Language for labels */
  language: 'en-IN' | 'hi-IN';
}



// Deduplicate: lower_back and upper_back share same grid position,
// so let's separate them
const BODY_REGIONS_FOR_DISPLAY: { region: BodyRegion; label_en: string; label_hi: string; icon: string }[] = [
  { region: 'head',           label_en: 'Head',            label_hi: 'सिर',              icon: '🧠' },
  { region: 'eyes',           label_en: 'Eyes',            label_hi: 'आँखें',             icon: '👁️' },
  { region: 'ears',           label_en: 'Ears',            label_hi: 'कान',              icon: '👂' },
  { region: 'nose_throat',    label_en: 'Nose / Throat',   label_hi: 'नाक / गला',        icon: '👃' },
  { region: 'neck',           label_en: 'Neck',            label_hi: 'गर्दन',            icon: '🦒' },
  { region: 'chest_left',     label_en: 'Left Chest',      label_hi: 'बायाँ सीना',       icon: '❤️' },
  { region: 'chest_center',   label_en: 'Center Chest',    label_hi: 'छाती बीच',         icon: '💚' },
  { region: 'chest_right',    label_en: 'Right Chest',     label_hi: 'दायाँ सीना',       icon: '❤️' },
  { region: 'left_shoulder',  label_en: 'Left Shoulder',   label_hi: 'बायाँ कंधा',       icon: '💪' },
  { region: 'right_shoulder', label_en: 'Right Shoulder',  label_hi: 'दायाँ कंधा',       icon: '💪' },
  { region: 'left_arm',       label_en: 'Left Arm',        label_hi: 'बायाँ हाथ',        icon: '🦾' },
  { region: 'right_arm',      label_en: 'Right Arm',       label_hi: 'दायाँ हाथ',        icon: '🦾' },
  { region: 'upper_abdomen',  label_en: 'Upper Abdomen',   label_hi: 'पेट ऊपरी',         icon: '🫃' },
  { region: 'lower_abdomen',  label_en: 'Lower Abdomen',   label_hi: 'पेट निचला',        icon: '🤰' },
  { region: 'upper_back',     label_en: 'Upper Back',      label_hi: 'ऊपरी पीठ',         icon: '🔙' },
  { region: 'lower_back',     label_en: 'Lower Back',      label_hi: 'कमर',              icon: '🔙' },
  { region: 'left_hip',       label_en: 'Left Hip',        label_hi: 'बायाँ कूल्हा',     icon: '🦴' },
  { region: 'right_hip',      label_en: 'Right Hip',       label_hi: 'दायाँ कूल्हा',     icon: '🦴' },
  { region: 'left_knee',      label_en: 'Left Knee',       label_hi: 'बायाँ घुटना',      icon: '🦵' },
  { region: 'right_knee',     label_en: 'Right Knee',      label_hi: 'दायाँ घुटना',      icon: '🦵' },
  { region: 'left_foot',      label_en: 'Left Foot',       label_hi: 'बायाँ पैर',        icon: '🦶' },
  { region: 'right_foot',     label_en: 'Right Foot',      label_hi: 'दायाँ पैर',        icon: '🦶' },
];

export function BodyDiagram({
  selected,
  onSelect,
  multiSelect = false,
  language,
}: BodyDiagramProps) {


  // Convert to QuestionOption format and reuse TouchOptionGrid
  const options: QuestionOption[] = BODY_REGIONS_FOR_DISPLAY.map((r) => ({
    id: r.region,
    label_en: r.label_en,
    label_hi: r.label_hi,
    icon: r.icon,
  }));

  return (
    <div className="body-diagram">
      <TouchOptionGrid
        options={options}
        multiSelect={multiSelect}
        selected={selected}
        onSelect={(ids) => onSelect(ids as BodyRegion[])}
        language={language}
      />

      {selected.length > 0 && (
        <div className="body-diagram__selected-label">
          📍 {selected.map((r) => {
            const labels = BODY_REGION_LABELS[r];
            return language === 'hi-IN' ? labels?.hi : labels?.en;
          }).join(', ')}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ Red Flag Alert ═══════════════════ */

interface RedFlagAlertProps {
  /** The triggered alert */
  alert: RedFlagAlertType;
  /** Language for display */
  language: 'en-IN' | 'hi-IN';
  /** Called when user acknowledges and wants to continue */
  onContinue: () => void;
  /** Called when user wants to go to triage immediately */
  onTriageNow: () => void;
}

export function RedFlagAlertComponent({
  alert,
  language,
  onContinue,
  onTriageNow,
}: RedFlagAlertProps) {


  // Play alarm sound on mount
  useEffect(() => {
    // Use system beep / speech synthesis as alarm
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        language === 'hi-IN'
          ? 'ध्यान दें। आपातकालीन चेतावनी। कृपया तुरंत ट्राइएज स्टाफ को बुलाएं।'
          : 'Attention. Emergency alert detected. Please call triage staff immediately.',
      );
      utterance.lang = language;
      utterance.rate = 0.85;
      utterance.volume = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }

    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [language]);

  const isHindi = language === 'hi-IN';

  return (
    <div className="red-flag-alert" role="alertdialog" aria-label="Emergency Alert">
      <div className="red-flag-alert__card">
        <div className="red-flag-alert__icon">🚨</div>

        <div className="red-flag-alert__title">
          {isHindi ? alert.rule.name_hi : alert.rule.name_en}
        </div>

        <div className="red-flag-alert__severity">
          {alert.rule.severity === 'critical' ? '⚠️ CRITICAL' : '⚠️ URGENT'}
        </div>

        <div className="red-flag-alert__description">
          {isHindi ? alert.rule.description_hi : alert.rule.description_en}
        </div>

        <div className="red-flag-alert__action">
          {isHindi ? alert.rule.action_hi : alert.rule.action_en}
        </div>

        <div className="red-flag-alert__actions">
          <button
            className="red-flag-alert__btn red-flag-alert__btn--primary"
            onClick={onTriageNow}
          >
            {isHindi ? '🏥 ट्राइएज भेजें' : '🏥 Send to Triage'}
          </button>
          <button
            className="red-flag-alert__btn red-flag-alert__btn--secondary"
            onClick={onContinue}
          >
            {isHindi ? 'इंटरव्यू जारी रखें' : 'Continue Interview'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ Interview Complete Screen ═══════════════════ */

interface InterviewCompleteProps {
  totalQuestions: number;
  totalSections: number;
  redFlagCount: number;
  onStartNew: () => void;
  onViewSummary: () => void;
}

export function InterviewComplete({
  totalQuestions,
  totalSections,
  redFlagCount,
  onViewSummary,
  onStartNew,
}: InterviewCompleteProps) {
  const { t } = useTranslation();

  return (
    <div className="interview-complete">
      <div className="interview-complete__icon">✅</div>
      <div className="interview-complete__title">
        {t.interview.assessment_complete}
      </div>
      <div className="interview-complete__subtitle">
      </div>

      <div className="interview-complete__stats">
        <div className="interview-complete__stat">
          <div className="interview-complete__stat-value">{totalQuestions}</div>
          <div className="interview-complete__stat-label">
            {t.interview.total_questions}
          </div>
        </div>
        <div className="interview-complete__stat">
          <div className="interview-complete__stat-value">{totalSections}</div>
          <div className="interview-complete__stat-label">
            {t.interview.total_sections}
          </div>
        </div>
        <div className="interview-complete__stat">
          <div className="interview-complete__stat-value">{redFlagCount}</div>
          <div className="interview-complete__stat-label">
            {t.interview.red_flags_detected}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--sl-space-4)', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={onViewSummary}>
          📄 {t.interview.btn_view_summary}
        </button>
        <button className="btn-secondary" onClick={onStartNew}>
          ➕ {t.interview.btn_start_new}
        </button>
      </div>
    </div>
  );
}

