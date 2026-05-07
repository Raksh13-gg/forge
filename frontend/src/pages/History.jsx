import { useEffect, useState, useMemo } from 'react';
import { useSearch } from '../contexts/SearchContext';
import { supabase } from '../lib/supabase';
import { FALLBACK_STUDENTS } from '../lib/fallbackData';
import { 
  Search, 
  ChevronDown, 
  CalendarDays, 
  CheckCircle2, 
  XCircle, 
  Users, 
  TrendingUp, 
  Zap, 
  Activity, 
  ChevronRight,
  Sparkles,
  Award
} from 'lucide-react';

export default function History() {
  const { globalSearchQuery, setGlobalSearchQuery } = useSearch();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Stats
  const [stats, setStats] = useState({ pct: 0, present: 0, total: 0, currentStreak: 0, longestStreak: 0 });

  // 1. Fetch all students for the dropdown
  useEffect(() => {
    async function loadStudents() {
      const { data, error } = await supabase.from('students').select('*').order('name');
      if (error) {
        console.error('History fetch failed:', error);
      }
      setStudents(data || []);
    }
    loadStudents();
  }, []);

  // 2. Fetch data when a student is selected
  useEffect(() => {
    if (!selectedStudent) return;
    
    async function loadStudentData() {
      setLoadingData(true);
      
      try {
        const [sessionsRes, attendanceRes] = await Promise.all([
          supabase.from('sessions').select('*').order('date', { ascending: true }),
          supabase.from('attendance').select('*').eq('student_id', selectedStudent.id)
        ]);

        const allSessions = sessionsRes.data || [];
        const att = attendanceRes.data || [];
        
        setSessions(allSessions);
        setAttendanceRecords(att);
        
        // Calculate Stats
        const total = allSessions.length;
        const presentCount = att.filter(a => a.present).length;
        const pct = total === 0 ? 0 : (presentCount / total) * 100;
        
        let currStreak = 0;
        let maxStreak = 0;
        
        allSessions.forEach(sess => {
          const record = att.find(a => a.session_id === sess.id);
          if (record && record.present) {
            currStreak++;
            maxStreak = Math.max(maxStreak, currStreak);
          } else {
            currStreak = 0;
          }
        });
        
        setStats({
          pct: pct.toFixed(1),
          present: presentCount,
          total,
          currentStreak: currStreak,
          longestStreak: maxStreak
        });
      } catch (err) {
        console.error('Error loading history:', err);
      } finally {
        setLoadingData(false);
      }
    }
    
    loadStudentData();
  }, [selectedStudent]);

  const scrollToSession = (sessionId) => {
    const element = document.getElementById(`session-${sessionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-accent-glow/20');
      setTimeout(() => element.classList.remove('bg-accent-glow/20'), 2000);
    }
  };

  const filteredStudents = useMemo(() => 
    students.filter(s => 
      s.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
      s.usn.toLowerCase().includes(globalSearchQuery.toLowerCase())
    ), [students, globalSearchQuery]
  );

  const getPercentageColor = (pct) => {
    if (pct >= 85) return 'text-success-fg';
    if (pct >= 75) return 'text-accent-glow';
    if (pct >= 60) return 'text-warning-fg';
    return 'text-danger-fg';
  };

  return (
    <div className="pb-32 max-w-7xl mx-auto px-6 animate-in fade-in duration-700">
      
      {/* ── Header Section */}
      <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="relative">
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-accent-glow blur-[100px] opacity-10 pointer-events-none" />
          <h1 className="text-display-md text-primary font-black tracking-tighter leading-none mb-4">Student Analytics</h1>
          <p className="text-body-lg text-secondary font-medium tracking-tight">Visualize deep historical records and attendance patterns.</p>
        </div>

        {/* Premium Student Selector */}
        <div className="relative w-full max-w-sm z-50">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between gap-4 bg-surface-raised/40 backdrop-blur-xl border border-subtle p-4 rounded-2xl shadow-xl hover:border-accent-glow/50 transition-all group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-surface-raised border border-subtle flex items-center justify-center shrink-0 text-accent-glow">
                <Users size={18} />
              </div>
              <div className="text-left truncate">
                <p className="text-micro text-tertiary uppercase font-bold tracking-widest opacity-60">Selected Target</p>
                <p className={`text-sm font-bold tracking-tight truncate ${selectedStudent ? 'text-primary' : 'text-tertiary'}`}>
                  {selectedStudent ? selectedStudent.name : "Select a student..."}
                </p>
              </div>
            </div>
            <ChevronDown size={16} className={`text-tertiary transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-surface-raised border border-default rounded-[1.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300 backdrop-blur-3xl z-50">
              <div className="p-4 border-b border-subtle bg-surface-inset/30">
                <div className="relative group">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-accent-glow" />
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Search by name or USN..."
                    className="w-full bg-void/50 border border-subtle rounded-xl py-2.5 pl-10 pr-4 text-[13.5px] text-primary focus:outline-none focus:border-accent-glow/50 transition-all"
                    value={globalSearchQuery}
                    onChange={e => setGlobalSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                {filteredStudents.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <Activity size={32} className="mx-auto text-tertiary/20 mb-3" />
                    <p className="text-sm text-tertiary font-medium italic">No matches found.</p>
                  </div>
                ) : (
                  filteredStudents.map(s => (
                    <div 
                      key={s.id} 
                      className="p-3.5 hover:bg-surface-raised/80 rounded-xl cursor-pointer flex justify-between items-center transition-all group active:scale-[0.98]"
                      onClick={() => {
                        setSelectedStudent(s);
                        setDropdownOpen(false);
                        setGlobalSearchQuery('');
                      }}
                    >
                      <div className="min-w-0">
                        <div className="text-[14px] font-bold text-primary group-hover:text-accent-glow transition-colors truncate">{s.name}</div>
                        <div className="text-[10px] text-tertiary font-black tracking-[0.1em] uppercase mt-0.5">{s.usn}</div>
                      </div>
                      <span className="text-[10px] font-black text-tertiary px-2 py-1 bg-surface-inset rounded border border-subtle shrink-0">
                        {s.branch_code}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {!selectedStudent ? (
        <div className="card h-[400px] flex flex-col items-center justify-center p-16 text-center border-dashed group relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-5" />
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-[2rem] bg-surface-raised border border-subtle flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-500">
              <Users size={36} className="text-tertiary opacity-40 group-hover:text-accent-glow group-hover:opacity-100 transition-all" />
            </div>
            <h3 className="text-display-xs text-secondary mb-3 font-black tracking-tight">No Target Selected</h3>
            <p className="text-body text-tertiary max-w-sm leading-relaxed">
              Use the student selector above to generate deep-link analytics and attendance patterns for a specific student.
            </p>
          </div>
        </div>
      ) : loadingData ? (
        <div className="space-y-8 animate-pulse">
          <div className="h-64 card" />
          <div className="h-96 card" />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            
            {/* ── Profile Summary Card */}
            <div className="lg:col-span-4 card flex flex-col justify-between p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-700 pointer-events-none">
                <Award size={160} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-micro text-tertiary font-black tracking-[0.2em] uppercase mb-8">
                  <Sparkles size={14} className="text-accent-glow" />
                  STUDENT DOSSIER
                </div>
                <h2 className="text-4xl font-black text-primary tracking-tighter leading-tight mb-2">{selectedStudent.name}</h2>
                <p className="text-sm text-tertiary font-black tracking-widest uppercase opacity-60 mb-8">{selectedStudent.usn}</p>
                
                <div className="flex flex-wrap gap-2.5">
                  <span className="pill bg-surface-raised text-primary border border-subtle px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm">{selectedStudent.branch_code}</span>
                  <span className="pill bg-surface-raised text-primary border border-subtle px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm">BATCH {selectedStudent.batch}</span>
                </div>
              </div>
              
              <div className="mt-12 pt-10 border-t border-subtle/50 relative z-10">
                <div className="text-micro text-tertiary mb-3 uppercase font-black tracking-widest">LIFETIME RETENTION</div>
                <div className="flex items-baseline gap-3">
                   <div className={`text-6xl font-black tabular-nums tracking-tighter ${getPercentageColor(stats.pct)}`}>
                    {stats.pct}<span className="text-2xl opacity-40 ml-1">%</span>
                  </div>
                </div>
                <p className="text-xs text-secondary mt-3 font-medium flex items-center gap-2">
                   <TrendingUp size={14} className="text-accent-glow" />
                   Attended {stats.present} of {stats.total} sessions
                </p>
              </div>
            </div>

            {/* ── Heatmap & Pattern Analysis */}
            <div className="lg:col-span-8 card p-10 flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-10">
                  <div className="text-micro text-tertiary font-black tracking-[0.2em] uppercase flex items-center gap-2.5">
                    <CalendarDays size={14} className="text-accent-glow" />
                    PATTERN ANALYTICS
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-black text-tertiary tracking-widest">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-success-fg shadow-[0_0_8px_var(--success-fg)]" /> PRESENT</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-danger-fg" /> ABSENT</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {sessions.map((sess, i) => {
                    const rec = attendanceRecords.find(a => a.session_id === sess.id);
                    let statusColor = 'bg-surface-inset/50';
                    let glow = '';
                    
                    if (rec) {
                      if (rec.present) {
                        statusColor = 'bg-success-fg';
                        glow = 'shadow-[0_0_12px_rgba(16,185,129,0.3)]';
                      } else {
                        statusColor = 'bg-danger-fg';
                        glow = '';
                      }
                    }

                    return (
                      <div 
                        key={sess.id}
                        title={`${sess.date}: ${sess.topic}`}
                        onClick={() => scrollToSession(sess.id)}
                        className={`w-10 h-10 rounded-xl border border-subtle ${statusColor} ${glow} cursor-pointer transition-all hover:scale-110 hover:-translate-y-1 relative group/box`}
                      >
                         <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-void border border-default p-2 rounded-lg text-[9px] font-black uppercase text-primary whitespace-nowrap opacity-0 group-hover/box:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                           {sess.date}
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex gap-10 mt-12 pt-10 border-t border-subtle/50">
                <div className="group">
                  <div className="text-display-sm text-primary font-black tabular-nums tracking-tighter group-hover:text-accent-glow transition-colors">{stats.currentStreak}</div>
                  <div className="text-micro text-tertiary mt-1 uppercase font-bold tracking-widest">Current Streak</div>
                </div>
                <div className="w-px bg-subtle/30" />
                <div className="group">
                  <div className="text-display-sm text-primary font-black tabular-nums tracking-tighter group-hover:text-accent-glow transition-colors">{stats.longestStreak}</div>
                  <div className="text-micro text-tertiary mt-1 uppercase font-bold tracking-widest">Record Streak</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Records Ledger */}
          <div className="card p-0 overflow-hidden shadow-raised border-accent-glow/5 relative">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-accent-glow to-transparent opacity-20" />
            
            <div className="px-8 py-6 border-b border-subtle bg-surface-raised/20 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <Activity size={18} className="text-accent-glow" />
                  <h3 className="text-lg font-bold text-primary tracking-tight">Session Ledger</h3>
               </div>
               <span className="text-micro text-tertiary font-black uppercase tracking-widest">{attendanceRecords.length} ENTRIES</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-raised/30">
                    <th className="px-8 py-4 text-micro text-tertiary uppercase font-black tracking-widest border-b border-subtle">Date</th>
                    <th className="px-8 py-4 text-micro text-tertiary uppercase font-black tracking-widest border-b border-subtle">Topic / Session Name</th>
                    <th className="px-8 py-4 text-micro text-tertiary uppercase font-black tracking-widest border-b border-subtle text-right">Duration</th>
                    <th className="px-8 py-4 text-micro text-tertiary uppercase font-black tracking-widest border-b border-subtle text-center">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle/50">
                  {[...sessions].reverse().map(sess => {
                    const rec = attendanceRecords.find(a => a.session_id === sess.id);
                    return (
                      <tr 
                        key={sess.id} 
                        id={`session-${sess.id}`}
                        className="hover:bg-surface-raised/20 transition-colors group"
                      >
                        <td className="px-8 py-5 text-sm font-bold text-tertiary font-mono tracking-tight group-hover:text-primary transition-colors">{sess.date}</td>
                        <td className="px-8 py-5">
                          <div className="text-[14.5px] font-bold text-primary tracking-tight">{sess.topic}</div>
                          <div className="text-[10px] text-tertiary uppercase font-black tracking-widest mt-1 opacity-60">{sess.session_type} session</div>
                        </td>
                        <td className="px-8 py-5 text-right font-bold text-secondary tabular-nums text-sm">{sess.duration_hours}H</td>
                        <td className="px-8 py-5 text-center">
                          {rec ? (
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black tracking-widest uppercase ${rec.present ? 'bg-success-bg/20 text-success-fg border-success-border/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-danger-bg/20 text-danger-fg border-danger-border/50'}`}>
                              {rec.present ? <><CheckCircle2 size={12} /> Present</> : <><XCircle size={12} /> Absent</>}
                            </div>
                          ) : (
                            <span className="text-[11px] text-tertiary font-medium italic opacity-40">Unrecorded</span>
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
