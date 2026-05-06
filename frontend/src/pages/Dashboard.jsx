import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayLocal } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { 
  Calendar, 
  Clock, 
  Activity, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  CheckSquare, 
  Upload,
  Plus,
  ChevronRight,
  Zap,
  Star
} from 'lucide-react';

// Common Skeleton Component
const SkeletonCard = () => (
  <div className="card animate-pulse min-h-[240px] flex flex-col justify-between p-8">
    <div className="space-y-4">
      <div className="h-4 bg-surface-raised rounded-lg w-1/4"></div>
      <div className="h-10 bg-surface-raised rounded-xl w-3/4"></div>
      <div className="h-4 bg-surface-raised rounded-lg w-1/2"></div>
    </div>
    <div className="h-12 bg-surface-raised rounded-xl w-full mt-8"></div>
  </div>
);

// -------------------------------------------------------------
// Ticker Strip Component
// -------------------------------------------------------------
function TickerStrip({ data, loading }) {
  const stats = [
    { label: 'Total Sessions', value: data?.sessions ?? 0, icon: Calendar, color: 'text-accent-glow' },
    { label: 'Avg Attendance', value: `${data?.attendancePct ?? 0}%`, icon: TrendingUp, color: 'text-success-fg' },
    { label: 'Active Students', value: data?.students ?? 0, icon: Users, color: 'text-info-fg' },
    { label: 'Latest Date', value: data?.lastDate ?? 'N/A', icon: Clock, color: 'text-warning-fg' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
      {stats.map((stat, i) => (
        <div key={i} className={`card p-5 flex items-center gap-5 transition-all duration-500 ${loading ? 'opacity-50 grayscale' : ''}`}>
          <div className="w-12 h-12 rounded-2xl bg-surface-raised flex items-center justify-center border border-subtle group-hover:border-default transition-all">
            <stat.icon size={22} className={stat.color} strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-micro text-tertiary uppercase tracking-[0.15em] font-bold">{stat.label}</div>
            <div className="text-xl font-bold tabular-nums text-primary mt-0.5 tracking-tight">{stat.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// -------------------------------------------------------------
// Card 1: Today's Session
// -------------------------------------------------------------
function TodaysSessionCard() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchToday() {
      try {
        const today = getTodayLocal();
        const { data, error } = await supabase.from('sessions').select('*').eq('date', today).maybeSingle();
        if (!error) setSession(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchToday();
  }, []);

  if (loading) return <SkeletonCard />;

  return (
    <div className="card flex flex-col justify-between p-10 group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
        <Activity size={120} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-accent-glow animate-pulse shadow-[0_0_8px_var(--accent-glow)]" />
          <div className="text-micro text-tertiary uppercase tracking-[0.2em] font-bold">TODAY'S SCHEDULE</div>
        </div>
        
        {session ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-display-sm text-primary mb-5 font-bold tracking-tight leading-[1.1]">{session.topic}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <span className="pill bg-accent-glow/10 text-accent-glow border border-accent-glow/20 px-3 py-1.5 text-[10px] font-bold">
                {session.session_type.toUpperCase()}
              </span>
              <span className="pill bg-surface-raised text-secondary border border-subtle px-3 py-1.5 text-[10px] font-bold">
                <Clock size={12} className="mr-1.5" />
                {session.duration_hours} HOURS
              </span>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-display-sm text-tertiary/40 mb-3 font-bold tracking-tight">No Session</h2>
            <p className="text-sm text-tertiary leading-relaxed max-w-[240px]">There are no sessions recorded in the schedule for today.</p>
          </div>
        )}
      </div>

      <div className="mt-12 relative z-10">
        <button 
          onClick={() => navigate(session ? '/attendance' : '/attendance')} 
          className={session ? "btn-secondary w-full group/btn" : "btn-primary w-full group/btn"}
        >
          {session ? "View Attendance" : "Initialize Session"}
          <ChevronRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Card 2: Today's Attendance
// -------------------------------------------------------------
function TodaysAttendanceCard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const today = getTodayLocal();
        const { data: session } = await supabase.from('sessions').select('id').eq('date', today).maybeSingle();
        
        if (!session) {
          setStats(null);
        } else {
          const { data: attendance } = await supabase
            .from('attendance')
            .select('present, student_id')
            .eq('session_id', session.id);

          if (!attendance || attendance.length === 0) {
            setStats({ marked: false });
          } else {
            const presentCount = attendance.filter(a => a.present).length;
            const total = attendance.length;
            setStats({ marked: true, presentCount, total });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAttendance();
  }, []);

  if (loading) return <SkeletonCard />;

  return (
    <div className="card flex flex-col justify-between p-10 group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
        <CheckCircle size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-6 text-micro text-tertiary uppercase tracking-[0.2em] font-bold">
          <Activity size={13} className="text-success-fg" />
          REALTIME STATUS
        </div>
        
        {!stats || !stats.marked ? (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-display-sm text-tertiary/40 mb-3 font-bold tracking-tight">Pending</h2>
            <p className="text-sm text-tertiary leading-relaxed mb-8 max-w-[240px]">Attendance has not been captured for the current session yet.</p>
            <button onClick={() => navigate('/attendance')} className="btn-primary w-full group/btn h-12">
              Mark Attendance
              <Plus size={16} className="transition-transform group-hover/btn:rotate-90" />
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-baseline gap-3">
              <h2 className="text-display-md text-primary font-black tabular-nums tracking-tighter">{stats.presentCount}</h2>
              <span className="text-xl text-tertiary font-bold tracking-tight">/ {stats.total}</span>
            </div>
            
            <div className="mt-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-micro text-tertiary uppercase font-bold tracking-widest">Turnout Rate</span>
                <span className="text-xs font-bold text-success-fg tabular-nums">{Math.round((stats.presentCount / stats.total) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-surface-inset rounded-full overflow-hidden border border-subtle">
                <div 
                  className="h-full bg-success rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  style={{ width: `${(stats.presentCount / stats.total) * 100}%` }}
                />
              </div>
            </div>
            
            <p className="mt-8 text-xs text-secondary font-medium flex items-center gap-2">
              <CheckCircle size={14} className="text-success-fg" />
              Capture successful for {stats.presentCount} students.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Card 3: Program Overview
// -------------------------------------------------------------
function ProgramOverviewCard({ data, loading }) {
  if (loading) return <SkeletonCard />;

  return (
    <div className="card p-10 flex flex-col justify-between min-h-[340px]">
      <div className="relative z-10">
        <div className="text-micro text-tertiary mb-8 uppercase tracking-[0.2em] font-bold flex items-center gap-2">
          <Zap size={13} className="text-accent-glow" />
          PROGRAM ANALYTICS
        </div>
        
        <div className="grid grid-cols-2 gap-x-12 gap-y-10">
          <div>
            <div className="text-display-sm text-primary font-black tabular-nums tracking-tight">{data?.totalSessions ?? 0}</div>
            <div className="text-micro text-tertiary mt-2 uppercase font-bold tracking-widest">TOTAL SESSIONS</div>
          </div>
          <div>
            <div className="text-display-sm text-primary font-black tabular-nums tracking-tight">{data?.avgPct ?? 0}%</div>
            <div className="text-micro text-tertiary mt-2 uppercase font-bold tracking-widest">AVG RETENTION</div>
          </div>
          
          <div className="col-span-2 pt-8 border-t border-subtle/50 space-y-5">
            <div className="flex justify-between items-center group">
              <span className="text-[13px] text-secondary font-medium flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-success-bg flex items-center justify-center">
                  <Star size={14} className="text-success-fg" />
                </div>
                Top Performer
              </span>
              <span className="text-[13px] text-primary font-bold truncate max-w-[180px] tracking-tight">{data?.bestStudent ?? 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center group">
              <span className="text-[13px] text-secondary font-medium flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-danger-bg flex items-center justify-center">
                  <Activity size={14} className="text-danger-fg" />
                </div>
                Risk Alert
              </span>
              <span className="text-[13px] text-primary font-bold truncate max-w-[180px] tracking-tight">{data?.worstStudent ?? 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Card 4: Recent Activity
// -------------------------------------------------------------
function RecentActivityCard({ activities, loading }) {
  if (loading) return <SkeletonCard />;

  return (
    <div className="card p-10 flex flex-col min-h-[340px]">
      <div className="text-micro text-tertiary mb-8 uppercase tracking-[0.2em] font-bold flex items-center gap-2">
        <Activity size={13} className="text-accent-glow" />
        SYSTEM ACTIVITY
      </div>
      
      <div className="space-y-6 flex-1">
        {activities.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <div className="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center text-tertiary/20 mb-4 border border-dashed border-subtle">
              <Clock size={32} />
            </div>
            <p className="text-sm text-tertiary font-medium">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map(act => (
              <div key={act.id} className="flex gap-5 group items-start">
                <div className="w-10 h-10 rounded-xl bg-surface-raised border border-subtle flex items-center justify-center shrink-0 transition-all group-hover:border-accent-glow/50">
                  {act.type === 'attendance' ? <CheckSquare size={16} className="text-accent-glow" /> : <Upload size={16} className="text-success-fg" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] text-primary font-bold truncate tracking-tight">{act.desc}</p>
                  <p className="text-micro text-tertiary mt-1.5 uppercase font-bold tracking-widest opacity-60">
                    {act.time.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {act.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <ChevronRight size={14} className="text-tertiary/20 group-hover:text-tertiary transition-colors mt-2" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Main Dashboard Assembly
// -------------------------------------------------------------
export default function Dashboard() {
  const { profile, user } = useAuth();
  const { ticker, overview, activity, loading } = useDashboardStats();

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  
  return (
    <div className="pb-24 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* Hero Welcome */}
      <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="relative">
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-accent-glow blur-[100px] opacity-10 pointer-events-none" />
          <h1 className="text-display-md text-primary mb-3 font-black tracking-tighter leading-none">
            Welcome Back, <span className="text-accent-glow">{displayName.split(' ')[0]}</span>
          </h1>
          <p className="text-body-lg text-secondary font-medium tracking-tight">System is operational. {ticker?.students || 0} students synced.</p>
        </div>
        
        {/* Quick Sync Button */}
        <button 
          onClick={() => window.location.reload()}
          className="btn-secondary px-5 py-3 rounded-xl border border-subtle bg-surface-raised/30 backdrop-blur-md flex items-center gap-2.5 text-xs font-bold uppercase tracking-widest group"
        >
          <Activity size={14} className="text-accent-glow group-hover:animate-pulse" />
          Force Sync
        </button>
      </div>
      
      {/* Ticker Section */}
      <TickerStrip data={ticker} loading={loading} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <TodaysSessionCard />
        <TodaysAttendanceCard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ProgramOverviewCard data={overview} loading={loading} />
        <RecentActivityCard activities={activity} loading={loading} />
      </div>
    </div>
  );
}
