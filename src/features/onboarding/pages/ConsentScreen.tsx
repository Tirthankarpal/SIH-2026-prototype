import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../../store/sessionStore';
import { useAudioPrompt } from '../../../hooks/useAudioPrompt';
import { useTranslation } from '../../../hooks/useTranslation';
import { OnboardingShell } from '../components/OnboardingShell';

export function ConsentScreen() {
  const navigate = useNavigate();
  const { setConsent, language } = useSessionStore();
  const { t } = useTranslation();

  useAudioPrompt(
    "Please review the data consent and press I Agree to continue.",
    "कृपया डेटा सहमति की समीक्षा करें और जारी रखने के लिए 'मैं सहमत हूँ' दबाएँ।"
  );

  const handleAgree = () => {
    setConsent(true);
    navigate('/onboarding/mode');

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        language === 'hi-IN' 
          ? 'कृपया अपनी चिकित्सा पद्धति चुनें: आधुनिक चिकित्सा या आयुर्वेद।'
          : 'Please select your preferred medical mode: Modern Medicine or Ayurveda.'
      );
      utterance.lang = language;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDecline = () => {
    navigate('/');
  };

  return (
    <OnboardingShell currentStep={3}>
      <h1 className="onboarding-page-title">{t.onboarding.consent_title}</h1>
      <h2 className="onboarding-page-subtitle">{t.onboarding.consent_subtitle}</h2>
      
      <div style={{ background: 'var(--sl-bg-card)', padding: 'var(--sl-space-6)', borderRadius: 'var(--sl-radius-lg)', margin: 'var(--sl-space-6) 0' }}>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--sl-text-primary)' }}>
          {t.onboarding.consent_text}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--sl-space-4)' }}>
        <button 
          className="btn-primary" 
          onClick={handleAgree}
          style={{ flex: 2, minHeight: '56px', fontSize: '1.25rem', background: 'var(--sl-accent)' }}
        >
          ✅ {t.onboarding.btn_agree}
        </button>
        <button 
          className="btn-primary" 
          onClick={handleDecline}
          style={{ flex: 1, background: 'var(--sl-bg-secondary)', color: 'var(--sl-text-primary)', border: '1px solid var(--sl-border)' }}
        >
          {t.onboarding.btn_decline}
        </button>
      </div>
    </OnboardingShell>
  );
}
