/**
 * InterviewShell — The main interview container component (v2)
 *
 * Now powered by the branching engine. This component:
 *   - Initializes the interview state machine
 *   - Renders the appropriate input component for each question type
 *   - Handles answer submission and state transitions
 *   - Shows red-flag alerts when triggered
 *   - Displays the completion screen when all sections are done
 *
 * 🎯 HIDDEN DEMO TRIGGER:
 *   Triple-tap top-right corner OR Ctrl+Shift+D
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpeechRecognition, type SupportedLanguage } from '../../../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../../hooks/useSpeechSynthesis';
import { useTranslation } from '../../../hooks/useTranslation';
import { getAllDemoScenarios, type DemoScenarioId } from '../../../hooks/demoScenarios';
import {
  initEngine,
  submitAnswer,
  getCurrentSection,
  type EngineState,
} from '../engine/branchingEngine';
import {
  TouchOptionGrid,
  PainScale,
  BodyDiagram,
  RedFlagAlertComponent,
  InterviewComplete,
} from '../../../components/ui/SharedComponents';
import { SECTIONS, type InterviewAnswer, type BodyRegion } from '../../../types/clinical';
import './InterviewShell.css';

/* ───────────────────────── Types ───────────────────────── */

interface InterviewShellProps {
  /** Initial language */
  initialLanguage?: SupportedLanguage;
  /** Interview mode */
  mode?: 'modern' | 'ayush';
  /** Called when interview completes */
  onComplete?: (state: EngineState) => void;
}

/* ───────────────── Constants ───────────────── */

const DEMO_TAP_THRESHOLD = 3;
const DEMO_TAP_WINDOW_MS = 1200;

/* ═══════════════════ COMPONENT ═══════════════════ */

export function InterviewShell({
  initialLanguage = 'en-IN',
  mode = 'modern',
  onComplete,
}: InterviewShellProps) {
  const navigate = useNavigate();
  /* ─── Engine state ─── */
  const [engineState, setEngineState] = useState<EngineState>(() => initEngine(mode));

  /* ─── Speech recognition ─── */
  const speech = useSpeechRecognition(initialLanguage);
  
  /* ─── Speech synthesis (TTS) ─── */
  const tts = useSpeechSynthesis(speech.language);
  
  const { t } = useTranslation();

  /* ─── Local UI state ─── */
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [painValue, setPainValue] = useState<number | null>(null);
  const [selectedBodyRegions, setSelectedBodyRegions] = useState<BodyRegion[]>([]);
  const [activeRedFlag, setActiveRedFlag] = useState<EngineState['redFlags'][0] | null>(null);
  const [dismissedError, setDismissedError] = useState(false);
  const [previousRedFlagIds, setPreviousRedFlagIds] = useState<Set<string>>(new Set());
  const tapTimestamps = useRef<number[]>([]);

  /* ─── Derived state ─── */
  const question = engineState.currentQuestion;
  const sectionInfo = getCurrentSection(engineState);
  const sectionMeta = SECTIONS.find((s) => s.id === sectionInfo.id);
  const isHindi = speech.language === 'hi-IN';
  const hasVoiceContent = speech.transcript.trim().length > 0 || speech.interimTranscript.length > 0;

  /* ─── Reset input state when question changes ─── */
  useEffect(() => {
    setSelectedOptions([]);
    setPainValue(null);
    setSelectedBodyRegions([]);
    speech.resetTranscript();
    setDismissedError(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  /* ─── Check for new red flags ─── */
  useEffect(() => {
    if (engineState.redFlags.length > 0) {
      const newFlag = engineState.redFlags.find(
        (rf) => !previousRedFlagIds.has(rf.rule.id),
      );
      if (newFlag) {
        setActiveRedFlag(newFlag);
        setPreviousRedFlagIds((prev) => {
          const next = new Set(prev);
          next.add(newFlag.rule.id);
          return next;
        });
      }
    }
  }, [engineState.redFlags, previousRedFlagIds]);

  /* ─── Notify completion ─── */
  useEffect(() => {
    if (engineState.isComplete) {
      onComplete?.(engineState);
    }
  }, [engineState.isComplete, onComplete, engineState]);

  /* ───────── Demo trigger: triple-tap ───────── */
  const handleDemoZoneTap = useCallback(() => {
    const now = Date.now();
    tapTimestamps.current.push(now);
    tapTimestamps.current = tapTimestamps.current.filter((t) => now - t < DEMO_TAP_WINDOW_MS);
    if (tapTimestamps.current.length >= DEMO_TAP_THRESHOLD) {
      tapTimestamps.current = [];
      setShowDemoPanel(true);
    }
  }, []);

  /* ───────── Keyboard shortcut: Ctrl+Shift+D ───────── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDemoPanel((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ───────── Demo scenario selection ───────── */
  const handleDemoSelect = useCallback(
    (scenarioId: DemoScenarioId) => {
      speech.triggerDemoMode(scenarioId, true);
      setShowDemoPanel(false);
    },
    [speech],
  );

  /* ───────── Language toggle ───────── */
  const handleLangToggle = useCallback(() => {
    const newLang: SupportedLanguage = speech.language === 'en-IN' ? 'hi-IN' : 'en-IN';
    speech.setLanguage(newLang);
  }, [speech]);

  /* ───────── Mic toggle ───────── */
  const handleMicToggle = useCallback(() => {
    if (speech.isListening && !speech.isDemoMode) {
      speech.stopListening();
    } else {
      speech.startListening();
    }
  }, [speech]);

  /* ───────── Answer submission ───────── */
  const handleSubmit = useCallback(() => {
    if (!question) return;

    let value: string | string[] | number;
    let displayEn = '';
    let displayHi = '';
    let inputMethod: 'voice' | 'touch' | 'demo' = 'touch';

    switch (question.type) {
      case 'single_choice':
      case 'yes_no': {
        if (selectedOptions.length === 0 && !speech.transcript.trim()) return;
        if (selectedOptions.length > 0) {
          value = selectedOptions[0];
          const opt = question.options?.find((o) => o.id === selectedOptions[0]);
          displayEn = opt?.label_en || selectedOptions[0];
          displayHi = opt?.label_hi || selectedOptions[0];
        } else {
          value = speech.transcript.trim();
          displayEn = value;
          displayHi = value;
          inputMethod = speech.isDemoMode ? 'demo' : 'voice';
        }
        break;
      }
      case 'multi_choice': {
        if (selectedOptions.length === 0 && !speech.transcript.trim()) return;
        if (selectedOptions.length > 0) {
          value = selectedOptions;
          displayEn = selectedOptions
            .map((id) => question.options?.find((o) => o.id === id)?.label_en || id)
            .join(', ');
          displayHi = selectedOptions
            .map((id) => question.options?.find((o) => o.id === id)?.label_hi || id)
            .join(', ');
        } else {
          value = speech.transcript.trim();
          displayEn = value as string;
          displayHi = value as string;
          inputMethod = speech.isDemoMode ? 'demo' : 'voice';
        }
        break;
      }
      case 'pain_scale': {
        if (painValue === null) return;
        value = painValue;
        displayEn = `${painValue}/10`;
        displayHi = `${painValue}/10`;
        break;
      }
      case 'body_region': {
        if (selectedBodyRegions.length === 0 && !speech.transcript.trim()) return;
        if (selectedBodyRegions.length > 0) {
          value = selectedBodyRegions;
          displayEn = selectedBodyRegions.join(', ');
          displayHi = selectedBodyRegions.join(', ');
        } else {
          value = speech.transcript.trim();
          displayEn = value as string;
          displayHi = value as string;
          inputMethod = speech.isDemoMode ? 'demo' : 'voice';
        }
        break;
      }
      case 'voice_open':
      default: {
        if (!speech.transcript.trim()) return;
        value = speech.transcript.trim();
        displayEn = value;
        displayHi = value;
        inputMethod = speech.isDemoMode ? 'demo' : 'voice';
        break;
      }
    }

    const answer: InterviewAnswer = {
      questionId: question.id,
      section: question.section,
      value,
      displayText_en: displayEn,
      displayText_hi: displayHi,
      inputMethod,
      timestamp: new Date().toISOString(),
      confidence: speech.confidence,
    };

    const newState = submitAnswer(engineState, answer);
    setEngineState(newState);
  }, [question, selectedOptions, painValue, selectedBodyRegions, speech, engineState]);

  /* ───────── Can submit? ───────── */
  const canSubmit = useMemo(() => {
    if (!question) return false;

    switch (question.type) {
      case 'single_choice':
      case 'yes_no':
        return selectedOptions.length > 0 || speech.transcript.trim().length > 0;
      case 'multi_choice':
        return selectedOptions.length > 0 || speech.transcript.trim().length > 0;
      case 'pain_scale':
        return painValue !== null;
      case 'body_region':
        return selectedBodyRegions.length > 0 || speech.transcript.trim().length > 0;
      case 'voice_open':
        return speech.transcript.trim().length > 0;
      default:
        return false;
    }
  }, [question, selectedOptions, painValue, selectedBodyRegions, speech.transcript]);

  /* ───────── Reset interview ───────── */
  const handleRestart = useCallback(() => {
    setEngineState(initEngine());
    setPreviousRedFlagIds(new Set());
    setActiveRedFlag(null);
    speech.resetTranscript();
  }, [speech]);

  /* ─── Error state ─── */
  useEffect(() => {
    if (speech.error) setDismissedError(false);
  }, [speech.error]);

  const langLabel = speech.language === 'hi-IN' ? 'हिन्दी' : 'English';
  const scenarios = getAllDemoScenarios();

  /* ═══════════════════ RENDER ═══════════════════ */

  /* ── Red Flag Alert Overlay ── */
  if (activeRedFlag) {
    return (
      <RedFlagAlertComponent
        alert={activeRedFlag}
        language={speech.language}
        onTriageNow={() => {
          console.log('[SwasthyaLipi] TRIAGE ALERT SENT:', activeRedFlag.rule.id);
          setActiveRedFlag(null);
        }}
        onContinue={() => setActiveRedFlag(null)}
      />
    );
  }

  /* ── Interview Complete Screen ── */
  if (engineState.isComplete) {
    return (
      <div className="interview-shell">
        <header className="interview-header">
          <div className="interview-header__brand">
            <div className="interview-header__logo" aria-hidden="true">स्व</div>
            <div>
              <div className="interview-header__title">{t.interview.app_title}</div>
              <div className="interview-header__subtitle">{t.interview.app_subtitle}</div>
            </div>
          </div>
        </header>

        <div className="interview-progress">
          <div className="interview-progress__fill" style={{ width: '100%' }} />
        </div>

        <main className="interview-main">
          <InterviewComplete
            totalQuestions={engineState.answers.size}
            totalSections={engineState.sectionOrder.length}
            redFlagCount={engineState.redFlags.length}
            onViewSummary={() => navigate('/summary')}
            onStartNew={handleRestart}
          />
        </main>
      </div>
    );
  }

  /* ── Main Interview Flow ── */
  return (
    <div className="interview-shell">
      {/* ── Header ── */}
      <header className="interview-header" id="interview-header">
        <div className="interview-header__brand">
          <div className="interview-header__logo" aria-hidden="true">स्व</div>
          <div>
            <div className="interview-header__title">{t.interview.app_title}</div>
            <div className="interview-header__subtitle">{t.interview.app_subtitle}</div>
          </div>
        </div>

        <div className="interview-header__actions">
          <button className="interview-header__lang-badge" onClick={handleLangToggle}
            title={t.interview.switch_lang}>
            🌐 {langLabel}
          </button>
        </div>

        <button className="interview-header__demo-zone"
          onClick={handleDemoZoneTap} aria-hidden="true" tabIndex={-1} />
      </header>

      {/* ── Progress Bar ── */}
      <div className="interview-progress" role="progressbar"
        aria-valuenow={engineState.progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="interview-progress__fill"
          style={{ width: `${engineState.progress}%` }} />
      </div>

      {/* ── Error Banner ── */}
      {speech.error && !dismissedError && (
        <div className="interview-error" role="alert">
          <span className="interview-error__icon">⚠️</span>
          <span>{speech.error}</span>
          <button className="interview-error__dismiss" onClick={() => setDismissedError(true)}>
            {t.interview.btn_dismiss}
          </button>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="interview-main">
        {/* Section label */}
        {sectionMeta && (
          <div className="interview-section-label">
            <span className="interview-section-label__icon">{sectionMeta.icon}</span>
            {isHindi ? sectionMeta.label_hi : sectionMeta.label_en}
            <span style={{
              marginLeft: 'var(--sl-space-2)',
              fontSize: 'var(--sl-text-xs)',
              color: 'var(--sl-text-muted)',
              fontWeight: 400,
            }}>
              {sectionInfo.index + 1}/{sectionInfo.total}
            </span>
          </div>
        )}

        {/* Question card */}
        {question && (
          <div className="interview-question-card" key={question.id}>
            <p className="interview-question-card__text">
              {isHindi ? question.text_hi : question.text_en}
            </p>
            {!isHindi && question.text_hi && (
              <p className="interview-question-card__text interview-question-card__text--hindi">
                {question.text_hi}
              </p>
            )}
            {isHindi && question.text_en && (
              <p className="interview-question-card__text interview-question-card__text--hindi">
                {question.text_en}
              </p>
            )}
            <button 
              className={`interview-question-card__audio-btn ${tts.isSpeaking ? 'interview-question-card__audio-btn--playing' : ''}`}
              onClick={() => {
                if (tts.isSpeaking) {
                  tts.stop();
                } else {
                  tts.speak(isHindi ? question.text_hi : question.text_en);
                }
              }}
              disabled={!tts.isSupported}
            >
              {tts.isSpeaking ? `⏸️ ${t.interview.btn_pause}` : `🔊 ${t.interview.btn_listen}`}
            </button>
          </div>
        )}

        {/* ═══════ Input Components (type-specific) ═══════ */}

        {/* Touch Options (single/multi choice, yes/no) */}
        {question && (question.type === 'single_choice' || question.type === 'multi_choice' || question.type === 'yes_no') && question.options && (
          <TouchOptionGrid
            options={question.options}
            multiSelect={question.type === 'multi_choice'}
            selected={selectedOptions}
            onSelect={setSelectedOptions}
            twoColumns={question.type === 'yes_no'}
            language={speech.language}
          />
        )}

        {/* Pain Scale */}
        {question && question.type === 'pain_scale' && (
          <PainScale
            value={painValue}
            onChange={setPainValue}
            emojis={question.scaleEmojis}
            language={speech.language}
          />
        )}

        {/* Body Diagram */}
        {question && question.type === 'body_region' && (
          <BodyDiagram
            selected={selectedBodyRegions}
            onSelect={setSelectedBodyRegions}
            language={speech.language}
          />
        )}

        {/* Voice transcript (for voice_open type or any question with allowVoice) */}
        {question && (question.type === 'voice_open' || question.allowVoice) && (
          <div className={`interview-transcript${
            speech.isListening && !speech.isDemoMode ? ' interview-transcript--listening' : ''
          }${speech.isDemoMode ? ' interview-transcript--demo' : ''}`}
            aria-live="polite">
            <div className="interview-transcript__input-wrapper">
              <textarea
                className="interview-transcript__input"
                value={speech.transcript}
                onChange={(e) => {
                  speech.setTranscript(e.target.value);
                  // Auto-resize the textarea
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                placeholder={
                  isHindi
                    ? 'यहाँ टाइप करें या बोलने के लिए माइक दबाएं...'
                    : 'Type here or tap the mic to speak...'
                }
              />
              {/* Show interim transcript over/after the text while listening */}
              {speech.isListening && speech.interimTranscript && (
                <div className="interview-transcript__interim-overlay">
                  <span className="interview-transcript__interim">
                    {speech.transcript ? ' ' : ''}{speech.interimTranscript}
                  </span>
                  <span className="interview-transcript__cursor" aria-hidden="true" />
                </div>
              )}
            </div>

            {hasVoiceContent && (
              <div className="interview-transcript__meta">
                <div className="interview-transcript__confidence">
                  <span className="interview-transcript__confidence-dot" />
                  Confidence: {Math.round(speech.confidence * 100)}%
                </div>
                {speech.isDemoMode && (
                  <span className="interview-transcript__demo-badge">⚡ Demo Mode</span>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Bottom Input Area ── */}
      <div className="interview-input-area">
        {/* Waveform */}
        {question && (question.type === 'voice_open' || question.allowVoice) && (
          <div className={`waveform${speech.isListening ? ' waveform--active' : ''}`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="waveform__bar" />
            ))}
          </div>
        )}

        <div className="interview-input-area__actions">
          {/* Clear button */}
          {(hasVoiceContent || selectedOptions.length > 0 || painValue !== null || selectedBodyRegions.length > 0) && (
            <button className="btn-secondary" onClick={() => {
              speech.resetTranscript();
              setSelectedOptions([]);
              setPainValue(null);
              setSelectedBodyRegions([]);
            }}>
              ✕ {isHindi ? 'मिटाएं' : 'Clear'}
            </button>
          )}

          {/* Mic button (only for voice-enabled questions) */}
          {question && (question.type === 'voice_open' || question.allowVoice) && (
            <button
              className={`mic-button${speech.isListening && !speech.isDemoMode ? ' mic-button--listening' : ''}`}
              onClick={handleMicToggle}
              aria-label={speech.isListening ? 'Stop listening' : 'Start listening'}>
              <span className="mic-button__pulse" aria-hidden="true" />
              <span className="mic-button__pulse" aria-hidden="true" />
              <span className="mic-button__pulse" aria-hidden="true" />
              {speech.isListening && !speech.isDemoMode ? '⏹' : '🎤'}
            </button>
          )}

          {/* Submit / Next button */}
          {canSubmit && !speech.isListening && (
            <button className="btn-primary" onClick={handleSubmit}
              disabled={!canSubmit}>
              {isHindi ? 'आगे बढ़ें →' : 'Continue →'}
            </button>
          )}
        </div>
      </div>

      {/* ═══════ Demo Mode Overlay ═══════ */}
      {showDemoPanel && (
        <div className="demo-overlay" onClick={() => setShowDemoPanel(false)}>
          <div className="demo-panel" onClick={(e) => e.stopPropagation()}
            role="dialog" aria-label="Demo Mode — Select a scenario">
            <div className="demo-panel__header">
              <div>
                <div className="demo-panel__title">⚡ God Mode</div>
                <div className="demo-panel__badge">Hackathon Demo</div>
              </div>
              <button className="demo-panel__close" onClick={() => setShowDemoPanel(false)}>✕</button>
            </div>
            <div className="demo-panel__list">
              {scenarios.map((scenario) => (
                <button key={scenario.id}
                  className={`demo-scenario-btn${scenario.triggersRedFlag ? ' demo-scenario-btn--red-flag' : ''}`}
                  onClick={() => handleDemoSelect(scenario.id)}>
                  <div className="demo-scenario-btn__label">{scenario.label}</div>
                  <div className="demo-scenario-btn__desc">{scenario.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
