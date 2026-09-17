import { createBrowserRouter, RouterProvider, Navigate, useNavigate } from 'react-router-dom';
import { LanguageSelect } from '../features/onboarding/pages/LanguageSelect';
import { PatientIdentify } from '../features/onboarding/pages/PatientIdentify';
import { ConsentScreen } from '../features/onboarding/pages/ConsentScreen';
import { ModeSelect } from '../features/onboarding/pages/ModeSelect';
import { DocumentScan } from '../features/onboarding/pages/DocumentScan';
import { InterviewShell } from '../features/interview/components/InterviewShell';
import { useSessionStore } from '../store/sessionStore';
import { useInterviewStore } from '../store/interviewStore';
import type { EngineState } from '../features/interview/engine/branchingEngine';
import { SummaryView } from '../features/summary/pages/SummaryView';
import { generateSummary } from '../features/summary/formatters/clinicalFormatters';
import { api } from '../lib/supabase';

// Doctor Dashboard Imports
import { DoctorLogin } from '../features/dashboard/pages/DoctorLogin';
import { QueueDashboard } from '../features/dashboard/pages/QueueDashboard';
import { ReceptionDashboard } from '../features/dashboard/pages/ReceptionDashboard';
import { EncounterReview } from '../features/dashboard/pages/EncounterReview';
import { AnalyticsDashboard } from '../features/dashboard/pages/AnalyticsDashboard';

// Wrapper to pass the correct language from session store to InterviewShell
function InterviewWrapper() {
  const { language, mode } = useSessionStore();
  const setCompletedInterview = useInterviewStore((s) => s.setCompletedInterview);
  const navigate = useNavigate();
  
  const handleComplete = async (state: EngineState) => {
    console.log('[SwasthyaLipi] Interview complete!', state);
    setCompletedInterview(state);
    
    // We now route to /scan for document upload before submitting
    navigate('/scan');
  };

  return <InterviewShell initialLanguage={language} mode={mode || 'modern'} onComplete={handleComplete} />;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/onboarding/language" replace />,
  },
  {
    path: '/onboarding/language',
    element: <LanguageSelect />,
  },
  {
    path: '/onboarding/identify',
    element: <PatientIdentify />,
  },
  {
    path: '/onboarding/consent',
    element: <ConsentScreen />,
  },
  {
    path: '/onboarding/mode',
    element: <ModeSelect />,
  },
  {
    path: '/interview',
    element: <InterviewWrapper />,
  },
  {
    path: '/scan',
    element: <DocumentScan />,
  },
  {
    path: '/summary',
    element: <SummaryView />,
  },
  // ─── DOCTOR DASHBOARD ROUTES ───
  {
    path: '/doctor',
    element: <Navigate to="/doctor/login" replace />,
  },
  {
    path: '/doctor/login',
    element: <DoctorLogin />,
  },
  {
    path: '/doctor/queue',
    element: <QueueDashboard />,
  },
  {
    path: '/doctor/reception',
    element: <ReceptionDashboard />,
  },
  {
    path: '/doctor/analytics',
    element: <AnalyticsDashboard />,
  },
  {
    path: '/doctor/encounter/:id',
    element: <EncounterReview />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
