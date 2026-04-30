import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, ChevronRight, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function TopBar() {
  const { profile, user, role } = useAuth();
  const location = useLocation();
  const [search, setSearch] = useState('');

  // Basic breadcrumb logic
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPage = pathParts.length > 0 
    ? pathParts[pathParts.length - 1].charAt(0).toUpperCase() + pathParts[pathParts.length - 1].slice(1)
    : 'Dashboard';

  // Fall back to email username when DB profile row doesn't exist
  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const displayRole = role === 'mentor' ? 'Mentor' : 'Student';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-20 flex items-center justify-between px-6 lg:px-12 w-full z-20 relative bg-void/50 backdrop-blur-2xl border-b border-subtle/40">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-3 text-[13px]">
        <span className="text-micro font-bold text-tertiary uppercase tracking-[0.2em] opacity-60">Overview</span>
        <ChevronRight size={14} className="text-tertiary/40" />
        <span className="text-primary font-semibold tracking-tight">{currentPage.replace(/-/g, ' ')}</span>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-8">
        {/* Search Input */}
        <div className="relative hidden md:block w-80 group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={15} className="text-tertiary group-focus-within:text-accent-glow transition-colors" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search everything..."
            className="w-full bg-surface-inset/50 border border-subtle rounded-xl py-2.5 pl-10 pr-4 text-[13.5px] text-primary focus:outline-none focus:border-accent-glow/50 focus:bg-surface-raised/30 transition-all placeholder:text-tertiary/70"
          />
        </div>

        {/* Notifications (Placeholder) */}
        <button className="relative w-10 h-10 rounded-xl bg-surface-raised/30 border border-subtle flex items-center justify-center text-tertiary hover:text-primary transition-all group">
          <Bell size={18} strokeWidth={1.75} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent-glow rounded-full border-2 border-void shadow-[0_0_8px_var(--accent-glow)]" />
        </button>

        {/* User Profile Link */}
        <Link 
          to="/settings" 
          className="flex items-center gap-3.5 pl-8 border-l border-subtle/50 hover:opacity-80 transition-all group"
        >
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[13.5px] font-bold text-primary group-hover:text-accent-glow transition-colors">
              {displayName}
            </span>
            <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest mt-0.5">
              {displayRole}
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-accent-glow blur-md opacity-0 group-hover:opacity-20 transition-opacity" />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-surface-raised to-void border border-subtle flex items-center justify-center text-primary font-display font-extrabold text-sm shadow-xl group-hover:border-accent-glow/50 transition-all relative">
              {initial}
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
