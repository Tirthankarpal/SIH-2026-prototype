import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import './OnboardingShell.css';

interface OnboardingShellProps {
  children: ReactNode;
  currentStep: number; // 1 to 4
  totalSteps?: number;
}

export function OnboardingShell({ children, currentStep, totalSteps = 4 }: OnboardingShellProps) {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <div className="onboarding-shell">
      {isOffline && (
        <div style={{
          background: 'var(--sl-emergency)',
          color: 'var(--sl-emergency-bg)',
          textAlign: 'center',
          padding: '8px',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0
        }}>
          <span>⚠️</span>
          <span>Offline Mode — Data will sync automatically when connected.</span>
        </div>
      )}
      <header className="onboarding-header" style={{ marginTop: isOffline ? '40px' : '0' }}>
        <div className="onboarding-brand">
          <div className="onboarding-step-text">
            {t.onboarding.step} {currentStep} {t.onboarding.of} {totalSteps}
          </div>
          <div className="onboarding-logo" aria-hidden="true">स्व</div>
          <div className="onboarding-title-group">
            <span className="onboarding-title">SwasthyaLipi</span>
            <span className="onboarding-subtitle">स्वास्थ्यलिपि</span>
          </div>
        </div>
      </header>

      <main className="onboarding-main">
        {children}
      </main>

      <div className="onboarding-progress" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`progress-dot ${step === currentStep ? 'progress-dot--active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
