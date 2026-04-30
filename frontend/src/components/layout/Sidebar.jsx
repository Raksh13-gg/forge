import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  BookOpen, 
  Upload,
  UserCheck,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Fingerprint
} from 'lucide-react';

export default function Sidebar() {
  const { role, profile, user, signOut } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fall back to JWT metadata when public.users row is missing
  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';

  const handleLogout = async () => {
    await signOut();
  };

  const NavItem = ({ to, icon: Icon, label, badge }) => {
    const isActive = location.pathname === to || (location.pathname.startsWith(to) && to !== '/');
    
    return (
      <Link
        to={to}
        className={`flex items-center h-12 px-3.5 rounded-xl mb-1.5 transition-all duration-300 group ${
          isActive 
            ? 'bg-accent-glow/10 text-primary border border-accent-glow/20' 
            : 'text-secondary hover:bg-surface-raised/50 hover:text-primary border border-transparent'
        } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
      >
        <div className="flex items-center gap-3.5">
          <Icon 
            size={20} 
            strokeWidth={isActive ? 2.25 : 1.75} 
            className={`transition-all duration-300 ${isActive ? 'text-accent-glow drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'text-tertiary group-hover:text-secondary'} shrink-0`} 
          />
          {!isCollapsed && <span className={`font-body text-[13.5px] font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isActive ? 'translate-x-0.5' : ''}`}>{label}</span>}
        </div>
        {!isCollapsed && badge && (
          <span className="text-[9px] font-bold uppercase tracking-widest bg-accent-glow/20 text-accent-glow px-2 py-0.5 rounded-md border border-accent-glow/20">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside 
      className={`hidden lg:flex flex-col bg-void border-r border-subtle h-screen sticky top-0 transition-all duration-500 ease-in-out z-30 shadow-2xl ${
        isCollapsed ? 'w-20' : 'w-[280px]'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center px-6 py-8 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-accent-glow blur-xl opacity-20" />
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-glow to-indigo-600 flex items-center justify-center text-white relative shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                <Fingerprint size={24} />
              </div>
            </div>
            <span className="font-display font-extrabold text-xl text-primary tracking-tighter">ForgeTrack</span>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-glow to-indigo-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Fingerprint size={24} />
          </div>
        )}
      </div>

      {/* Welcome Block */}
      {!isCollapsed && (
        <div className="px-6 pb-8 border-b border-subtle/50 animate-in fade-in duration-500">
          <div className="p-4 rounded-2xl bg-surface-raised/30 border border-subtle/30 backdrop-blur-sm">
            <h3 className="font-display font-bold text-primary truncate text-sm">
              {displayName.split(' ')[0]}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${role === 'mentor' ? 'bg-accent-glow shadow-[0_0_8px_var(--accent-glow)]' : 'bg-success-fg shadow-[0_0_8px_var(--success-fg)]'}`} />
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-tertiary">
                {role === 'mentor' ? 'Mentor Active' : 'Student Active'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
        {role === 'mentor' && (
          <>
            <div>
              {!isCollapsed && <div className="text-[10px] font-bold text-tertiary mb-4 px-3 uppercase tracking-[0.2em] opacity-40">Core</div>}
              <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            </div>

            <div>
              {!isCollapsed && <div className="text-[10px] font-bold text-tertiary mb-4 px-3 uppercase tracking-[0.2em] opacity-40">Operations</div>}
              <NavItem to="/attendance" icon={CheckSquare} label="Mark Attendance" />
              <NavItem to="/history" icon={Users} label="Student History" />
              <NavItem to="/materials" icon={BookOpen} label="Materials" />
            </div>

            <div>
              {!isCollapsed && <div className="text-[10px] font-bold text-tertiary mb-4 px-3 uppercase tracking-[0.2em] opacity-40">Database</div>}
              <NavItem to="/upload" icon={Upload} label="Upload CSV" />
            </div>
          </>
        )}

        {role === 'student' && (
          <>
            <div>
              {!isCollapsed && <div className="text-[10px] font-bold text-tertiary mb-4 px-3 uppercase tracking-[0.2em] opacity-40">Self Service</div>}
              <NavItem to="/me/attendance" icon={UserCheck} label="My Attendance" />
              <NavItem to="/me/upcoming" icon={Calendar} label="Upcoming Sessions" />
            </div>

            <div>
              {!isCollapsed && <div className="text-[10px] font-bold text-tertiary mb-4 px-3 uppercase tracking-[0.2em] opacity-40">Academic</div>}
              <NavItem to="/me/materials" icon={BookOpen} label="Learning Materials" />
            </div>
          </>
        )}

        <div className="mt-auto space-y-1 pt-6 border-t border-subtle/50">
          {!isCollapsed && <div className="text-[10px] font-bold text-tertiary mb-4 px-3 uppercase tracking-[0.2em] opacity-40">Account</div>}
          <NavItem to="/settings" icon={Settings} label="Settings" />
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3.5 h-12 px-4 rounded-xl text-secondary hover:bg-danger-bg hover:text-danger-fg transition-all group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} strokeWidth={1.75} className="shrink-0 transition-transform group-hover:-translate-x-0.5" />
            {!isCollapsed && <span className="font-body text-[13.5px] font-medium">Logout</span>}
          </button>
        </div>
      </nav>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-32 w-6 h-6 flex items-center justify-center rounded-full bg-surface-raised border border-subtle text-tertiary hover:text-primary transition-all z-50 shadow-xl opacity-0 lg:group-hover:opacity-100 group"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
