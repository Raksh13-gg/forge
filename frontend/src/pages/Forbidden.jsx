import { ShieldAlert, Home, LogOut, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Forbidden() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleForceReset = () => {
    // Aggressively clear everything
    localStorage.clear();
    sessionStorage.clear();
    // Clear cookies (basic attempt)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-6 text-center font-body">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-danger-bg rounded-full flex items-center justify-center mx-auto mb-8 border border-danger-border shadow-[0_0_40px_rgba(244,63,94,0.15)]">
          <ShieldAlert size={40} className="text-danger-fg" />
        </div>
        
        <h1 className="text-display-sm text-primary mb-4 font-bold tracking-tight">Access Denied</h1>
        <p className="text-body-lg text-secondary mb-10 leading-relaxed">
          You don't have permission to view this page. This usually happens if your account is not yet fully configured in the database.
        </p>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="flex-1 btn-primary"
            >
              <Home size={18} />
              Try Home
            </button>
            <button 
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
              className="flex-1 btn-secondary"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
          
          <div className="pt-6 border-t border-subtle mt-4">
            <p className="text-xs text-tertiary mb-3 uppercase tracking-widest">Stuck in a loop?</p>
            <button 
              onClick={handleForceReset}
              className="w-full py-3 px-4 rounded-md border border-dashed border-danger-border text-danger-fg hover:bg-danger-bg transition-all flex items-center justify-center gap-2 text-sm font-medium"
            >
              <RefreshCcw size={16} />
              Force Session Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
