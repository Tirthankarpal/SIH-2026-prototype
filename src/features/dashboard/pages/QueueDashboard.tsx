import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoctorShell } from '../components/DoctorShell';
import { useDoctorStore } from '../../../store/doctorStore';
import { useRealtimeQueue } from '../../../hooks/useRealtimeQueue';
import { formatDistanceToNow } from 'date-fns';

export function QueueDashboard() {
  const navigate = useNavigate();
  const { encounters, isLoading } = useDoctorStore();

  // Subscribe to real-time updates (Supabase Realtime or cross-tab localStorage)
  useRealtimeQueue();

  // Toast notification for new arrivals
  const [toast, setToast] = useState<string | null>(null);
  const prevCountRef = useRef(encounters.length);

  const playNotificationSound = useCallback(() => {
    try {
      // Use Web Audio API to generate a pleasant chime
      const ctx = new AudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.frequency.value = 523.25; // C5
      osc2.frequency.value = 659.25; // E5
      osc1.type = 'sine';
      osc2.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime + 0.15);
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.95);
    } catch {
      // Audio not available — silently ignore
    }
  }, []);

  useEffect(() => {
    if (encounters.length > prevCountRef.current && prevCountRef.current > 0) {
      const newest = encounters[0];
      setToast(newest?.patient_id || 'New patient');
      playNotificationSound();
      
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = encounters.length;
  }, [encounters.length, encounters, playNotificationSound]);

  // Filter active queue to only those physically waiting or in consultation
  const activeEncounters = encounters.filter(e => e.status === 'waiting' || e.status === 'in_consultation');

  // Dynamic Acuity-Based Triage: Red flags bypass the line. Otherwise, FIFO (oldest first).
  const sortedEncounters = [...activeEncounters].sort((a, b) => {
    if (b.red_flag_count !== a.red_flag_count) {
      return b.red_flag_count - a.red_flag_count; // Highest red flags first
    }
    // Fall back to true FIFO
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); 
  });

  // Stats
  const waitingCount = activeEncounters.filter(e => e.status === 'waiting').length;
  const consultCount = activeEncounters.filter(e => e.status === 'in_consultation').length;
  const alertCount = activeEncounters.filter(e => e.red_flag_count > 0).length;

  return (
    <DoctorShell title="OPD Waiting Queue">
      {/* Stats Bar */}
      <div className="queue-stats">
        <div className="queue-stat">
          <div className="queue-stat__value">{waitingCount}</div>
          <div className="queue-stat__label">Waiting</div>
        </div>
        <div className="queue-stat">
          <div className="queue-stat__value">{consultCount}</div>
          <div className="queue-stat__label">In Consultation</div>
        </div>
        <div className={`queue-stat ${alertCount > 0 ? 'queue-stat--alert' : ''}`}>
          <div className="queue-stat__value">{alertCount}</div>
          <div className="queue-stat__label">With Alerts</div>
        </div>
        <div className="queue-stat">
          <div className="queue-stat__value">{activeEncounters.length}</div>
          <div className="queue-stat__label">Total Today</div>
        </div>
      </div>

      {isLoading ? (
        <p style={{ textAlign: 'center', color: 'var(--sl-text-muted)' }}>Loading queue...</p>
      ) : sortedEncounters.length === 0 ? (
        <div className="queue-empty">
          <div className="queue-empty__icon">☕</div>
          <h2>Queue is empty</h2>
          <p>No patients are currently waiting. New arrivals will appear here automatically.</p>
        </div>
      ) : (
        <div className="queue-grid">
          {sortedEncounters.map(enc => (
            <div 
              key={enc.id} 
              className={`queue-card ${enc.red_flag_count > 0 ? 'queue-card--alert' : ''}`}
              onClick={() => navigate(`/doctor/encounter/${enc.id}`)}
            >
              <div className="queue-card__header">
                <div>
                  <div className="queue-card__id">{enc.patient_id}</div>
                  <div className="queue-card__time">
                    Arrived {formatDistanceToNow(new Date(enc.created_at), { addSuffix: true })}
                  </div>
                </div>
                {enc.red_flag_count > 0 && (
                  <span title={`${enc.red_flag_count} alerts detected`} style={{ fontSize: '1.25rem' }}>🚨</span>
                )}
              </div>
              
              <div className="queue-card__cc">
                <strong>CC:</strong> {enc.generated_summary?.chiefComplaint || 'No chief complaint'}
              </div>

              <div className="queue-card__footer">
                <span className={`queue-badge queue-badge--${enc.status}`}>
                  {enc.status.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--sl-text-muted)' }}>
                  {enc.mode === 'ayush' ? '🌿 AYUSH' : '🩺 Modern'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification Toast */}
      {toast && (
        <div className="queue-toast" onClick={() => setToast(null)}>
          <span className="queue-toast__icon">🔔</span>
          <div>
            <div className="queue-toast__text">New patient arrived</div>
            <div className="queue-toast__sub">{toast} has joined the queue</div>
          </div>
        </div>
      )}
    </DoctorShell>
  );
}
