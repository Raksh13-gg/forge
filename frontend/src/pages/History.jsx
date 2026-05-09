import { useEffect, useState, useMemo } from 'react';
import { useSearch } from '../contexts/SearchContext';
import { supabase } from '../lib/supabase';
import { 
  Search, ChevronDown, CalendarDays, CheckCircle2, XCircle,
  Users, TrendingUp, Zap, Activity, Sparkles, Award, LayoutGrid, List
} from 'lucide-react';

export default function History() {
  const { globalSearchQuery, setGlobalSearchQuery } = useSearch();
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]); // all records for matrix view
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' | 'individual'
  const [stats, setStats] = useState({ pct: 0, present: 0, total: 0, currentStreak: 0, longestStreak: 0 });

  // 1. Fetch all students and sessions upfront
  useEffect(() => {
    async function loadAll() {
      setLoadingData(true);
      
      // Fetch students and sessions (usually small enough for 1000 limit)
      const [stuRes, sessRes] = await Promise.all([
        supabase.from('students').select('id, name, usn, branch_code, batch').order('name'),
        supabase.from('sessions').select('id, date, topic, session_type, duration_hours').order('date', { ascending: true })
      ]);
      
      const studentsData = stuRes.data || [];
      const sessionsData = sessRes.data || [];
      setStudents(studentsData);
      setSessions(sessionsData);

      // Fetch ALL attendance records using pagination (to bypass 1000 limit)
      let allAtt = [];
      let page = 0;
      const PAGE_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('attendance')
          .select('student_id, session_id, present')
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        
        if (error || !data || data.length === 0) {
          hasMore = false;
        } else {
          allAtt = [...allAtt, ...data];
          if (data.length < PAGE_SIZE) hasMore = false;
          page++;
        }
      }
      
      setAllAttendance(allAtt);
      setLoadingData(false);
    }
    loadAll();
  }, []);

  // 2. When student selected, compute their individual stats
  useEffect(() => {
    if (!selectedStudent || sessions.length === 0) return;
    const att = allAttendance.filter(a => a.student_id === selectedStudent.id);
    setAttendanceRecords(att);
    const total = sessions.length;
    const presentCount = att.filter(a => a.present).length;
    const pct = total === 0 ? 0 : (presentCount / total) * 100;
    let currStreak = 0, maxStreak = 0;
    sessions.forEach(sess => {
      const rec = att.find(a => a.session_id === sess.id);
      if (rec?.present) { currStreak++; maxStreak = Math.max(maxStreak, currStreak); }
      else currStreak = 0;
    });
    setStats({ pct: pct.toFixed(1), present: presentCount, total, currentStreak: currStreak, longestStreak: maxStreak });
  }, [selectedStudent, allAttendance, sessions]);

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

  // Build lookup: student_id + session_id -> present
  const attLookup = useMemo(() => {
    const map = {};
    allAttendance.forEach(a => { map[`${a.student_id}_${a.session_id}`] = a.present; });
    return map;
  }, [allAttendance]);

  // Per-student stats for matrix
  const studentStats = useMemo(() => {
    const map = {};
    students.forEach(s => {
      const att = allAttendance.filter(a => a.student_id === s.id);
      const present = att.filter(a => a.present).length;
      const pct = sessions.length > 0 ? Math.round((present / sessions.length) * 100) : 0;
      map[s.id] = { present, pct };
    });
    return map;
  }, [students, allAttendance, sessions]);

  // Matrix search filter
  const [matrixSearch, setMatrixSearch] = useState('');
  const matrixStudents = useMemo(() =>
    students.filter(s =>
      s.name.toLowerCase().includes(matrixSearch.toLowerCase()) ||
      s.usn.toLowerCase().includes(matrixSearch.toLowerCase())
    ), [students, matrixSearch]
  );

  return (
    <div className="pb-32 max-w-full mx-auto px-6 animate-in fade-in duration-700">

      {/* ── Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="relative">
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-accent-glow blur-[100px] opacity-10 pointer-events-none" />
          <h1 className="text-display-md text-primary font-black tracking-tighter leading-none mb-3">Student Analytics</h1>
          <p className="text-body-lg text-secondary font-medium tracking-tight">
            {sessions.length} sessions · {students.length} students · {allAttendance.length} records
          </p>
        </div>

        {/* View toggle */}
        <div className="flex bg-surface-raised border border-subtle rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'matrix' ? 'bg-accent-glow text-white shadow-sm' : 'text-tertiary hover:text-secondary'}`}
          >
            <LayoutGrid size={14} /> All Students
          </button>
          <button
            onClick={() => setViewMode('individual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'individual' ? 'bg-accent-glow text-white shadow-sm' : 'text-tertiary hover:text-secondary'}`}
          >
            <Users size={14} /> Individual
          </button>
        </div>
      </div>

      {loadingData ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-surface/50 rounded-xl border border-subtle" />
          <div className="h-96 bg-surface/50 rounded-2xl border border-subtle" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="card h-[400px] flex flex-col items-center justify-center p-16 text-center border-dashed">
          <CalendarDays size={48} className="text-tertiary/30 mb-6" />
          <h3 className="text-display-xs text-secondary mb-3 font-black">No Sessions Yet</h3>
          <p className="text-body text-tertiary max-w-sm">Import attendance data using AI Bulk Import to see analytics here.</p>
        </div>
      ) : viewMode === 'matrix' ? (

        /* ──────── MATRIX VIEW ──────── */
        <div className="card p-0 overflow-hidden shadow-raised">
          {/* Search */}
          <div className="p-5 border-b border-subtle bg-surface-raised/20 flex items-center gap-4">
            <div className="relative group flex-1 max-w-sm">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-accent-glow transition-colors" />
              <input
                type="text"
                placeholder="Search students..."
                value={matrixSearch}
                onChange={e => setMatrixSearch(e.target.value)}
                className="w-full input pl-10 h-9 text-sm"
              />
            </div>
            <span className="text-xs text-tertiary font-bold uppercase tracking-widest">
              {matrixStudents.length} students · {sessions.length} sessions
            </span>
          </div>

          <div className="overflow-auto max-h-[70vh]">
            <table className="text-left border-collapse" style={{ minWidth: `${220 + sessions.length * 56}px` }}>
              <thead className="sticky top-0 z-20">
                <tr className="bg-surface-raised border-b border-subtle">
                  {/* Sticky student column header */}
                  <th className="sticky left-0 z-30 bg-surface-raised px-5 py-3 text-[10px] font-black text-tertiary uppercase tracking-widest w-52 min-w-[208px] border-r border-subtle">
                    Student
                  </th>
                  <th className="px-3 py-3 text-[10px] font-black text-tertiary uppercase tracking-widest text-center w-14 bg-surface-raised">
                    %
                  </th>
                  {sessions.map(sess => {
                    const d = new Date(sess.date);
                    const mon = d.toLocaleDateString('en-IN', { month: 'short' });
                    const day = d.getDate();
                    return (
                      <th key={sess.id} className="px-1 py-3 text-center w-14 bg-surface-raised">
                        <div className="text-[9px] font-black text-tertiary uppercase">{mon}</div>
                        <div className="text-xs font-black text-primary">{day}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle/40">
                {matrixStudents.map(student => {
                  const st = studentStats[student.id] || { present: 0, pct: 0 };
                  return (
                    <tr key={student.id} className="hover:bg-surface-raised/30 transition-colors group">
                      {/* Sticky student name */}
                      <td className="sticky left-0 z-10 bg-surface px-5 py-2.5 border-r border-subtle group-hover:bg-surface-raised/30 transition-colors">
                        <div className="text-sm font-bold text-primary truncate max-w-[180px]">{student.name}</div>
                        <div className="text-[10px] text-tertiary font-black tracking-widest uppercase opacity-60">{student.usn}</div>
                      </td>
                      {/* Attendance % */}
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-xs font-black tabular-nums ${getPercentageColor(st.pct)}`}>{st.pct}%</span>
                      </td>
                      {/* Per-session attendance dots */}
                      {sessions.map(sess => {
                        const key = `${student.id}_${sess.id}`;
                        const hasRecord = key in attLookup;
                        const isPresent = attLookup[key];
                        return (
                          <td key={sess.id} className="px-1 py-2.5 text-center">
                            {hasRecord ? (
                              isPresent
                                ? <div className="w-5 h-5 rounded-full bg-success-fg mx-auto shadow-[0_0_6px_rgba(16,185,129,0.4)]" title="Present" />
                                : <div className="w-5 h-5 rounded-full bg-danger-fg/70 mx-auto" title="Absent" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-surface-raised/50 border border-subtle mx-auto" title="No record" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="px-5 py-3 border-t border-subtle bg-surface-raised/10 flex items-center gap-6 text-[10px] font-bold text-tertiary uppercase tracking-widest">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-success-fg shadow-[0_0_6px_rgba(16,185,129,0.4)]" /> Present</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-danger-fg/70" /> Absent</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-surface-raised/50 border border-subtle" /> No Record</div>
          </div>
        </div>

      ) : (

        /* ──────── INDIVIDUAL VIEW ──────── */
        <div>
          {/* Student selector */}
          <div className="relative w-full max-w-sm z-50 mb-8">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between gap-4 bg-surface-raised/40 backdrop-blur-xl border border-subtle p-4 rounded-2xl shadow-xl hover:border-accent-glow/50 transition-all"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-surface-raised border border-subtle flex items-center justify-center shrink-0 text-accent-glow">
                  <Users size={18} />
                </div>
                <div className="text-left truncate">
                  <p className="text-micro text-tertiary uppercase font-bold tracking-widest opacity-60">Selected Student</p>
                  <p className={`text-sm font-bold tracking-tight truncate ${selectedStudent ? 'text-primary' : 'text-tertiary'}`}>
                    {selectedStudent ? selectedStudent.name : 'Select a student...'}
                  </p>
                </div>
              </div>
              <ChevronDown size={16} className={`text-tertiary transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-surface-raised border border-default rounded-[1.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300 z-50">
                <div className="p-4 border-b border-subtle bg-surface-inset/30">
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary" />
                    <input
                      type="text" autoFocus
                      placeholder="Search by name or USN..."
                      className="w-full bg-void/50 border border-subtle rounded-xl py-2.5 pl-10 pr-4 text-[13.5px] text-primary focus:outline-none focus:border-accent-glow/50 transition-all"
                      value={globalSearchQuery}
                      onChange={e => setGlobalSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                  {filteredStudents.map(s => (
                    <div key={s.id}
                      className="p-3.5 hover:bg-surface-raised/80 rounded-xl cursor-pointer flex justify-between items-center transition-all group active:scale-[0.98]"
                      onClick={() => { setSelectedStudent(s); setDropdownOpen(false); setGlobalSearchQuery(''); }}
                    >
                      <div className="min-w-0">
                        <div className="text-[14px] font-bold text-primary group-hover:text-accent-glow transition-colors truncate">{s.name}</div>
                        <div className="text-[10px] text-tertiary font-black tracking-[0.1em] uppercase mt-0.5">{s.usn}</div>
                      </div>
                      <span className="text-[10px] font-black text-tertiary px-2 py-1 bg-surface-inset rounded border border-subtle shrink-0">{s.branch_code}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!selectedStudent ? (
            <div className="card h-[400px] flex flex-col items-center justify-center p-16 text-center border-dashed">
              <Users size={48} className="text-tertiary/30 mb-6" />
              <h3 className="text-display-xs text-secondary mb-3 font-black">No Student Selected</h3>
              <p className="text-body text-tertiary max-w-sm">Select a student from the dropdown to see their individual attendance history.</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                {/* Profile Card */}
                <div className="lg:col-span-4 card flex flex-col justify-between p-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-700 pointer-events-none">
                    <Award size={160} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-micro text-tertiary font-black tracking-[0.2em] uppercase mb-8">
                      <Sparkles size={14} className="text-accent-glow" /> STUDENT DOSSIER
                    </div>
                    <h2 className="text-4xl font-black text-primary tracking-tighter leading-tight mb-2">{selectedStudent.name}</h2>
                    <p className="text-sm text-tertiary font-black tracking-widest uppercase opacity-60 mb-8">{selectedStudent.usn}</p>
                    <div className="flex flex-wrap gap-2.5">
                      <span className="pill bg-surface-raised text-primary border border-subtle px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm">{selectedStudent.branch_code}</span>
                    </div>
                  </div>
                  <div className="mt-12 pt-10 border-t border-subtle/50 relative z-10">
                    <div className="text-micro text-tertiary mb-3 uppercase font-black tracking-widest">LIFETIME RETENTION</div>
                    <div className={`text-6xl font-black tabular-nums tracking-tighter ${getPercentageColor(stats.pct)}`}>
                      {stats.pct}<span className="text-2xl opacity-40 ml-1">%</span>
                    </div>
                    <p className="text-xs text-secondary mt-3 font-medium flex items-center gap-2">
                      <TrendingUp size={14} className="text-accent-glow" />
                      Attended {stats.present} of {stats.total} sessions
                    </p>
                  </div>
                </div>

                {/* Pattern Heatmap */}
                <div className="lg:col-span-8 card p-10 flex flex-col justify-between relative overflow-hidden">
                  <div>
                    <div className="flex items-center justify-between mb-10">
                      <div className="text-micro text-tertiary font-black tracking-[0.2em] uppercase flex items-center gap-2.5">
                        <CalendarDays size={14} className="text-accent-glow" /> PATTERN ANALYTICS
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-black text-tertiary tracking-widest">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-success-fg shadow-[0_0_8px_var(--success-fg)]" /> PRESENT</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-danger-fg" /> ABSENT</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {sessions.map(sess => {
                        const rec = attendanceRecords.find(a => a.session_id === sess.id);
                        let statusColor = 'bg-surface-inset/50';
                        let glow = '';
                        if (rec) {
                          if (rec.present) { statusColor = 'bg-success-fg'; glow = 'shadow-[0_0_12px_rgba(16,185,129,0.3)]'; }
                          else statusColor = 'bg-danger-fg';
                        }
                        return (
                          <div key={sess.id} title={`${sess.date}: ${sess.topic}`}
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

              {/* Session Ledger */}
              <div className="card p-0 overflow-hidden shadow-raised">
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
                        <th className="px-8 py-4 text-micro text-tertiary uppercase font-black tracking-widest border-b border-subtle">Topic</th>
                        <th className="px-8 py-4 text-micro text-tertiary uppercase font-black tracking-widest border-b border-subtle text-center">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle/50">
                      {[...sessions].reverse().map(sess => {
                        const rec = attendanceRecords.find(a => a.session_id === sess.id);
                        return (
                          <tr key={sess.id} className="hover:bg-surface-raised/20 transition-colors">
                            <td className="px-8 py-5 text-sm font-bold text-tertiary font-mono">{sess.date}</td>
                            <td className="px-8 py-5 text-[14.5px] font-bold text-primary">{sess.topic}</td>
                            <td className="px-8 py-5 text-center">
                              {rec ? (
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black tracking-widest uppercase ${rec.present ? 'bg-success-bg/20 text-success-fg border-success-border/50' : 'bg-danger-bg/20 text-danger-fg border-danger-border/50'}`}>
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
      )}
    </div>
  );
}
