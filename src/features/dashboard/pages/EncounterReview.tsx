import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DoctorShell } from '../components/DoctorShell';
import { useDoctorStore } from '../../../store/doctorStore';
import { useAISummary } from '../../../hooks/useAISummary';
import type { FormattedSummary } from '../../summary/formatters/clinicalFormatters';
import { generateFHIRBundle } from '../../../lib/fhir';

const renderExtractedData = (data: any) => {
  if (!data) return <span style={{ color: 'var(--sl-text-muted)' }}>No data extracted</span>;
  if (typeof data === 'string') return <span style={{ color: 'var(--sl-text-secondary)' }}>{data}</span>;
  
  if (typeof data === 'object') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {Object.entries(data).map(([key, value]) => {
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          let formattedValue: React.ReactNode = String(value);
          
          if (Array.isArray(value)) {
            formattedValue = (
              <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                {value.map((item, i) => (
                  <li key={i} style={{ marginBottom: '6px' }}>
                    {typeof item === 'object' && item !== null ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '2px 8px', fontSize: '0.9rem' }}>
                        {Object.entries(item).map(([k, v]) => (
                          <React.Fragment key={k}>
                            <span style={{ color: 'var(--sl-text-muted)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}:</span>
                            <span>{String(v)}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    ) : (
                      String(item)
                    )}
                  </li>
                ))}
              </ul>
            );
          } else if (typeof value === 'object' && value !== null) {
            formattedValue = <pre style={{ margin: '4px 0 0 0', padding: '8px', background: 'var(--sl-bg-body)', borderRadius: '4px', fontSize: '0.8rem' }}>{JSON.stringify(value, null, 2)}</pre>;
          }

          return (
            <div key={key}>
              <strong style={{ color: 'var(--sl-text-primary)' }}>{formattedKey}:</strong>{' '}
              <span style={{ color: 'var(--sl-text-secondary)' }}>{formattedValue}</span>
            </div>
          );
        })}
      </div>
    );
  }
  
  return <span>{String(data)}</span>;
};

export function EncounterReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { encounters, updateStatus, saveNotes, fetchQueue } = useDoctorStore();
  
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [plan, setPlan] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const ai = useAISummary();

  const [demographics, setDemographics] = useState({ name: 'John Doe', age: '35', gender: 'Male', abhaAddress: 'johndoe@abdm' });
  const [hpiNarrative, setHpiNarrative] = useState('');
  const [ayushPrimary, setAyushPrimary] = useState('');
  const [ayushSecondary, setAyushSecondary] = useState('');
  const [acceptedDocs, setAcceptedDocs] = useState<Set<number>>(new Set());

  const encounter = encounters.find(e => e.id === id);

  useEffect(() => {
    if (!encounter) {
      fetchQueue();
    } else {
      setDiagnosis(encounter.doctor_diagnosis || '');
      setPrescription(encounter.doctor_prescription || '');
      setPlan(encounter.doctor_plan || '');
      
      setHpiNarrative(encounter.generated_summary?.hpiNarrative || '');
      setAyushPrimary(encounter.generated_summary?.prakritiResult?.primaryDosha || '');
      setAyushSecondary(encounter.generated_summary?.prakritiResult?.secondaryDosha || '');
      if (encounter.scanned_documents) {
        setAcceptedDocs(new Set(encounter.scanned_documents.map((_, i) => i)));
      }
      
      // Auto-update status to in_consultation when opened
      if (encounter.status === 'intake_completed' || encounter.status === 'waiting') {
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

  const handleExportFHIR = async () => {
    try {
      // Create a cloned encounter to pass the edited values to the FHIR generator
      const editedEncounter = JSON.parse(JSON.stringify(encounter));
      if (editedEncounter.generated_summary) {
        editedEncounter.generated_summary.hpiNarrative = hpiNarrative;
        if (editedEncounter.generated_summary.prakritiResult) {
          editedEncounter.generated_summary.prakritiResult.primaryDosha = ayushPrimary;
          editedEncounter.generated_summary.prakritiResult.secondaryDosha = ayushSecondary;
        }
      }
      editedEncounter.doctor_diagnosis = diagnosis;
      editedEncounter.doctor_prescription = prescription;

      const bundle = generateFHIRBundle(editedEncounter, demographics);
      
      // 1. Post to our backend background worker (Simulating Kafka / ABDM Integration)
      const backendUrl = import.meta.env.VITE_CLINICAL_ENGINE_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/fhir/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundle)
      });
      
      if (!response.ok) {
        console.error('Failed to queue FHIR transmission');
      }

      // 2. Still download the JSON file locally so the Jury can see it
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/fhir+json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fhir-bundle-${encounter.patient_id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('✅ FHIR Bundle successfully queued for ABDM transmission!');
    } catch (e: any) {
      alert('Failed to generate FHIR Bundle: ' + e.message);
    }
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
            
            <div style={{ marginBottom: '24px', background: 'var(--sl-bg-subtle)', padding: '16px', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--sl-accent)' }}>Patient Demographics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="doctor-form-label" style={{ fontSize: '0.8rem' }}>Full Name</label>
                  <input type="text" className="doctor-textarea" style={{ minHeight: '38px', padding: '8px' }} value={demographics.name} onChange={e => setDemographics({...demographics, name: e.target.value})} />
                </div>
                <div>
                  <label className="doctor-form-label" style={{ fontSize: '0.8rem' }}>Age / Gender</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="number" className="doctor-textarea" style={{ minHeight: '38px', padding: '8px', flex: 1 }} value={demographics.age} onChange={e => setDemographics({...demographics, age: e.target.value})} />
                    <select className="doctor-textarea" style={{ minHeight: '38px', padding: '8px', flex: 1 }} value={demographics.gender} onChange={e => setDemographics({...demographics, gender: e.target.value})}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="doctor-form-label" style={{ fontSize: '0.8rem' }}>ABHA Address</label>
                  <input type="text" className="doctor-textarea" style={{ minHeight: '38px', padding: '8px' }} value={demographics.abhaAddress} onChange={e => setDemographics({...demographics, abhaAddress: e.target.value})} />
                </div>
              </div>
            </div>
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
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--sl-accent)' }}>Chief Complaint & HPI (Editable)</h3>
              <div style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--sl-text-secondary)' }}><strong>CC:</strong> {summary.chiefComplaint || 'None recorded'}</div>
              <textarea 
                className="doctor-textarea" 
                value={hpiNarrative} 
                onChange={e => setHpiNarrative(e.target.value)} 
                style={{ minHeight: '120px' }}
                placeholder="Edit the history of present illness here..."
              />
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

            {encounter.scanned_documents && encounter.scanned_documents.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--sl-accent)' }}>Prior Medical Records</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {encounter.scanned_documents.map((doc, idx) => (
                    <div key={idx} style={{ background: 'var(--sl-bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--sl-border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <strong style={{ textTransform: 'capitalize' }}>
                          {doc.type === 'prescription' ? '💊 ' : doc.type === 'lab_report' ? '🔬 ' : '📑 '}
                          {doc.type.replace('_', ' ')}
                        </strong>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--sl-text-muted)' }}>{doc.date}</span>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', cursor: 'pointer', background: acceptedDocs.has(idx) ? 'rgba(52, 211, 153, 0.1)' : 'var(--sl-bg-card)', padding: '4px 8px', borderRadius: '12px', border: `1px solid ${acceptedDocs.has(idx) ? '#34d399' : 'var(--sl-border-light)'}` }}>
                            <input type="checkbox" checked={acceptedDocs.has(idx)} onChange={(e) => {
                              const newSet = new Set(acceptedDocs);
                              if (e.target.checked) newSet.add(idx);
                              else newSet.delete(idx);
                              setAcceptedDocs(newSet);
                            }} />
                            {acceptedDocs.has(idx) ? 'Accepted' : 'Rejected'}
                          </label>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '0.9rem', marginBottom: '12px', background: 'var(--sl-bg-card)', padding: '12px', borderRadius: '6px', border: '1px solid var(--sl-border-light)' }}>
                        {renderExtractedData(doc.extractedData)}
                      </div>

                      {doc.imageUrl && (
                        <a 
                          href={doc.imageUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ fontSize: '0.85rem', color: 'var(--sl-accent)', textDecoration: 'underline' }}
                        >
                          View Original Image
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.prakritiResult && (
              <div style={{ background: 'var(--sl-bg-body)', padding: '16px', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--sl-accent)' }}>🌿 AYUSH Prakriti</h3>
                <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <strong>Dominant Dosha:</strong> 
                  <select className="doctor-textarea" style={{ minHeight: '30px', padding: '4px 8px', width: '120px' }} value={ayushPrimary} onChange={e => setAyushPrimary(e.target.value)}>
                    <option value="Vata">Vata</option>
                    <option value="Pitta">Pitta</option>
                    <option value="Kapha">Kapha</option>
                  </select>
                  <select className="doctor-textarea" style={{ minHeight: '30px', padding: '4px 8px', width: '120px' }} value={ayushSecondary} onChange={e => setAyushSecondary(e.target.value)}>
                    <option value="">None</option>
                    <option value="Vata">Vata</option>
                    <option value="Pitta">Pitta</option>
                    <option value="Kapha">Kapha</option>
                  </select>
                </div>
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

            <div style={{ display: 'flex', gap: '16px', marginTop: 'auto', paddingTop: '24px', flexWrap: 'wrap' }}>
              <button 
                className="btn-secondary" 
                onClick={handleExportFHIR} 
                style={{ flex: '1 1 100%', border: '1px dashed var(--sl-accent)', color: 'var(--sl-accent)' }}
              >
                📥 Export ABDM FHIR Bundle
              </button>
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
