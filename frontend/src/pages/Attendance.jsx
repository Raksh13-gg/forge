import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSearch } from '../contexts/SearchContext';
import { FALLBACK_STUDENTS } from '../lib/fallbackData';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Search,
  Save,
  Plus,
  Info,
  Users,
  Wifi,
  WifiOff,
  ChevronRight,
  Clock,
  Sparkles
} from 'lucide-react';
import CalendarComponent from '../components/Calendar';
import { getTodayLocal } from '../utils/dateUtils';

// ─── Skeleton ────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-44 bg-surface/50 rounded-2xl border border-subtle" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <div className="h-96 bg-surface/50 rounded-2xl border border-subtle" />
       <div className="lg:col-span-2 h-96 bg-surface/50 rounded-2xl border border-subtle" />
    </div>
  </div>
);

// ─── Confirmation Modal ───────────────────────────────────────────────────────
function ConfirmModal({ presentCount, absentCount, onConfirm, onCancel, isUpdate, sessionTopic }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
      style={{ background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(12px)' }}>
      <div className="bg-surface-raised border border-default rounded-3xl shadow-2xl p-10 max-w-[520px] w-full animate-in zoom-in-95 duration-300 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-accent-glow via-indigo-500 to-accent-glow" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent-glow/20 border border-accent-glow/30 flex items-center justify-center">
            <Sparkles size={24} className="text-accent-glow" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary tracking-tight">{isUpdate ? 'Update Records' : 'Finalize Attendance'}</h2>
            <p className="text-sm text-tertiary mt-0.5">Session: {sessionTopic}</p>
          </div>
        </div>

        <div className="flex gap-6 mb-10 p-6 rounded-2xl bg-surface-inset border border-subtle shadow-inner">
          <div className="flex-1 text-center">
            <div className="text-4xl font-black text-success-fg tabular-nums drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">{presentCount}</div>
            <div className="text-micro text-tertiary uppercase font-bold tracking-widest mt-2">Present</div>
          </div>
          <div className="w-px bg-subtle/50" />
          <div className="flex-1 text-center">
            <div className="text-4xl font-black text-danger-fg tabular-nums drop-shadow-[0_0_15px_rgba(239,68,68,0.2)]">{absentCount}</div>
            <div className="text-micro text-tertiary uppercase font-bold tracking-widest mt-2">Absent</div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary px-6">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-primary px-8 bg-white text-void font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            Confirm & Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDismiss }) {
  const isSuccess = type === 'success';
  return (
    <div className="fixed top-8 right-8 z-50 w-80 p-5 bg-surface-raised border border-default rounded-2xl shadow-2xl flex items-start gap-4 animate-in slide-in-from-right-8 duration-500 backdrop-blur-xl">
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${isSuccess ? 'bg-success-bg/30 border border-success-border/30' : 'bg-danger-bg/30 border border-danger-border/30'}`}>
        {isSuccess
          ? <CheckCircle2 size={20} className="text-success-fg" />
          : <XCircle size={20} className="text-danger-fg" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-primary tracking-tight">{isSuccess ? 'Action Successful' : 'Error Occurred'}</p>
        <p className="text-xs text-secondary mt-1 leading-relaxed">{message}</p>
      </div>
      <button onClick={onDismiss} className="text-tertiary hover:text-primary transition-colors">
        <X size={18} />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Attendance() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const today = getTodayLocal();
  const [date, setDate] = useState(today);
  const [session, setSession] = useState(null);
  const { globalSearchQuery, setGlobalSearchQuery } = useSearch();
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [initialAttendance, setInitialAttendance] = useState({});
  const [sessionDates, setSessionDates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  // New session form
  const [newTopic, setNewTopic] = useState('');
  const [newDuration, setNewDuration] = useState(2.0);
  const [newType, setNewType] = useState('offline');

  // ── Derived values
  const filteredStudents = useMemo(() => {
    if (!globalSearchQuery.trim()) return students;
    const q = globalSearchQuery.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.usn.toLowerCase().includes(q)
    );
  }, [students, globalSearchQuery]);

  const presentCount = useMemo(() =>
    Object.values(attendance).filter(Boolean).length, [attendance]);
  const absentCount = students.length - presentCount;
  const isAlreadyMarked = Object.keys(initialAttendance).length > 0;
  const isDirty = JSON.stringify(attendance) !== JSON.stringify(initialAttendance);
  const pct = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  // ── Load data on date change
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // 0. Fetch all session dates for the calendar
        const { data: allSessions } = await supabase.from('sessions').select('date');
        if (allSessions) setSessionDates(allSessions.map(s => s.date));

        // 1. Always load students first (instantly)
        console.log('Fetching students from Supabase...');
        const { data: studentsData, error: studentError } = await supabase
          .from('students')
          .select('id, name, usn, branch_code')
          .order('name');
        
        let finalStudents = studentsData || [];

        if (studentError) {
          console.error('Supabase students fetch failed:', studentError);
        }

        if (mounted) {
          console.log('Final students count:', finalStudents.length);
          setStudents(finalStudents);
        }

        // 2. Load session for this date
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('*')
          .eq('date', date)
          .maybeSingle();

        if (!mounted) return;
        setSession(sessionData);

        if (sessionData) {
          // 3. Load existing attendance
          const { data: att } = await supabase
            .from('attendance')
            .select('student_id, present')
            .eq('session_id', sessionData.id);

          if (att && att.length > 0) {
            const map = {};
            att.forEach(a => { map[a.student_id] = a.present; });
            setAttendance(map);
            setInitialAttendance({ ...map });
          } else {
            const init = {};
            (studentsData || []).forEach(s => { init[s.id] = false; });
            setAttendance(init);
            setInitialAttendance({});
          }
        } else {
          // Default all to absent if no session yet
          const init = {};
          (studentsData || []).forEach(s => { init[s.id] = false; });
          setAttendance(init);
          setInitialAttendance({});
          setNewTopic('');
        }
      } catch (err) {
        console.error('Attendance load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [date]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggle = (id) => {
    setAttendance(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFinalSave = async () => {
    setShowConfirm(false);
    setSaving(true);
    
    try {
      let activeSession = session;

      // 1. Create session if it doesn't exist
      if (!activeSession) {
        if (!newTopic.trim()) {
          showToast('Please provide a session topic', 'error');
          setSaving(false);
          return;
        }
        const month = new Date(date).getMonth() + 1;
        const { data: newSess, error: sessErr } = await supabase
          .from('sessions')
          .insert({ date, topic: newTopic.trim(), duration_hours: newDuration, session_type: newType, month_number: month })
          .select()
          .single();

        if (sessErr) throw sessErr;
        activeSession = newSess;
        setSession(newSess);
      }

      // 2. Save Attendance
      const markedBy = profile?.display_name || user?.user_metadata?.display_name || user?.email || 'system';
      const payload = students.map(s => ({
        student_id: s.id,
        session_id: activeSession.id,
        present: !!attendance[s.id],
        marked_by: markedBy
      }));

      const { error: attErr } = await supabase
        .from('attendance')
        .upsert(payload, { onConflict: 'student_id,session_id' });

      if (attErr) throw attErr;

      showToast(`Success! ${presentCount} students marked present.`);
      setInitialAttendance({ ...attendance });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-6xl mx-auto py-12 px-6"><Skeleton /></div>;

  return (
    <div className="pb-40 max-w-7xl mx-auto px-6 animate-in fade-in duration-700">
      
      {/* ── Header Area */}
      <div className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="relative">
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-accent-glow blur-[100px] opacity-10 pointer-events-none" />
          <h1 className="text-display-md text-primary font-black tracking-tighter leading-none mb-4">Mark Attendance</h1>
          <p className="text-body-lg text-secondary font-medium tracking-tight">Syncing roster for {students.length} students.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── Left Sidebar: Session Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <CalendarComponent 
            selectedDate={date} 
            onDateChange={setDate} 
            highlightedDates={sessionDates} 
          />

          <div className="card p-8 border-accent-glow/20 relative group">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent-glow to-transparent opacity-50" />
            
            <div className="flex items-center gap-2.5 mb-8 text-micro text-tertiary font-black tracking-[0.2em] uppercase">
              <Sparkles size={14} className="text-accent-glow" />
              Session Info
            </div>

            {session ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-primary tracking-tight leading-tight">{session.topic}</h2>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="pill bg-accent-glow/10 text-accent-glow border border-accent-glow/20 text-[10px] font-bold">
                      {session.session_type.toUpperCase()}
                    </span>
                    <span className="text-xs text-tertiary font-medium">{session.duration_hours} HOURS</span>
                  </div>
                </div>
                <div className="pt-6 border-t border-subtle/50 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-tertiary font-medium">Recorded Date</span>
                    <span className="text-primary font-bold">{session.date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-tertiary font-medium">Sync Status</span>
                    <span className={`font-bold flex items-center gap-1.5 ${isAlreadyMarked ? 'text-success-fg' : 'text-warning-fg'}`}>
                      {isAlreadyMarked ? <><CheckCircle2 size={14} /> Synced</> : <><Clock size={14} /> Pending</>}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in duration-500">
                <p className="text-sm text-tertiary leading-relaxed font-medium italic">New session required for this date. Enter details below:</p>
                <div className="space-y-2">
                  <label className="text-micro text-tertiary uppercase font-bold tracking-widest ml-1">Topic</label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={e => setNewTopic(e.target.value)}
                    placeholder="e.g. Multi-Agent Systems"
                    className="input w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-micro text-tertiary uppercase font-bold tracking-widest ml-1">Type</label>
                    <select value={newType} onChange={e => setNewType(e.target.value)} className="input w-full">
                      <option value="offline">Offline</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-micro text-tertiary uppercase font-bold tracking-widest ml-1">Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newDuration}
                      onChange={e => setNewDuration(parseFloat(e.target.value))}
                      className="input w-full"
                    />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-surface-raised/50 border border-dashed border-subtle mt-4">
                  <p className="text-[11px] text-tertiary leading-relaxed text-center">Your session will be automatically saved when you submit the attendance below.</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats Overlay */}
          <div className="card p-8 bg-surface-inset/50">
             <div className="text-micro text-tertiary mb-6 uppercase font-bold tracking-[0.2em] opacity-50">Quick Selection</div>
             <div className="grid grid-cols-2 gap-3">
               <button onClick={() => {
                 const up = {}; students.forEach(s => up[s.id] = true); setAttendance(up);
               }} className="btn-secondary text-[11px] py-3 uppercase tracking-wider font-bold hover:bg-success-bg/20 hover:text-success-fg">All Present</button>
               <button onClick={() => {
                 const up = {}; students.forEach(s => up[s.id] = false); setAttendance(up);
               }} className="btn-secondary text-[11px] py-3 uppercase tracking-wider font-bold hover:bg-danger-bg/20 hover:text-danger-fg">All Absent</button>
             </div>
          </div>
        </div>

        {/* ── Right Content: Student Roster (Always Visible) */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-[600px]">
          <div className="card p-0 overflow-hidden flex flex-col flex-1 shadow-raised">
            
            {/* Search Header */}
            <div className="p-6 border-b border-subtle flex flex-col md:flex-row items-center justify-between gap-5 bg-surface-raised/10">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-accent-glow" />
                <h3 className="text-xl font-bold text-primary tracking-tight">Student Roster</h3>
                <span className="text-[10px] font-bold bg-surface-raised text-tertiary px-2.5 py-1 rounded-lg border border-subtle">
                  {filteredStudents.length} LISTED
                </span>
              </div>
              <div className="relative group w-full md:w-72">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-accent-glow transition-colors" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={globalSearchQuery}
                  onChange={e => setGlobalSearchQuery(e.target.value)}
                  className="input w-full pl-10 h-10 text-sm"
                />
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-subtle/50">
              {filteredStudents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-40">
                  <Users size={48} className="text-tertiary mb-4" />
                  <p className="text-lg font-bold text-secondary">No Students Found</p>
                  <p className="text-sm text-tertiary mt-1">Check your active roster or filters.</p>
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const isPresent = !!attendance[student.id];
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggle(student.id)}
                      className={`flex items-center gap-5 px-8 py-4 cursor-pointer transition-all duration-300 group ${isPresent ? 'bg-success-bg/[0.03] hover:bg-success-bg/[0.06]' : 'hover:bg-surface-raised/50'}`}
                      style={{ height: '72px' }}
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${isPresent ? 'bg-success-fg border-success-fg shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-110' : 'border-subtle group-hover:border-tertiary'}`}>
                        {isPresent && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-[15px] font-bold truncate transition-colors ${isPresent ? 'text-primary' : 'text-secondary group-hover:text-primary'}`}>
                          {student.name}
                        </p>
                        <p className="text-micro text-tertiary font-bold tracking-[0.1em] uppercase mt-0.5 opacity-60">
                          {student.usn}
                        </p>
                      </div>

                      <span className="hidden md:block text-[10px] font-black text-tertiary uppercase tracking-widest px-2.5 py-1.5 bg-surface-inset rounded-md border border-subtle">
                        {student.branch_code}
                      </span>

                      <div className={`w-24 text-center py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${isPresent ? 'bg-success-bg text-success-fg border-success-border/50' : 'bg-surface text-tertiary border-subtle opacity-40 group-hover:opacity-100'}`}>
                        {isPresent ? 'PRESENT' : 'ABSENT'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Action Bar ── */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-5xl px-6 z-40 animate-in slide-in-from-bottom-10 duration-1000">
        <div className="bg-surface-raised/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8">
             <div className="flex flex-col">
               <span className="text-3xl font-black text-primary tabular-nums tracking-tighter leading-none">{pct}%</span>
               <span className="text-micro text-tertiary uppercase font-bold tracking-widest mt-1">Completion</span>
             </div>
             <div className="w-px h-10 bg-subtle/50 hidden md:block" />
             <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold text-success-fg tabular-nums leading-none">{presentCount}</span>
                  <span className="text-[9px] font-bold text-tertiary uppercase mt-1 tracking-widest">Present</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold text-danger-fg tabular-nums leading-none">{absentCount}</span>
                  <span className="text-[9px] font-bold text-tertiary uppercase mt-1 tracking-widest">Absent</span>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={() => navigate('/dashboard')} className="btn-secondary flex-1 md:flex-none px-8 h-14 rounded-2xl font-bold text-xs uppercase tracking-widest">
              Cancel
            </button>
            <button 
              onClick={() => setShowConfirm(true)}
              disabled={saving || (isAlreadyMarked && !isDirty)}
              className="btn-primary flex-1 md:flex-none px-10 h-14 rounded-2xl bg-white text-void font-black text-xs uppercase tracking-[0.1em] shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] disabled:opacity-30 disabled:grayscale"
            >
              {saving ? 'Processing...' : (isAlreadyMarked ? 'Update Records' : 'Finalize & Save')}
            </button>
          </div>
        </div>
      </div>

      {/* Modals & Toasts */}
      {showConfirm && (
        <ConfirmModal
          presentCount={presentCount}
          absentCount={absentCount}
          sessionTopic={session?.topic || newTopic}
          isUpdate={isAlreadyMarked}
          onConfirm={handleFinalSave}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
