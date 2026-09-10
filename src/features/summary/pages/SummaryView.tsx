import { useMemo, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useInterviewStore } from '../../../store/interviewStore';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAISummary } from '../../../hooks/useAISummary';
import { generateSummary, type FormattedSummary } from '../formatters/clinicalFormatters';
import '../components/SummaryShell.css';

export function SummaryView() {
  const completedInterview = useInterviewStore((s) => s.completedInterview);
  const { t, language } = useTranslation();
  const isHindi = language === 'hi-IN';

  const summary: FormattedSummary | null = useMemo(() => {
    if (!completedInterview) return null;
    return generateSummary(completedInterview);
  }, [completedInterview]);

  if (!summary) {
    return <Navigate to="/" replace />;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = document.getElementById('clinical-summary-content')?.innerText;
    if (text) {
      navigator.clipboard.writeText(text);
      alert(t.summary.alert_copied);
    }
  };

  const isAyush = completedInterview?.mode === 'ayush';

  // AI Summary
  const ai = useAISummary();

  useEffect(() => {
    if (summary && ai.isAvailable && !ai.result && !ai.isLoading) {
      ai.generate(summary, isAyush ? 'ayush' : 'modern');
    }
  }, [summary, ai.isAvailable]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="summary-container">
      <header className="summary-header">
        <div>
          <h1 className="summary-header__title">{t.summary.title}</h1>
          <div className="summary-header__meta">{t.summary.generated_by} • {new Date().toLocaleDateString()}</div>
        </div>
        <div className="summary-actions no-print">
          <button className="summary-action-btn" onClick={handleCopy}>
            📋 {t.summary.btn_copy}
          </button>
          <button className="summary-action-btn" onClick={handlePrint}>
            🖨️ {t.summary.btn_print}
          </button>
        </div>
      </header>

      <div id="clinical-summary-content">
        {summary.redFlagAlerts.length > 0 && (
          <div className="summary-alert">
            <h2 className="summary-alert__title">🚨 {t.summary.alert_title}</h2>
            <ul className="summary-alert__list">
              {summary.redFlagAlerts.map((flag, idx) => (
                <li key={idx}><strong>{isHindi ? flag.rule.name_hi : flag.rule.name_en}:</strong> {isHindi ? flag.rule.action_hi : flag.rule.action_en}</li>
              ))}
            </ul>
          </div>
        )}

        <section className="summary-section">
          <h3 className="summary-section__title">🩺 {t.summary.section_cc}</h3>
          <p className="summary-section__content">{summary.chiefComplaint || t.summary.not_assessed}</p>
        </section>

        <section className="summary-section">
          <h3 className="summary-section__title">📝 {t.summary.section_hpi}</h3>
          <p className="summary-section__content">{summary.hpiNarrative || t.summary.no_hpi}</p>
        </section>

        <section className="summary-section">
          <h3 className="summary-section__title">🏥 {t.summary.section_pmh}</h3>
          <div className="summary-grid">
            <div className="summary-grid__label">{t.summary.label_past_medical}:</div>
            <div className="summary-grid__value">
              {summary.pastMedicalHistory.length > 0 ? summary.pastMedicalHistory.join(', ') : t.summary.not_assessed}
            </div>
            <div className="summary-grid__label">{t.summary.label_medications}:</div>
            <div className="summary-grid__value">
              {summary.currentMedications.length > 0 ? summary.currentMedications.join(', ') : t.summary.not_assessed}
            </div>
            <div className="summary-grid__label">{t.summary.label_allergies}:</div>
            <div className="summary-grid__value">
              {summary.allergies.length > 0 ? summary.allergies.join(', ') : t.summary.not_assessed}
            </div>
            <div className="summary-grid__label">{t.summary.label_family_history}:</div>
            <div className="summary-grid__value">
              {summary.familyHistory.length > 0 ? summary.familyHistory.join(', ') : t.summary.not_assessed}
            </div>
          </div>
        </section>

        <section className="summary-section">
          <h3 className="summary-section__title">🔍 {t.summary.section_ros}</h3>
          {Object.keys(summary.reviewOfSystems).length > 0 ? (
            <ul className="summary-list summary-list--ros">
              {Object.entries(summary.reviewOfSystems).map(([sys, findings], idx) => (
                <li key={idx}>
                  <strong>{sys}:</strong> {findings.join(', ')}
                </li>
              ))}
            </ul>
          ) : (
            <p className="summary-section__content">{t.summary.no_ros}</p>
          )}
        </section>

        {isAyush && summary.prakritiResult && (
          <section className="summary-section summary-section--ayush">
            <h3 className="summary-section__title summary-section__title--ayush">
              🌿 {t.summary.section_ayush}
            </h3>
            <div className="summary-grid summary-grid--ayush">
              <div className="summary-grid__label">{t.summary.label_prakriti}:</div>
              <div className="summary-grid__value" style={{ fontWeight: 'bold' }}>
                {summary.prakritiResult.primaryDosha}
                {summary.prakritiResult.secondaryDosha ? ` - ${summary.prakritiResult.secondaryDosha}` : ''}
                <div className="dosha-bar-container">
                  <span className="dosha-bar-label dosha-vata">Vata</span>
                  <div className="dosha-bar-track">
                    <div className="dosha-bar-fill dosha-vata" style={{ width: `${summary.prakritiResult.percentages.vata}%` }} />
                  </div>
                  <span className="dosha-percentage">{summary.prakritiResult.percentages.vata}%</span>
                </div>
                
                <div className="dosha-bar-container">
                  <span className="dosha-bar-label dosha-pitta">Pitta</span>
                  <div className="dosha-bar-track">
                    <div className="dosha-bar-fill dosha-pitta" style={{ width: `${summary.prakritiResult.percentages.pitta}%` }} />
                  </div>
                  <span className="dosha-percentage">{summary.prakritiResult.percentages.pitta}%</span>
                </div>
                
                <div className="dosha-bar-container">
                  <span className="dosha-bar-label dosha-kapha">Kapha</span>
                  <div className="dosha-bar-track">
                    <div className="dosha-bar-fill dosha-kapha" style={{ width: `${summary.prakritiResult.percentages.kapha}%` }} />
                  </div>
                  <span className="dosha-percentage">{summary.prakritiResult.percentages.kapha}%</span>
                </div>
              </div>
            </div>
          </section>
        )}
        {/* ── AI-Powered SOAP Note ── */}
        {ai.isAvailable && (
          <section className="summary-section summary-section--ai" style={{ marginTop: '32px', borderTop: '2px solid var(--sl-accent)', paddingTop: '24px' }}>
            <h3 className="summary-section__title" style={{ color: 'var(--sl-accent)' }}>
              ✨ AI Clinical Analysis
            </h3>

            {ai.isLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1,2,3,4].map(i => (
                  <div key={i} className="ai-skeleton" style={{
                    height: '60px',
                    background: 'linear-gradient(90deg, var(--sl-bg-card) 25%, var(--sl-bg-hover) 50%, var(--sl-bg-card) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                    borderRadius: 'var(--sl-radius-md)',
                  }} />
                ))}
                <p style={{ textAlign: 'center', color: 'var(--sl-text-muted)', fontSize: '0.9rem' }}>
                  🧠 Gemini is analyzing the patient data...
                </p>
              </div>
            )}

            {ai.error && (
              <div style={{ color: 'var(--sl-danger)', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
                ⚠️ {ai.error}
              </div>
            )}

            {ai.result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* SOAP Cards */}
                {[
                  { letter: 'S', title: 'Subjective', content: ai.result.soapNote.subjective, color: '#60a5fa' },
                  { letter: 'O', title: 'Objective', content: ai.result.soapNote.objective, color: '#4ade80' },
                  { letter: 'A', title: 'Assessment', content: ai.result.soapNote.assessment, color: '#fbbf24' },
                  { letter: 'P', title: 'Plan', content: ai.result.soapNote.plan, color: '#f472b6' },
                ].map(card => (
                  <div key={card.letter} style={{
                    background: 'var(--sl-bg-card)',
                    border: `1px solid ${card.color}33`,
                    borderLeft: `4px solid ${card.color}`,
                    borderRadius: 'var(--sl-radius-md)',
                    padding: '16px 20px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{
                        width: '28px', height: '28px',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: `${card.color}22`, color: card.color,
                        borderRadius: '6px', fontWeight: 700, fontSize: '0.9rem',
                      }}>{card.letter}</span>
                      <strong style={{ color: card.color }}>{card.title}</strong>
                    </div>
                    <p style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{card.content}</p>
                  </div>
                ))}

                {/* Differential Diagnoses */}
                {ai.result.differentials.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '1rem' }}>🔬 Differential Diagnoses</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {ai.result.differentials.map((dx, i) => (
                        <div key={i} style={{
                          background: 'var(--sl-bg-card)',
                          border: '1px solid var(--sl-border)',
                          borderRadius: 'var(--sl-radius-md)',
                          padding: '12px 16px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px',
                        }}>
                          <div>
                            <strong>{dx.condition}</strong>
                            <p style={{ fontSize: '0.85rem', color: 'var(--sl-text-secondary)', marginTop: '4px' }}>{dx.reasoning}</p>
                          </div>
                          <span style={{
                            padding: '2px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600,
                            flexShrink: 0,
                            background: dx.likelihood === 'High' ? 'rgba(239,68,68,0.15)' : dx.likelihood === 'Moderate' ? 'rgba(234,179,8,0.15)' : 'rgba(107,114,128,0.15)',
                            color: dx.likelihood === 'High' ? '#f87171' : dx.likelihood === 'Moderate' ? '#fbbf24' : '#9ca3af',
                          }}>{dx.likelihood}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AYUSH Recommendations */}
                {ai.result.ayushRecommendations && (
                  <div style={{
                    background: 'rgba(52, 211, 153, 0.05)',
                    border: '1px solid rgba(52, 211, 153, 0.2)',
                    borderRadius: 'var(--sl-radius-md)',
                    padding: '16px 20px', marginTop: '8px',
                  }}>
                    <h4 style={{ color: '#34d399', marginBottom: '8px' }}>🌿 Ayurvedic Treatment Recommendations</h4>
                    <p style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{ai.result.ayushRecommendations}</p>
                  </div>
                )}

                <p style={{ fontSize: '0.75rem', color: 'var(--sl-text-muted)', textAlign: 'center', marginTop: '8px' }}>
                  ⚕️ AI-generated content is for reference only. Clinical judgement must prevail.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
