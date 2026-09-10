import type { ReactNode } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import './OnboardingShell.css';

interface OnboardingShellProps {
  children: ReactNode;
  currentStep: number; // 1 to 4
  totalSteps?: number;
}

export function OnboardingShell({ children, currentStep, totalSteps = 4 }: OnboardingShellProps) {
  const { t } = useTranslation();
  return (
    <div className="onboarding-shell">
      <header className="onboarding-header">
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
