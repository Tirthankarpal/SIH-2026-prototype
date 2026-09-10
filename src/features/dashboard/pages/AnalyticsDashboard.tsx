import { useMemo, useEffect } from 'react';
import { DoctorShell } from '../components/DoctorShell';
import { useDoctorStore } from '../../../store/doctorStore';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';

export function AnalyticsDashboard() {
  const { encounters, fetchQueue } = useDoctorStore();

  useEffect(() => {
    fetchQueue();
    // In a real app we might set up an interval or just rely on the realtime subscription
  }, [fetchQueue]);

  // Aggregate Data
  const activeEncounters = encounters.filter(e => e.status !== 'intake_completed');

  const metrics = useMemo(() => {
    const totalPatients = activeEncounters.length;
    const completed = activeEncounters.filter(e => e.status === 'completed').length;
    
    // AYUSH vs Modern Split
    const modeCount = activeEncounters.reduce((acc, enc) => {
      acc[enc.mode] = (acc[enc.mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = [
      { name: 'Modern', value: modeCount['modern'] || 0, color: 'var(--sl-accent)' },
      { name: 'AYUSH', value: modeCount['ayush'] || 0, color: 'var(--sl-accent-secondary)' }
    ];

    // Top Chief Complaints
    const complaintCounts: Record<string, number> = {};
    activeEncounters.forEach(enc => {
      if (enc.generated_summary?.chiefComplaint) {
        // Handle the string output format (e.g., "Fever", "Headache")
        const cc = enc.generated_summary.chiefComplaint.split(',')[0].trim();
        if (cc && cc !== 'None recorded') {
          complaintCounts[cc] = (complaintCounts[cc] || 0) + 1;
        }
      } else if (enc.engine_state?.answers) {
        // Fallback to raw answer if summary isn't generated
        // Need to cast to Map if it was normalized, but engine_state might be raw JSON in this view
        let answers = enc.engine_state.answers as any;
        if (answers instanceof Map) {
          const mainCC = answers.get('cc_main');
          if (mainCC) complaintCounts[mainCC] = (complaintCounts[mainCC] || 0) + 1;
        } else if (answers && answers['cc_main']) {
          const mainCC = answers['cc_main'];
          complaintCounts[mainCC] = (complaintCounts[mainCC] || 0) + 1;
        }
      }
    });

    const barData = Object.entries(complaintCounts)
      .map(([name, count]) => ({ name: name.replace('cc_', '').replace(/_/g, ' ').toUpperCase(), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5

    // Hourly Flow
    const hourlyCounts: Record<string, number> = {};
    activeEncounters.forEach(enc => {
      try {
        const hour = format(parseISO(enc.created_at), 'HH:00');
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
      } catch (e) {
        // Invalid date
      }
    });

    const lineData = Object.entries(hourlyCounts)
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => a.time.localeCompare(b.time));

    return { totalPatients, completed, pieData, barData, lineData };
  }, [activeEncounters]);

  return (
    <DoctorShell activeTab="analytics" title="Analytics & Reports">
      <div className="analytics-container">
        
        {/* KPI Cards */}
        <div className="analytics-grid-kpi">
          <div className="analytics-card">
            <h3 className="analytics-card__title">Total Patients Today</h3>
            <div className="analytics-card__value" style={{ color: 'var(--sl-accent)' }}>{metrics.totalPatients}</div>
          </div>
          <div className="analytics-card">
            <h3 className="analytics-card__title">Completed</h3>
            <div className="analytics-card__value" style={{ color: 'var(--sl-success)' }}>{metrics.completed}</div>
          </div>
          <div className="analytics-card">
            <h3 className="analytics-card__title">Pending</h3>
            <div className="analytics-card__value" style={{ color: 'var(--sl-warning)' }}>{metrics.totalPatients - metrics.completed}</div>
          </div>
          <div className="analytics-card">
            <h3 className="analytics-card__title">High Risk</h3>
            <div className="analytics-card__value" style={{ color: 'var(--sl-emergency)' }}>
              {activeEncounters.filter(e => e.red_flag_count > 0).length}
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="analytics-grid-charts">
          
          {/* Top Chief Complaints */}
          <div className="analytics-card analytics-card--large">
            <h3 className="analytics-card__title" style={{ marginBottom: '24px' }}>Top Chief Complaints</h3>
            <div style={{ width: '100%', height: '300px' }}>
              {metrics.barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.barData} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--sl-text-muted)', fontSize: 12 }} width={120} />
                    <Tooltip 
                      cursor={{ fill: 'var(--sl-bg-secondary)' }}
                      contentStyle={{ background: 'var(--sl-bg-card)', border: '1px solid var(--sl-border)', borderRadius: '8px', color: 'var(--sl-text-primary)' }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                      {metrics.barData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(221, 83%, ${53 + index * 5}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  No data available yet
                </div>
              )}
            </div>
          </div>

          {/* Modality Split */}
          <div className="analytics-card">
            <h3 className="analytics-card__title" style={{ marginBottom: '12px' }}>Modern vs AYUSH</h3>
            <div style={{ width: '100%', height: '280px' }}>
              {metrics.totalPatients > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {metrics.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: 'var(--sl-bg-card)', border: '1px solid var(--sl-border)', borderRadius: '8px', color: 'var(--sl-text-primary)' }}
                      itemStyle={{ color: 'var(--sl-text-primary)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: 'var(--sl-text-secondary)' }}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  No patients today
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </DoctorShell>
  );
}
