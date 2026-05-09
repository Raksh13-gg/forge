import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // FAST INIT: We use a shorter 1.5s timeout for the "blocking" loading screen.
    // If auth isn't confirmed by then, we show the app anyway (RoleGuard will handle redirects).
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth init safety trigger - resuming UI');
        setLoading(false);
      }
    }, 1500);

    const initAuth = async () => {
      // 1. Check for persistent Demo Mode
      const isDemo = localStorage.getItem('forgetrack_demo_mode') === 'true';
      if (isDemo) {
        console.log('🏁 Restoring persistent demo session...');
        setUser({ id: 'demo-f1', email: '4sh24cs001@student.forgetrack.com', user_metadata: { role: 'student', display_name: 'Aarav Patel' } });
        setProfile({ id: 'demo-f1', role: 'student', display_name: 'Aarav Patel', student_id: 1 });
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      // Don't override demo mode via auth change events
      if (localStorage.getItem('forgetrack_demo_mode') === 'true') return;
      
      console.log('Auth event:', event);
      
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, role, student_id')
        .eq('id', userId)
        .maybeSingle();
        
      if (!error && data) {
        setProfile(data);
      } else if (user?.email?.includes('@student.forgetrack.com')) {
        // AUTO-RESOLVE FALLBACK: If profile is missing but it's a student email,
        // we can attempt to link to a student based on USN part of email
        console.warn('Profile missing for student. Attempting to resolve via USN...');
        const usnPart = user.email.split('@')[0].toUpperCase();
        const { data: stuData } = await supabase.from('students').select('id, name').eq('usn', usnPart).maybeSingle();
        
        if (stuData) {
          setProfile({
            id: userId,
            display_name: stuData.name,
            role: 'student',
            student_id: stuData.id
          });
        } else {
          setProfile(null);
        }
      }
    } catch (error) {
      console.error('Profile fetch suppressed:', error.message);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('forgetrack_demo_mode');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  // Derive role: prioritize DB profile, fall back to JWT metadata (nearly instant)
  const role = profile?.role || user?.user_metadata?.role || null;

  const value = {
    user,
    profile,
    role,
    loading,
    signOut,
    mockSignIn: (mockUser, mockProfile) => {
      setUser(mockUser);
      setProfile(mockProfile);
      setLoading(false);
      localStorage.setItem('forgetrack_demo_mode', 'true');
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen bg-void flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-accent-glow blur-2xl opacity-20 animate-pulse" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-glow to-indigo-600 flex items-center justify-center text-white font-display font-extrabold text-2xl animate-bounce shadow-2xl relative">
                F
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-primary text-sm font-bold tracking-widest uppercase opacity-80">ForgeTrack</p>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-glow animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-accent-glow animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-accent-glow animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
