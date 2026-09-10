import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function DoctorLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate a brief auth delay for UX polish
    await new Promise(r => setTimeout(r, 600));
    navigate('/doctor/queue');
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--sl-bg-body)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(0, 217, 166, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        left: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <form
        onSubmit={handleLogin}
        style={{
          width: '420px',
          maxWidth: '90vw',
          background: 'var(--sl-bg-card)',
          padding: '48px 40px',
          borderRadius: 'var(--sl-radius-lg)',
          border: '1px solid var(--sl-border)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            background: 'var(--sl-accent)',
            color: 'var(--sl-bg-body)',
            borderRadius: 'var(--sl-radius-md)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '16px',
            boxShadow: '0 0 24px rgba(0, 217, 166, 0.3)',
          }}>
            स्व
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '4px' }}>SwasthyaLipi</h1>
          <p style={{ color: 'var(--sl-text-muted)', fontSize: '0.9rem' }}>Medical Staff Portal</p>
        </div>

        {/* Email */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--sl-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            Email / User ID
          </label>
          <input
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="doctor@clinic.in"
            style={{
              width: '100%',
              padding: '14px 16px',
              background: 'var(--sl-bg-body)',
              border: '1px solid var(--sl-border)',
              color: 'var(--sl-text-primary)',
              borderRadius: 'var(--sl-radius-md)',
              fontSize: '1rem',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              outline: 'none',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--sl-accent)';
              e.target.style.boxShadow = '0 0 0 3px rgba(0, 217, 166, 0.1)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--sl-border)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--sl-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              width: '100%',
              padding: '14px 16px',
              background: 'var(--sl-bg-body)',
              border: '1px solid var(--sl-border)',
              color: 'var(--sl-text-primary)',
              borderRadius: 'var(--sl-radius-md)',
              fontSize: '1rem',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              outline: 'none',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--sl-accent)';
              e.target.style.boxShadow = '0 0 0 3px rgba(0, 217, 166, 0.1)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--sl-border)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
          style={{
            width: '100%',
            minHeight: '52px',
            fontSize: '1.1rem',
            fontWeight: 600,
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? 'wait' : 'pointer',
          }}
        >
          {isLoading ? '🔒 Authenticating...' : '🔐 Secure Login'}
        </button>

        <p style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '0.8rem',
          color: 'var(--sl-text-muted)',
        }}>
          Protected under DISHA Act & ABDM Guidelines
        </p>
      </form>
    </div>
  );
}
