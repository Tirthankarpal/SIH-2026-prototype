import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingShell } from '../components/OnboardingShell';
import { useTranslation } from '../../../hooks/useTranslation';
import { useInterviewStore } from '../../../store/interviewStore';
import { useSessionStore } from '../../../store/sessionStore';
import { extractMedicalDocument } from '../../../lib/gemini';
import { generateSummary } from '../../summary/formatters/clinicalFormatters';
import { api } from '../../../lib/supabase';
import type { ScannedDocument } from '../../../types/clinical';

export function DocumentScan() {

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { completedInterview, scannedDocuments, addScannedDocument } = useInterviewStore();
  const patientId = useSessionStore((s) => s.patientId);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG).');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Read file as base64 data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let extracted = { type: 'other', date: 'Unknown', extractedData: {}, rawText: 'No internet connection. OCR bypassed.' };
      let publicUrl: string | null = null;

      // Call Gemini Vision to extract and Supabase to upload in parallel (if online)
      if (navigator.onLine) {
        const results = await Promise.all([
          extractMedicalDocument(dataUrl).catch(e => {
            console.error('OCR Failed', e);
            return { type: 'other', date: 'Unknown', extractedData: {}, rawText: 'OCR Failed' };
          }),
          api.uploadDocument(dataUrl)
        ]);
        extracted = results[0];
        publicUrl = results[1];
      } else {
        // Offline: just queue the upload, skip OCR
        publicUrl = await api.uploadDocument(dataUrl);
      }

      const newDoc: ScannedDocument = {
        id: crypto.randomUUID(),
        type: (extracted.type || 'other') as ScannedDocument['type'],
        date: extracted.date || 'Unknown',
        extractedData: extracted.extractedData || {},
        rawText: extracted.rawText || 'No text extracted',
        imageUrl: publicUrl || dataUrl, // Use public URL if upload succeeded, else fallback to base64
      };

      addScannedDocument(newDoc);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process document. Please try again.');
    } finally {
      setIsProcessing(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFinish = async () => {
    if (!completedInterview) {
      // Fallback if accessed out of order
      navigate('/onboarding/language');
      return;
    }

    setIsProcessing(true);
    try {
      const summary = generateSummary(completedInterview);
      
      await api.submitEncounter({
        patient_id: patientId || 'unknown',
        mode: completedInterview.mode,
        engine_state: completedInterview,
        generated_summary: summary,
        scanned_documents: scannedDocuments.length > 0 ? scannedDocuments : null,
        red_flag_count: completedInterview.redFlags.length
      });
      
      navigate('/summary');
    } catch (err) {
      console.error('Failed to submit encounter:', err);
      setError('Failed to submit. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <OnboardingShell currentStep={6} totalSteps={6}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--sl-space-6)' }}>
        <h1 className="onboarding-page-title">Scan Prior Medical Records</h1>
        <h2 className="onboarding-page-subtitle">
          Upload past prescriptions, lab reports, or discharge summaries for your doctor.
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
        
        {/* Upload Area */}
        <div 
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--sl-border-light)',
            borderRadius: 'var(--sl-radius-lg)',
            padding: 'var(--sl-space-8) var(--sl-space-4)',
            textAlign: 'center',
            cursor: isProcessing ? 'wait' : 'pointer',
            background: 'var(--sl-bg-card)',
            transition: 'border-color 0.2s ease',
          }}
          onMouseOver={(e) => {
            if (!isProcessing) e.currentTarget.style.borderColor = 'var(--sl-accent)';
          }}
          onMouseOut={(e) => {
            if (!isProcessing) e.currentTarget.style.borderColor = 'var(--sl-border-light)';
          }}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '3rem', marginBottom: 'var(--sl-space-2)' }}>📄</div>
          <div style={{ fontWeight: 'bold', color: 'var(--sl-text-primary)', marginBottom: 'var(--sl-space-1)' }}>
            {isProcessing ? 'Analyzing Document...' : 'Tap to Upload Image'}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--sl-text-muted)' }}>
            Takes a photo of your document
          </div>
        </div>

        {error && (
          <div style={{ color: 'var(--sl-emergency)', background: 'var(--sl-emergency-bg)', padding: 'var(--sl-space-3)', borderRadius: 'var(--sl-radius-md)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Uploaded Documents List */}
        {scannedDocuments.length > 0 && (
          <div style={{ marginTop: 'var(--sl-space-4)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--sl-space-2)', color: 'var(--sl-text-primary)' }}>Uploaded Documents</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-2)' }}>
              {scannedDocuments.map((doc) => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', padding: 'var(--sl-space-3)', background: 'var(--sl-bg-subtle)', border: '1px solid var(--sl-border-light)', borderRadius: 'var(--sl-radius-md)' }}>
                  <div style={{ fontSize: '1.5rem', marginRight: 'var(--sl-space-3)' }}>
                    {doc.type === 'prescription' ? '💊' : doc.type === 'lab_report' ? '🔬' : '📑'}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>{doc.type.replace('_', ' ')}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--sl-text-muted)' }}>{doc.date}</div>
                  </div>
                  <div style={{ color: 'var(--sl-success)', fontWeight: 'bold' }}>✓ Processed</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--sl-space-3)', marginTop: 'var(--sl-space-6)' }}>
          <button 
            className="btn-secondary" 
            style={{ flex: 1 }}
            onClick={handleFinish}
            disabled={isProcessing}
          >
            {scannedDocuments.length > 0 ? 'Submit Encounter' : 'Skip & Submit'}
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}
