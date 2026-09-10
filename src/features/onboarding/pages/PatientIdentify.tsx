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
  const [inputValue, setInputValue] = useState('');
  const { t } = useTranslation();

  useAudioPrompt(
    "Please enter your ABHA ID or phone number.",
    "कृपया अपनी आभा आईडी या फोन नंबर दर्ज करें।"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    setPatientId(inputValue);
    navigate('/onboarding/consent');

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        language === 'hi-IN' 
          ? 'कृपया डेटा सहमति की समीक्षा करें और आगे बढ़ें।'
          : 'Please review the data consent and press I Agree to continue.'
      );
      utterance.lang = language;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <OnboardingShell currentStep={2}>
      <h1 className="onboarding-page-title">{t.onboarding.identify_title}</h1>
      <h2 className="onboarding-page-subtitle">{t.onboarding.identify_subtitle}</h2>
      
      <form className="id-input-container" onSubmit={handleSubmit}>
        <input 
          type="text" 
          className="id-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t.onboarding.identify_placeholder}
          autoFocus
        />
        <button 
          type="submit" 
          className="btn-primary"
          disabled={!inputValue.trim()}
          style={{ width: '100%', minHeight: '56px', fontSize: '1.25rem' }}
        >
          {t.onboarding.btn_continue} →
        </button>
      </form>
    </OnboardingShell>
  );
}
