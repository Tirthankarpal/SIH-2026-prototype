import { useNavigate } from 'react-router-dom';
import { useSessionStore, type InterviewMode } from '../../../store/sessionStore';
import { useAudioPrompt } from '../../../hooks/useAudioPrompt';
import { useTranslation } from '../../../hooks/useTranslation';
import { OnboardingShell } from '../components/OnboardingShell';

export function ModeSelect() {
  const navigate = useNavigate();
  const { setMode } = useSessionStore();
  const { t } = useTranslation();

  useAudioPrompt(
    "Please select your preferred medical mode: Modern Medicine or Ayurveda.",
    "कृपया अपनी चिकित्सा पद्धति चुनें: आधुनिक चिकित्सा या आयुर्वेद।"
  );

  const handleSelect = (mode: InterviewMode) => {
    setMode(mode);
    navigate('/interview');
  };

  return (
    <OnboardingShell currentStep={4}>
      <h1 className="onboarding-page-title">{t.onboarding.mode_title}</h1>
      <h2 className="onboarding-page-subtitle">{t.onboarding.mode_subtitle}</h2>
      
      <div style={{ display: 'grid', gap: 'var(--sl-space-4)', marginTop: 'var(--sl-space-6)', width: '100%', maxWidth: '400px' }}>
        <div 
          className="mode-card" 
          onClick={() => handleSelect('modern')}
        >
          <span className="mode-card__icon">🩺</span>
          <div className="mode-card__title">{t.onboarding.mode_modern}</div>
        </div>

        <div 
          className="mode-card mode-card--ayush" 
          onClick={() => handleSelect('ayush')}
        >
          <span className="mode-card__icon">🌿</span>
          <div className="mode-card__title">{t.onboarding.mode_ayush}</div>
        </div>

        <div 
          className="mode-card" 
          onClick={() => handleSelect('modern')}
          style={{ background: 'var(--sl-bg-subtle)', borderStyle: 'dashed' }}
        >
          <span className="mode-card__icon">🤷</span>
          <div>
            <div className="mode-card__title">{t.onboarding.mode_unsure}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--sl-text-muted)', marginTop: '4px' }}>
              ({t.onboarding.mode_unsure_desc})
            </div>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}
