import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Shield, GraduationCap, Lock, Mail, Fingerprint, AlertCircle, ChevronRight } from 'lucide-react';

export default function Login() {
  const [tab, setTab] = useState('student'); // Default to student per user preference
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { user, mockSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  if (user) return null;

  const handleDemoLogin = (role = 'student') => {
    if (role === 'mentor') {
      console.log('🏁 ForgeTrack: Authorizing Mentor Demo...');
      mockSignIn(
        { id: 'demo-m1', email: 'nischay@forge.local', user_metadata: { role: 'mentor', display_name: 'Nischay (Mentor)' } },
        { id: 'demo-m1', role: 'mentor', display_name: 'Nischay (Mentor)' }
      );
      window.location.href = '/admin/dashboard';
    } else {
      console.log('🏁 ForgeTrack: Authorizing Student Demo...');
      mockSignIn(
        { id: 'demo-f1', email: '4sh24cs001@student.forgetrack.com', user_metadata: { role: 'student', display_name: 'Aarav Patel' } },
        { id: 'demo-f1', role: 'student', display_name: 'Aarav Patel', student_id: 1 }
      );
      window.location.href = '/me/attendance';
    }
  };

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    // ZERO-NETWORK BYPASS (For Demo/Fixing Network Blocks)
    const normalizedUSN = identifier.trim().toUpperCase();
    const normalizedPass = password.trim();
    const isBypassPassword = normalizedPass === '123' || normalizedPass === 'Student@123';
    
    if (tab === 'student' && isBypassPassword) {
      setLoading(true);
      try {
        // Find the student in the database
        const { data: student, error: fetchError } = await supabase
          .from('students')
          .select('id, name, usn')
          .eq('usn', normalizedUSN)
          .maybeSingle();

        if (fetchError) throw fetchError;
        
        if (student) {
          console.log(`🏁 ForgeTrack: Authorizing ${student.name} via Bypass...`);
          mockSignIn(
            { 
              id: `bypass-${student.id}`, 
              email: `${student.usn.toLowerCase()}@student.forgetrack.com`, 
              user_metadata: { role: 'student', display_name: student.name } 
            },
            { 
              id: `bypass-${student.id}`, 
              role: 'student', 
              display_name: student.name, 
              student_id: student.id 
            }
          );
          navigate('/me/attendance', { replace: true });
          return;
        } else {
          throw new Error(`Student with USN ${normalizedUSN} not found in database.`);
        }
      } catch (err) {
        console.error('Bypass login failed:', err);
        setError(err.message);
        setLoading(false);
        return;
      }
    }

    try {
      const email = tab === 'student' ? `${identifier.trim().toLowerCase()}@student.forgetrack.com` : identifier.trim();
      
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // SPEC RULE: First-time student login (password === usn)
      if (tab === 'student' && password.trim().toUpperCase() === identifier.trim().toUpperCase()) {
        console.log('🔄 First-time student login detected. Forcing password change.');
        navigate('/change-password', { replace: true });
        return;
      }

      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-void relative flex items-center justify-center p-6 overflow-hidden">
      {/* Design System Background Layer */}
      <div className="absolute inset-0 z-0 bg-dot-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 bg-cosmic-glow pointer-events-none" />
      
      <div className="w-full max-w-[440px] z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="card relative p-10 overflow-visible">
          {/* Logo & Display Heading */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-accent-glow blur-3xl opacity-20" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-glow to-indigo-600 flex items-center justify-center text-white relative shadow-[0_0_40px_rgba(139,92,246,0.3)] border border-white/10">
                <Fingerprint size={32} strokeWidth={1.5} />
              </div>
            </div>
            <h1 className="text-display-sm text-primary tracking-tighter font-display mb-1">ForgeTrack</h1>
            <p className="text-label text-tertiary">Session Intelligence Portal</p>
          </div>

          {/* Role Tab Toggle */}
          <div className="flex p-1 bg-surface-inset rounded-xl mb-8 border border-subtle">
            <button
              onClick={() => { setTab('student'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-micro font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${
                tab === 'student' 
                  ? 'bg-surface-raised text-primary shadow-raised border border-subtle' 
                  : 'text-tertiary hover:text-secondary'
              }`}
            >
              <GraduationCap size={14} />
              Student
            </button>
            <button
              onClick={() => { setTab('mentor'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-micro font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${
                tab === 'mentor' 
                  ? 'bg-surface-raised text-primary shadow-raised border border-subtle' 
                  : 'text-tertiary hover:text-secondary'
              }`}
            >
              <Shield size={14} />
              Mentor
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-label text-secondary ml-1">
                {tab === 'student' ? 'University Seat Number (USN)' : 'Mentor Email Address'}
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-accent-glow transition-colors">
                  {tab === 'student' ? <Fingerprint size={16} /> : <Mail size={16} />}
                </div>
                <input
                  type={tab === 'student' ? 'text' : 'email'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={tab === 'student' ? 'e.g. 4SH24CS001' : 'nischay@forge.local'}
                  className="input w-full pl-11 bg-surface-inset border-subtle focus:border-accent-glow transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-label text-secondary">Password</label>
                {tab === 'mentor' && (
                  <button className="text-micro text-accent-glow hover:underline font-bold">Recovery?</button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-accent-glow transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input w-full pl-11 bg-surface-inset border-subtle focus:border-accent-glow transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-danger-bg border border-danger-border flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                  <AlertCircle size={16} className="text-danger-fg shrink-0 mt-0.5" />
                  <span className="text-danger-fg text-xs font-medium leading-relaxed">{error}</span>
                </div>
                {error.toLowerCase().includes('fetch') && (
                  <div className="bg-void/40 p-2.5 rounded-lg border border-danger-border/20">
                    <p className="text-[10px] text-danger-fg/80 uppercase tracking-widest font-bold mb-1">System Alert</p>
                    <p className="text-[11px] text-danger-fg/60 leading-tight">
                      Network connection to Supabase was closed. Please check your VPN or local firewall settings.
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !identifier || !password}
              className="btn-primary w-full mt-2 h-12 flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-bold uppercase tracking-widest">Verifying...</span>
                </div>
              ) : (
                <>
                  <span className="text-sm font-bold uppercase tracking-widest">Authorize Access</span>
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            <div className="pt-6 flex flex-col items-center gap-4">
              <div className="h-px w-12 bg-border-subtle" />
              <div className="flex flex-col items-center gap-4">
                <p className="text-center text-[11px] text-tertiary leading-relaxed px-4">
                  Access is restricted to authorized students and mentors of <span className="text-secondary font-medium">The Forge Engineering Bootcamp</span>.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleDemoLogin('student')}
                    className="flex-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent-glow hover:text-white transition-colors py-2.5 px-4 rounded-lg border border-accent-glow/20 hover:border-accent-glow/50 bg-accent-glow/5"
                  >
                    Student Demo
                  </button>
                  <button 
                    onClick={() => handleDemoLogin('mentor')}
                    className="flex-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent-glow hover:text-white transition-colors py-2.5 px-4 rounded-lg border border-accent-glow/20 hover:border-accent-glow/50 bg-accent-glow/5"
                  >
                    Mentor Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
