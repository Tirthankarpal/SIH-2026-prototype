import { useState, useEffect, useRef } from 'react';
import { DoctorShell } from '../components/DoctorShell';
import { useDoctorStore } from '../../../store/doctorStore';
import { useRealtimeQueue } from '../../../hooks/useRealtimeQueue';
import { formatDistanceToNow } from 'date-fns';

export function ReceptionDashboard() {
  const { encounters, isLoading, updateStatus } = useDoctorStore();

  // Subscribe to real-time updates
  useRealtimeQueue();

  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  // Filter only patients who have completed intake but haven't checked in
  const intakeEncounters = encounters.filter(e => e.status === 'intake_completed');

  const handleMarkArrived = async (id: string) => {
    setCheckingIn(id);
    await updateStatus(id, 'waiting');
    setCheckingIn(null);
  };

  return (
    <DoctorShell title="Reception Desk" activeTab="reception" showBack={false}>
      {/* Stats Bar */}
      <div className="queue-stats">
        <div className="queue-stat">
          <div className="queue-stat__value">{intakeEncounters.length}</div>
          <div className="queue-stat__label">Pending Arrivals</div>
        </div>
        <div className="queue-stat">
          <div className="queue-stat__value">{encounters.filter(e => e.status !== 'intake_completed').length}</div>
          <div className="queue-stat__label">Checked In Today</div>
        </div>
      </div>

      {isLoading ? (
        <p style={{ textAlign: 'center', color: 'var(--sl-text-muted)' }}>Loading incoming intakes...</p>
      ) : intakeEncounters.length === 0 ? (
        <div className="queue-empty">
          <div className="queue-empty__icon">🏥</div>
          <h2>No pending arrivals</h2>
          <p>All patients who completed their remote intake have been checked in.</p>
        </div>
      ) : (
        <div className="queue-grid">
          {intakeEncounters.map(enc => (
            <div 
              key={enc.id} 
              className={`queue-card ${enc.red_flag_count > 0 ? 'queue-card--alert' : ''}`}
            >
              <div className="queue-card__header">
                <div>
                  <div className="queue-card__id">{enc.patient_id}</div>
                  <div className="queue-card__time">
                    Intake {formatDistanceToNow(new Date(enc.created_at), { addSuffix: true })}
                  </div>
                </div>
                {enc.red_flag_count > 0 && (
                  <span title={`${enc.red_flag_count} alerts detected`} style={{ fontSize: '1.25rem' }}>🚨</span>
                )}
              </div>
              
              <div className="queue-card__cc">
                <strong>CC:</strong> {enc.generated_summary?.chiefComplaint || 'No chief complaint'}
              </div>

              <div className="queue-card__footer" style={{ marginTop: 'var(--sl-space-4)' }}>
                <button 
                  className="btn-primary" 
                  style={{ width: '100%', padding: 'var(--sl-space-2)' }}
                  onClick={(e) => { e.stopPropagation(); handleMarkArrived(enc.id); }}
                  disabled={checkingIn === enc.id}
                >
                  {checkingIn === enc.id ? 'Checking in...' : 'Mark as Arrived'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DoctorShell>
  );
}
