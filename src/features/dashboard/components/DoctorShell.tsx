import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import './DoctorDashboard.css';

interface DoctorShellProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  activeTab?: 'queue' | 'analytics' | 'reception';
}

export function DoctorShell({ children, title = 'Doctor Dashboard', showBack = false, activeTab = 'queue' }: DoctorShellProps) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="doctor-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`doctor-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="doctor-sidebar__brand">
          <div className="doctor-sidebar__logo">स्व</div>
          <div>
            <div className="doctor-sidebar__title">SwasthyaLipi</div>
            <div className="doctor-sidebar__subtitle">OPD Portal</div>
          </div>
        </div>

        <nav className="doctor-nav">
          <button 
            className={`doctor-nav__item ${activeTab === 'queue' ? 'doctor-nav__item--active' : ''}`}
            onClick={() => { navigate('/doctor/queue'); setSidebarOpen(false); }}
          >
            📊 Waiting Queue
          </button>
          <button 
            className={`doctor-nav__item ${activeTab === 'analytics' ? 'doctor-nav__item--active' : ''}`}
            onClick={() => { navigate('/doctor/analytics'); setSidebarOpen(false); }}
          >
            📈 Analytics & Reports
          </button>
          <button 
            className={`doctor-nav__item ${activeTab === 'reception' ? 'doctor-nav__item--active' : ''}`}
            onClick={() => { navigate('/doctor/reception'); setSidebarOpen(false); }}
          >
            🏥 Reception Desk
          </button>
          <div style={{ flex: 1 }} />
          <button 
            className="doctor-nav__item" 
            onClick={() => { navigate('/doctor/login'); setSidebarOpen(false); }}
          >
            🚪 Logout
          </button>
        </nav>
      </aside>

      <main className="doctor-main">
        <header className="doctor-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sl-space-4)' }}>
            <button 
              className="doctor-hamburger"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            {showBack && (
              <button className="doctor-back-btn" onClick={() => navigate('/doctor/queue')}>
                ← Back
              </button>
            )}
            <h1 className="doctor-page-title">{title}</h1>
          </div>
        </header>

        <div className="doctor-content">
          {children}
        </div>
      </main>
    </div>
  );
}
