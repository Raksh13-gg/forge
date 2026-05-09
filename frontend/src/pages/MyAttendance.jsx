import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  CalendarDays, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Activity, 
  Sparkles,
  Award,
  Clock,
  Target
} from 'lucide-react';

export default function MyAttendance() {
  const { profile } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default to student_id 1 if missing for the demo
  const activeStudentId = profile?.student_id || 1;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [sessionsRes, attendanceRes] = await Promise.all([
          supabase.from('sessions').select('*').order('date', { ascending: true }),
          supabase.from('attendance').select('*').eq('student_id', activeStudentId)
        ]);

        let finalSessions = sessionsRes.data || [];
        let finalAttendance = attendanceRes.data || [];

        setSessions(finalSessions);
        setAttendance(finalAttendance);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeStudentId]);

  // Calculations
  const stats = useMemo(() => {
    const total = sessions.length;
    const presentCount = attendance.filter(a => a.present).length;
    const pct = total === 0 ? 0 : Math.round((presentCount / total) * 100);
    
    let currStreak = 0;
    let maxStreak = 0;
    sessions.forEach(sess => {
      const record = attendance.find(a => a.session_id === sess.id);
      if (record && record.present) {
        currStreak++;
        maxStreak = Math.max(maxStreak, currStreak);
      } else {
        currStreak = 0;
      }
    });

    return { pct, present: presentCount, total, currStreak, maxStreak };
  }, [sessions, attendance]);

  const scrollToSession = (sessionId) => {
    const element = document.getElementById(`session-${sessionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-accent-glow/20');
      setTimeout(() => element.classList.remove('bg-accent-glow/20'), 2000);
    }
  };

  return (
    <div className="pb-32 max-w-7xl mx-auto px-6 animate-in fade-in duration-700">
      
      {/* ── Header Section */}
      <div className="mb-14 relative">
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-accent-glow blur-[100px] opacity-10 pointer-events-none" />
        <h1 className="text-display-md text-primary font-black tracking-tighter leading-none mb-4">My Academic Pulse</h1>
        <p className="text-body-lg text-secondary font-medium tracking-tight">Real-time attendance analytics and session history.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-4 h-64 card animate-pulse" />
           <div className="lg:col-span-8 h-64 card animate-pulse" />
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* ── Stats Card */}
            <div className="lg:col-span-4 card p-10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-700 rotate-12 pointer-events-none">
                  <Award size={160} />
               </div>
               
               <div className="relative z-10">
                 <div className="flex items-center gap-2.5 mb-8 text-micro text-tertiary font-black tracking-[0.2em] uppercase">
                    <Sparkles size={14} className="text-accent-glow" />
                    PERFORMANCE INDEX
                 </div>
                 
                 <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-7xl font-black text-primary tabular-nums tracking-tighter">{stats.pct}</span>
                    <span className="text-2xl font-bold text-tertiary">%</span>
                 </div>
                 <p className="text-sm font-bold text-secondary uppercase tracking-widest mt-2">Total Retention</p>
                 
                 <div className="mt-12 space-y-6 pt-8 border-t border-subtle/50">
                    <div className="flex items-center justify-between">
                       <span className="text-sm text-tertiary font-medium">Present Sessions</span>
                       <span className="text-sm font-black text-success-fg tabular-nums">{stats.present} / {stats.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-sm text-tertiary font-medium">Longest Streak</span>
                       <span className="text-sm font-black text-accent-glow tabular-nums">{stats.maxStreak} Sessions</span>
                    </div>
                 </div>
               </div>
            </div>

            {/* ── Heatmap Card */}
            <div className="lg:col-span-8 card p-10 flex flex-col justify-between relative overflow-hidden">
               <div>
                 <div className="flex items-center justify-between mb-10">
                    <div className="text-micro text-tertiary font-black tracking-[0.2em] uppercase flex items-center gap-2.5">
                       <CalendarDays size={14} className="text-accent-glow" />
                       ATTENDANCE PATTERN
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-black text-tertiary tracking-widest">
                       <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-success-fg shadow-[0_0_8px_var(--success-fg)]" /> PRESENT</div>
                       <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-danger-fg" /> ABSENT</div>
                    </div>
                 </div>

                 <div className="flex flex-wrap gap-2.5">
                    {sessions.map(sess => {
                      const rec = attendance.find(a => a.session_id === sess.id);
                      const isPresent = rec?.present;
                      return (
                        <div 
                          key={sess.id}
                          title={`${sess.date}: ${sess.topic}`}
                          onClick={() => scrollToSession(sess.id)}
                          className={`w-10 h-10 rounded-xl border border-subtle transition-all hover:scale-110 cursor-pointer ${isPresent ? 'bg-success-fg shadow-[0_0_12px_rgba(16,185,129,0.3)]' : (rec ? 'bg-danger-fg' : 'bg-surface-inset/50')}`}
                        />
                      );
                    })}
                 </div>
               </div>

               <div className="mt-12 flex items-center gap-6 p-6 rounded-2xl bg-surface-inset/50 border border-subtle">
                  <div className="w-12 h-12 rounded-xl bg-accent-glow/10 flex items-center justify-center text-accent-glow shrink-0">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-tertiary uppercase tracking-widest">Growth Factor</p>
                    <p className="text-sm font-bold text-primary mt-0.5">Your attendance is {stats.pct >= 75 ? 'Excellent' : 'Needs Improvement'}. Keep it up!</p>
                  </div>
               </div>
            </div>
          </div>

          {/* ── Historical Ledger */}
          <div className="card p-0 overflow-hidden shadow-raised">
             <div className="px-8 py-6 border-b border-subtle bg-surface-raised/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Activity size={18} className="text-accent-glow" />
                   <h3 className="text-lg font-bold text-primary tracking-tight">Session Records</h3>
                </div>
                <span className="text-micro text-tertiary font-black uppercase tracking-widest">{attendance.length} SESSIONS LOGGED</span>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-raised/30">
                      <th className="px-8 py-4 text-micro text-tertiary uppercase font-black tracking-widest border-b border-subtle">Date</th>
                      <th className="px-8 py-4 text-micro text-tertiary uppercase font-black tracking-widest border-b border-subtle">Topic</th>
                      <th className="px-8 py-4 text-micro text-tertiary uppercase font-black tracking-widest border-b border-subtle text-right">Credits</th>
                      <th className="px-8 py-4 text-micro text-tertiary uppercase font-black tracking-widest border-b border-subtle text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle/50">
                    {[...sessions].reverse().map(sess => {
                      const rec = attendance.find(a => a.session_id === sess.id);
                      return (
                        <tr 
                          key={sess.id} 
                          id={`session-${sess.id}`}
                          className="hover:bg-surface-raised/20 transition-colors"
                        >
                          <td className="px-8 py-5 text-sm font-bold text-tertiary font-mono">{sess.date}</td>
                          <td className="px-8 py-5">
                            <div className="text-[14.5px] font-bold text-primary tracking-tight">{sess.topic}</div>
                            <div className="text-[10px] text-tertiary uppercase font-black tracking-widest mt-1 opacity-60">{sess.session_type}</div>
                          </td>
                          <td className="px-8 py-5 text-right font-bold text-secondary text-sm">{sess.duration_hours}H</td>
                          <td className="px-8 py-5 text-center">
                            {rec ? (
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black tracking-widest uppercase ${rec.present ? 'bg-success-bg/20 text-success-fg border-success-border/50' : 'bg-danger-bg/20 text-danger-fg border-danger-border/50'}`}>
                                {rec.present ? <><CheckCircle2 size={12} /> Present</> : <><XCircle size={12} /> Absent</>}
                              </div>
                            ) : (
                              <span className="text-[11px] text-tertiary font-medium italic opacity-40">No record</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
