import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingShell } from '../components/OnboardingShell';
import { useSessionStore } from '../../../store/sessionStore';
import { useInterviewStore } from '../../../store/interviewStore';
import { useAudioPrompt } from '../../../hooks/useAudioPrompt';
import { useTranslation } from '../../../hooks/useTranslation';
import { LANGUAGE_LABELS, type SupportedLanguage } from '../../../hooks/useSpeechRecognition';
import '../components/OnboardingShell.css';

export function LanguageSelect() {
  const navigate = useNavigate();
  const setLanguage = useSessionStore((s) => s.setLanguage);
  const resetSession = useSessionStore((s) => s.resetSession);
  const clearInterview = useInterviewStore((s) => s.clearInterview);
  const { t } = useTranslation();

  // WIPE ANY PREVIOUS PATIENT DATA WHEN LANDING ON THE START PAGE
  useEffect(() => {
    resetSession();
    clearInterview();
  }, [resetSession, clearInterview]);

  useAudioPrompt(
    "Welcome to Swasthya Lipi. Please select your preferred language.",
    "स्वास्थ्यलिपि में आपका स्वागत है। कृपया अपनी भाषा चुनें।"
  );

  const handleSelect = (lang: SupportedLanguage) => {
    setLanguage(lang);
    navigate('/onboarding/identify');
    
    // Play audio prompt for the next screen (fallback to Hindi/English if not exact)
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        lang.startsWith('en') 
          ? 'Please enter your ABHA ID or phone number.'
          : 'कृपया अपना आभा आईडी या फोन नंबर दर्ज करें।'
      );
      utterance.lang = lang;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <OnboardingShell currentStep={1}>
      <div className="onboarding-content fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 className="onboarding-title">{t.onboarding.language_select_title}</h1>
        <p className="onboarding-subtitle" style={{ marginBottom: '20px' }}>Select from 22 official Indian languages</p>

        <div className="lang-grid">
          {Object.entries(LANGUAGE_LABELS).map(([code, label]) => {
            // Extract the native name inside parentheses (e.g. "Bengali (বাংলা)" -> "বাংলা")
            const match = label.match(/\((.*?)\)/);
            const nativeName = match ? match[1] : label;
            const englishName = label.split(' (')[0];
            const initial = nativeName.charAt(0).toUpperCase();

            return (
              <button 
                key={code}
                className="lang-btn" 
                onClick={() => handleSelect(code as SupportedLanguage)}
                style={{ padding: 'var(--sl-space-4)' }} // slightly less padding for the bigger grid
              >
                <span className="lang-icon" style={{ fontSize: '2rem' }}>{initial}</span>
                <span className="lang-label" style={{ fontSize: '1rem', textAlign: 'center' }}>
                  {nativeName}<br/>
                  <small style={{ fontWeight: 'normal', color: 'var(--sl-text-secondary)', fontSize: '0.8rem' }}>{englishName}</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </OnboardingShell>
  );
}
