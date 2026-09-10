import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DoctorShell } from '../components/DoctorShell';
import { useDoctorStore } from '../../../store/doctorStore';
import { useAISummary } from '../../../hooks/useAISummary';
import type { FormattedSummary } from '../../summary/formatters/clinicalFormatters';

export function EncounterReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { encounters, updateStatus, saveNotes, fetchQueue } = useDoctorStore();
  
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [plan, setPlan] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const ai = useAISummary();

  const encounter = encounters.find(e => e.id === id);

  useEffect(() => {
    if (!encounter) {
      fetchQueue();
    } else {
      setDiagnosis(encounter.doctor_diagnosis || '');
      setPrescription(encounter.doctor_prescription || '');
      setPlan(encounter.doctor_plan || '');
      
      // Auto-update status to in_consultation when opened
      if (encounter.status === 'waiting') {
        updateStatus(encounter.id, 'in_consultation');
      }
    }
  }, [encounter, fetchQueue, updateStatus, id]);

  if (!encounter) return <DoctorShell showBack><p>Loading encounter...</p></DoctorShell>;

  const summary = encounter.generated_summary;
  if (!summary) return <DoctorShell showBack><p>Error: No summary data found.</p></DoctorShell>;

  const handleSave = async (markCompleted = false) => {
    setIsSaving(true);
    await saveNotes(encounter.id, {
      doctor_diagnosis: diagnosis,
      doctor_prescription: prescription,
      doctor_plan: plan
    });
    
    if (markCompleted) {
      await updateStatus(encounter.id, 'completed');
      navigate('/doctor/queue');
    }
    setIsSaving(false);
  };

  return (
    <DoctorShell title={`Patient Review: ${encounter.patient_id}`} showBack>
      <div className="encounter-split">
        
        {/* Left Pane: Read-only Patient Summary */}
        <div className="encounter-pane">
          <div className="encounter-pane__header">
            Patient Intake Summary
          </div>
          <div className="encounter-pane__content">
            {summary.redFlagAlerts.length > 0 && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--sl-danger)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <h3 style={{ color: 'var(--sl-danger)', marginBottom: '8px' }}>🚨 URGENT ALERTS</h3>
                <ul style={{ paddingLeft: '20px' }}>
                  {summary.redFlagAlerts.map((f, i) => (
                    <li key={i}><strong>{f.rule.name_en}:</strong> {f.rule.action_en}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--sl-accent)' }}>Chief Complaint</h3>
              <p>{summary.chiefComplaint || 'None recorded'}</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--sl-accent)' }}>History of Present Illness</h3>
              <p>{summary.hpiNarrative || 'No HPI narrative generated'}</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--sl-accent)' }}>Past Medical History</h3>
              <p><strong>Conditions:</strong> {summary.pastMedicalHistory.length ? summary.pastMedicalHistory.join(', ') : 'None'}</p>
              <p><strong>Medications:</strong> {summary.currentMedications.length ? summary.currentMedications.join(', ') : 'None'}</p>
              <p><strong>Allergies:</strong> {summary.allergies.length ? summary.allergies.join(', ') : 'None'}</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--sl-accent)' }}>Review of Systems</h3>
              {Object.keys(summary.reviewOfSystems).length > 0 ? (
                <ul style={{ paddingLeft: '20px' }}>
                  {Object.entries(summary.reviewOfSystems).map(([sys, findings], idx) => (
                    <li key={idx}><strong>{sys}:</strong> {findings.join(', ')}</li>
                  ))}
                </ul>
              ) : <p>No pertinent positives reported.</p>}
            </div>

            {summary.prakritiResult && (
              <div style={{ background: 'var(--sl-bg-body)', padding: '16px', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--sl-accent)' }}>🌿 AYUSH Prakriti</h3>
                <p style={{ marginBottom: '16px' }}><strong>Dominant Dosha:</strong> {summary.prakritiResult.primaryDosha} {summary.prakritiResult.secondaryDosha && `- ${summary.prakritiResult.secondaryDosha}`}</p>
                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ width: '60px' }}>Vata</span>
                    <div style={{ flex: 1, background: '#1f2937', height: '8px', borderRadius: '4px' }}>
                      <div style={{ background: '#34d399', width: `${summary.prakritiResult.percentages.vata}%`, height: '100%', borderRadius: '4px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ width: '60px' }}>Pitta</span>
                    <div style={{ flex: 1, background: '#1f2937', height: '8px', borderRadius: '4px' }}>
                      <div style={{ background: '#f87171', width: `${summary.prakritiResult.percentages.pitta}%`, height: '100%', borderRadius: '4px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ width: '60px' }}>Kapha</span>
                    <div style={{ flex: 1, background: '#1f2937', height: '8px', borderRadius: '4px' }}>
                      <div style={{ background: '#60a5fa', width: `${summary.prakritiResult.percentages.kapha}%`, height: '100%', borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Doctor's Workspace */}
        <div className="encounter-pane" style={{ border: '2px solid var(--sl-border-focus)' }}>
          <div className="encounter-pane__header" style={{ background: 'rgba(0, 217, 166, 0.05)', color: 'var(--sl-accent)' }}>
            Doctor's Workspace
          </div>
          <div className="encounter-pane__content">
            {/* AI Assist Button */}
            <div style={{ marginBottom: '20px' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  ai.generate(summary as FormattedSummary, encounter.mode);
                }}
                disabled={ai.isLoading || !ai.isAvailable}
                style={{
                  width: '100%',
                  background: ai.isAvailable ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--sl-bg-secondary)',
                  fontSize: '1rem',
                  minHeight: '48px',
                }}
              >
                {ai.isLoading ? '🧠 Analyzing...' : ai.result ? '✅ AI Analysis Complete' : '🤖 AI Assist — Generate Diagnosis'}
              </button>
              {!ai.isAvailable && (
                <p style={{ fontSize: '0.75rem', color: 'var(--sl-text-muted)', marginTop: '4px' }}>
                  Set VITE_GEMINI_API_KEY in .env to enable AI
                </p>
              )}
              {ai.error && (
                <p style={{ fontSize: '0.8rem', color: 'var(--sl-danger)', marginTop: '4px' }}>⚠️ {ai.error}</p>
              )}
            </div>

            {/* AI Results Preview */}
            {ai.result && (
              <div style={{
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: 'var(--sl-radius-md)',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '0.85rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ color: '#a78bfa' }}>🔬 AI Differential Diagnoses</strong>
                  <button
                    onClick={() => {
                      const dxText = ai.result!.differentials.map(d => `${d.condition} (${d.likelihood}): ${d.reasoning}`).join('\n');
                      setDiagnosis(prev => prev ? `${prev}\n\n--- AI Suggestion ---\n${dxText}` : dxText);
                      if (ai.result!.soapNote.plan) {
                        setPlan(prev => prev || ai.result!.soapNote.plan);
                      }
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                  >
                    📋 Apply to Fields
                  </button>
                </div>
                {ai.result.differentials.map((dx, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px', alignItems: 'baseline' }}>
                    <span style={{
                      padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600,
                      background: dx.likelihood === 'High' ? 'rgba(239,68,68,0.15)' : dx.likelihood === 'Moderate' ? 'rgba(234,179,8,0.15)' : 'rgba(107,114,128,0.15)',
                      color: dx.likelihood === 'High' ? '#f87171' : dx.likelihood === 'Moderate' ? '#fbbf24' : '#9ca3af',
                    }}>{dx.likelihood}</span>
                    <span><strong>{dx.condition}</strong> — {dx.reasoning}</span>
                  </div>
                ))}
              </div>
            )}

            <label className="doctor-form-label">Clinical Diagnosis</label>
            <textarea 
              className="doctor-textarea" 
              placeholder="Enter final diagnosis or differential diagnoses..."
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
            />

            <label className="doctor-form-label">Prescription / Medications</label>
            <textarea 
              className="doctor-textarea" 
              placeholder="Rx..."
              value={prescription}
              onChange={e => setPrescription(e.target.value)}
            />

            <label className="doctor-form-label">Plan / Investigations</label>
            <textarea 
              className="doctor-textarea" 
              placeholder="Lab orders, imaging, follow-up..."
              value={plan}
              onChange={e => setPlan(e.target.value)}
            />

            <div style={{ display: 'flex', gap: '16px', marginTop: 'auto', paddingTop: '24px' }}>
              <button 
                className="btn-secondary" 
                onClick={() => handleSave(false)} 
                disabled={isSaving}
                style={{ flex: 1 }}
              >
                {isSaving ? 'Saving...' : '💾 Save Draft'}
              </button>
              <button 
                className="btn-primary" 
                onClick={() => handleSave(true)} 
                disabled={isSaving}
                style={{ flex: 2 }}
              >
                ✅ Sign & Complete
              </button>
            </div>
          </div>
        </div>

      </div>
    </DoctorShell>
  );
}
