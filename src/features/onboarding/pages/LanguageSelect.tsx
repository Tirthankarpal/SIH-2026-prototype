import { useNavigate } from 'react-router-dom';
import { OnboardingShell } from '../components/OnboardingShell';
import { useSessionStore } from '../../../store/sessionStore';
import { useAudioPrompt } from '../../../hooks/useAudioPrompt';
import { useTranslation } from '../../../hooks/useTranslation';
import '../components/OnboardingShell.css';

export function LanguageSelect() {
  const navigate = useNavigate();
  const setLanguage = useSessionStore((s) => s.setLanguage);
  const { t } = useTranslation();

  useAudioPrompt(
    "Welcome to Swasthya Lipi. Please select your preferred language.",
    "स्वास्थ्यलिपि में आपका स्वागत है। कृपया अपनी भाषा चुनें।"
  );

  const handleSelect = (lang: 'en-IN' | 'hi-IN') => {
    setLanguage(lang);
    navigate('/onboarding/identify');
    
    // Play audio prompt for the next screen
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        lang === 'hi-IN' 
          ? 'कृपया अपना आभा आईडी या फोन नंबर दर्ज करें।'
          : 'Please enter your ABHA ID or phone number.'
      );
      utterance.lang = lang;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <OnboardingShell currentStep={1}>
      <div className="onboarding-content fade-in">
        <h1 className="onboarding-title">{t.onboarding.language_select_title}</h1>
        <p className="onboarding-subtitle">{t.onboarding.language_select_subtitle}</p>

        <div className="lang-grid">
        <button 
          className="lang-btn" 
          onClick={() => handleSelect('en-IN')}
          aria-label="Select English"
        >
          <span className="lang-icon">A</span>
          <span className="lang-label">English</span>
        </button>
        
        <button 
          className="lang-btn" 
          onClick={() => handleSelect('hi-IN')}
          aria-label="Select Hindi"
        >
          <span className="lang-icon">अ</span>
          <span className="lang-label">हिन्दी</span>
        </button>
        </div>
      </div>
    </OnboardingShell>
  );
}
