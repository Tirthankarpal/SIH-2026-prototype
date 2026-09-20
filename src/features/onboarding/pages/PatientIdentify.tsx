import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingShell } from '../components/OnboardingShell';
import { useSessionStore } from '../../../store/sessionStore';
import { useAudioPrompt } from '../../../hooks/useAudioPrompt';
import { useTranslation } from '../../../hooks/useTranslation';
import '../components/OnboardingShell.css';

export function PatientIdentify() {
  const navigate = useNavigate();
  const { language, setPatientId } = useSessionStore();
  const { t } = useTranslation();

  const [step, setStep] = useState<'INIT' | 'OTP' | 'SUCCESS'>('INIT');
  const [healthId, setHealthId] = useState('');
  const [otp, setOtp] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useAudioPrompt(
    "Please enter your ABHA ID or phone number.",
    "कृपया अपनी आभा आईडी या फोन नंबर दर्ज करें।"
  );

  const handleInit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!healthId.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const backendUrl = import.meta.env.VITE_CLINICAL_ENGINE_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/api/abdm/v0.5/users/auth/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ healthid: healthId, authMethod: "MOBILE_OTP" })
      });
      if (!res.ok) throw new Error('Failed to communicate with ABDM Gateway');
      
      const data = await res.json();
      setTransactionId(data.transactionId);
      setStep('OTP');
      
      // Audio prompt for OTP
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          language.startsWith('hi') 
            ? 'आपके मोबाइल पर एक ओ.टी.पी. भेजा गया है। कृपया उसे दर्ज करें।'
            : 'An OTP has been sent to your mobile. Please enter it.'
        );
        utterance.lang = language;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('OTP must be exactly 6 digits.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const backendUrl = import.meta.env.VITE_CLINICAL_ENGINE_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/api/abdm/v0.5/users/auth/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, credential: otp })
      });
      if (!res.ok) throw new Error('Invalid OTP');
      
      const data = await res.json();
      
      // Extract patient demographic info from the ABDM response
      const patientName = data.patient.name;
      const abhaAddress = data.patient.id;
      
      // Store in session (using ABHA ID for global reference)
      setPatientId(abhaAddress);
      
      setStep('SUCCESS');
      
      setTimeout(() => {
        navigate('/onboarding/consent');
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(
            language.startsWith('hi') 
              ? 'कृपया डेटा सहमति की समीक्षा करें और आगे बढ़ें।'
              : 'Please review the data consent and press I Agree to continue.'
          );
          utterance.lang = language;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'OTP Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingShell currentStep={2}>
      <h1 className="onboarding-page-title">{t.onboarding.identify_title}</h1>
      <h2 className="onboarding-page-subtitle">{t.onboarding.identify_subtitle}</h2>
      
      <div className="id-input-container">
        {error && (
          <div style={{ color: 'var(--sl-danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {step === 'INIT' && (
          <form onSubmit={handleInit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-6)' }}>
            <input 
              type="text" 
              className="id-input"
              value={healthId}
              onChange={(e) => setHealthId(e.target.value)}
              placeholder="Enter ABHA ID (e.g. name@abdm)"
              disabled={isLoading}
              autoFocus
            />
            <button 
              type="submit" 
              className="btn-primary"
              disabled={!healthId.trim() || isLoading}
              style={{ width: '100%', minHeight: '56px', fontSize: '1.25rem' }}
            >
              {isLoading ? 'Verifying...' : 'Request OTP'} →
            </button>
            <p style={{ textAlign: 'center', color: 'var(--sl-text-muted)', fontSize: '0.85rem' }}>
              Secured by National Health Authority (NHA)
            </p>
          </form>
        )}

        {step === 'OTP' && (
          <form onSubmit={handleConfirm} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-6)' }}>
            <input 
              type="number" 
              className="id-input"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              disabled={isLoading}
              maxLength={6}
              autoFocus
            />
            <button 
              type="submit" 
              className="btn-primary"
              disabled={otp.length !== 6 || isLoading}
              style={{ width: '100%', minHeight: '56px', fontSize: '1.25rem' }}
            >
              {isLoading ? 'Verifying...' : 'Verify & Link Health Records'} →
            </button>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => setStep('INIT')}
              style={{ width: '100%' }}
            >
              Cancel
            </button>
          </form>
        )}

        {step === 'SUCCESS' && (
          <div style={{ textAlign: 'center', padding: 'var(--sl-space-6)', background: 'var(--sl-bg-card)', borderRadius: 'var(--sl-radius-xl)', border: '2px solid var(--sl-success)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
            <h3 style={{ color: 'var(--sl-success)', fontSize: '1.25rem', marginBottom: '8px' }}>ABHA Verified</h3>
            <p style={{ color: 'var(--sl-text-secondary)' }}>Retrieving health records...</p>
          </div>
        )}
      </div>
    </OnboardingShell>
  );
}
