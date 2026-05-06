import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getTodayLocal } from '../utils/dateUtils';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Globe, 
  MessageSquare,
  ChevronRight,
  ArrowRightCircle,
  CheckCircle2
} from 'lucide-react';

export default function Upcoming() {
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminderActive, setReminderActive] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      try {
        const today = getTodayLocal();
        const { data } = await supabase
          .from('sessions')
          .select('*')
          .gte('date', today)
          .order('date', { ascending: true });

        if (data) setUpcomingSessions(data);
      } catch (err) {
        console.error('Error loading upcoming sessions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, []);

  const handleSetReminder = () => {
    setReminderActive(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const nextSession = upcomingSessions[0];
  const futureSessions = upcomingSessions.slice(1);

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-accent-glow/20 border-t-accent-glow rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {/* Premium Toast Notification */}
      {showToast && (
        <div className="fixed top-8 right-8 z-50 animate-in slide-in-from-right-8 duration-500">
          <div className="bg-surface-raised border border-success-border p-4 rounded-xl shadow-raised flex items-center gap-3 backdrop-blur-xl">
            <div className="w-8 h-8 rounded-lg bg-success-bg flex items-center justify-center text-success-fg">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Reminder Scheduled</p>
              <p className="text-[11px] text-tertiary">We'll notify you 1 hour before the session.</p>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="mb-12">
        <p className="text-label text-accent-glow mb-2">Academic Roadmap</p>
        <h1 className="text-display-md text-primary tracking-tighter">Upcoming Sessions</h1>
      </div>

      {nextSession ? (
        <div className="space-y-12">
          {/* Featured Next Session */}
          <div className="relative group">
            <div className="absolute inset-0 bg-accent-glow/5 blur-3xl -z-10 rounded-full" />
            <div className="card border-accent-glow/20 bg-surface-raised/40 backdrop-blur-xl p-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                <Calendar size={200} strokeWidth={1} />
              </div>
              
              <div className="flex flex-col md:flex-row gap-10 relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="pill pill-success bg-accent-glow/10 text-accent-glow border-accent-glow/20 px-4 py-1.5 text-xs">NEXT SESSION</span>
                    <span className="text-body-sm text-tertiary">|</span>
                    <span className="text-body-sm text-secondary flex items-center gap-2">
                      <Clock size={14} />
                      {nextSession.duration_hours} Hours
                    </span>
                  </div>

                  <h2 className="text-display-sm text-primary mb-4 leading-tight">
                    {nextSession.topic}
                  </h2>
                  
                  <div className="flex flex-wrap gap-6 mb-8">
                    <div className="flex items-center gap-2.5 text-secondary">
                      <div className="w-9 h-9 rounded-xl bg-surface-inset flex items-center justify-center text-accent-glow">
                        <Calendar size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-tertiary font-bold">Date</span>
                        <span className="text-sm font-medium">{new Date(nextSession.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-secondary">
                      <div className="w-9 h-9 rounded-xl bg-surface-inset flex items-center justify-center text-accent-glow">
                        {nextSession.session_type === 'online' ? <Globe size={18} /> : <MapPin size={18} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-tertiary font-bold">Format</span>
                        <span className="text-sm font-medium capitalize">{nextSession.session_type} Session</span>
                      </div>
                    </div>
                  </div>

                  {nextSession.notes && (
                    <div className="p-4 rounded-2xl bg-void/40 border border-subtle flex gap-4 items-start">
                      <MessageSquare size={18} className="text-accent-glow shrink-0 mt-1" />
                      <div>
                        <p className="text-[11px] uppercase tracking-widest text-tertiary font-bold mb-1">Mentor's Note</p>
                        <p className="text-sm text-secondary italic leading-relaxed">"{nextSession.notes}"</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:w-64 flex flex-col justify-center items-center p-6 bg-surface-inset/50 rounded-2xl border border-subtle text-center">
                  <p className="text-label text-tertiary mb-2">Enrollment Status</p>
                  <p className="text-display-sm text-primary font-mono tracking-tighter mb-4">ACTIVE</p>
                  <div className="w-full h-1.5 bg-void rounded-full overflow-hidden mb-6">
                    <div className="w-full h-full bg-accent-glow animate-pulse" />
                  </div>
                  <button 
                    onClick={handleSetReminder}
                    disabled={reminderActive}
                    className={`btn-primary w-full flex items-center justify-center gap-2 py-3 transition-all duration-500 ${
                      reminderActive ? 'bg-success-bg border-success-border text-success-fg opacity-100' : ''
                    }`}
                  >
                    {reminderActive ? (
                      <>
                        <CheckCircle2 size={16} />
                        Reminder Active
                      </>
                    ) : (
                      <>
                        Authorize Notifications
                        <ArrowRightCircle size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Future Roadmap */}
          {futureSessions.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-h2 text-primary pl-1 flex items-center gap-3">
                Future Roadmap
                <span className="h-px flex-1 bg-border-subtle" />
              </h3>
              
              <div className="grid gap-4">
                {futureSessions.map(session => (
                  <div key={session.id} className="flex items-center gap-6 p-5 rounded-2xl bg-surface/40 border border-subtle hover:bg-surface-raised transition-colors group">
                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-surface-inset border border-subtle text-center shrink-0">
                      <span className="text-micro font-bold text-accent-glow uppercase">{new Date(session.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-xl font-display font-bold text-primary">{new Date(session.date).getDate()}</span>
                    </div>

                    <div className="flex-1">
                      <h4 className="text-body-lg font-bold text-primary mb-1 group-hover:text-accent-glow transition-colors">{session.topic}</h4>
                      <div className="flex items-center gap-4">
                        <span className="text-micro text-tertiary uppercase tracking-widest font-bold flex items-center gap-1.5">
                          {session.session_type === 'online' ? <Globe size={12} /> : <MapPin size={12} />}
                          {session.session_type}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-border-strong" />
                        <span className="text-micro text-tertiary uppercase tracking-widest font-bold flex items-center gap-1.5">
                          <Clock size={12} />
                          {session.duration_hours}h
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={20} className="text-tertiary group-hover:text-primary transition-colors group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-surface/20 rounded-3xl border border-dashed border-subtle text-center">
          <div className="w-20 h-20 rounded-3xl bg-surface-raised flex items-center justify-center text-tertiary mb-6 rotate-12">
            <Calendar size={40} />
          </div>
          <h2 className="text-h2 text-primary mb-2">No upcoming sessions</h2>
          <p className="text-secondary max-w-sm">The curriculum schedule for the next module is being finalized. Check back soon for the update!</p>
        </div>
      )}
    </div>
  );
}
