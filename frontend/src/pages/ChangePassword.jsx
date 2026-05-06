import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Lock, ShieldCheck, AlertCircle, CheckCircle, ChevronRight, Fingerprint } from 'lucide-react';

export default function ChangePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleUpdate = async () => {
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } catch (err) {
      console.error('Update password error:', err);
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-void relative flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 z-0 bg-dot-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 bg-cosmic-glow pointer-events-none" />
      
      <div className="w-full max-w-[440px] z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="card relative p-10 overflow-visible">
          <div className="flex flex-col items-center mb-10">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-accent-glow blur-3xl opacity-20" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white relative shadow-2xl border border-white/10">
                <ShieldCheck size={32} />
              </div>
            </div>
            <h1 className="text-display-xs text-primary tracking-tighter font-display mb-2">Secure Your Account</h1>
            <p className="text-sm text-tertiary text-center">Your account is currently using a default password. Please set a new secure password.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-label text-secondary ml-1">New Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-accent-glow transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="input w-full pl-11 bg-surface-inset border-subtle focus:border-accent-glow transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-label text-secondary ml-1">Confirm New Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-accent-glow transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="input w-full pl-11 bg-surface-inset border-subtle focus:border-accent-glow transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-danger-bg border border-danger-border flex items-center gap-3 animate-in shake">
                <AlertCircle size={16} className="text-danger-fg shrink-0" />
                <span className="text-danger-fg text-xs font-medium">{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-success-bg border border-success-border flex items-center gap-3 animate-in fade-in">
                <CheckCircle size={16} className="text-success-fg shrink-0" />
                <span className="text-success-fg text-xs font-medium">Password updated! Redirecting...</span>
              </div>
            )}

            <button
              onClick={handleUpdate}
              disabled={loading || success || !password || !confirmPassword}
              className="btn-primary w-full mt-2 h-12 flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-void border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-sm font-bold uppercase tracking-widest">Update Security Keys</span>
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            <button 
              onClick={() => signOut()}
              className="w-full text-center text-xs text-tertiary hover:text-primary transition-colors mt-4"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
