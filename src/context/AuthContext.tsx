import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getAccessForEmail, type DepartmentSlug } from '@/lib/demoAccess';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: 'mayor' | 'ceo' | 'manager' | null;
  departments: DepartmentSlug[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  demoSignIn: (identifier: string) => void;
}


const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'mayor' | 'ceo' | 'manager' | null>(null);
  const [departments, setDepartments] = useState<DepartmentSlug[]>([]);

  // Helper to load access from local storage or demo mapping
  const applyAccessForEmail = (email: string) => {
    const demo = getAccessForEmail(email);
    if (demo) {
      setRole(demo.role);
      setDepartments(demo.departments);
      localStorage.setItem('app_role', demo.role);
      localStorage.setItem('app_departments', JSON.stringify(demo.departments));
    } else {
      setRole(null);
      setDepartments([]);
      localStorage.removeItem('app_role');
      localStorage.removeItem('app_departments');
    }
  };

  useEffect(() => {
    // Listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user?.email) {
        applyAccessForEmail(s.user.email);
      } else {
        const demoEmail = localStorage.getItem('demo_user_email');
        if (demoEmail) {
          const uname = demoEmail.split('@')[0].toLowerCase();
          const realUserMap: Record<string, string> = {
            'mayor': '11111111-1111-1111-1111-111111111111',
            'ceo': '22222222-2222-2222-2222-222222222222', 
            'finance': '33333333-3333-3333-3333-333333333333',
            'education': '44444444-4444-4444-4444-444444444444',
            'engineering': '55555555-5555-5555-5555-555555555555',
            'welfare': '66666666-6666-6666-6666-666666666666',
            'nonformal': '77777777-7777-7777-7777-777777777777',
            'business': '88888888-8888-8888-8888-888888888888',
          };
          const userId = realUserMap[uname] || `demo-${uname}`;
          setUser({ id: userId, email: demoEmail } as unknown as User);
          applyAccessForEmail(demoEmail);
        } else {
          setRole(null);
          setDepartments([]);
        }
      }
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        // Load cached access if any
        const cachedRole = localStorage.getItem('app_role') as 'mayor' | 'ceo' | 'manager' | null;
        const cachedDeps = localStorage.getItem('app_departments');
        if (cachedRole && cachedDeps) {
          setRole(cachedRole);
          try { setDepartments(JSON.parse(cachedDeps)); } catch { setDepartments([]); }
        } else {
          applyAccessForEmail(session.user.email);
        }
      } else {
        const demoEmail = localStorage.getItem('demo_user_email');
        if (demoEmail) {
          const uname = demoEmail.split('@')[0].toLowerCase();
          const realUserMap: Record<string, string> = {
            'mayor': '11111111-1111-1111-1111-111111111111',
            'ceo': '22222222-2222-2222-2222-222222222222', 
            'finance': '33333333-3333-3333-3333-333333333333',
            'education': '44444444-4444-4444-4444-444444444444',
            'engineering': '55555555-5555-5555-5555-555555555555',
            'welfare': '66666666-6666-6666-6666-666666666666',
            'nonformal': '77777777-7777-7777-7777-777777777777',
            'business': '88888888-8888-8888-8888-888888888888',
          };
          const userId = realUserMap[uname] || `demo-${uname}`;
          setUser({ id: userId, email: demoEmail } as unknown as User);
          applyAccessForEmail(demoEmail);
        }
      }
      setLoading(false);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const demoSignIn = (identifier: string) => {
    const email = identifier.includes('@') ? identifier : `${identifier}@example.com`;
    const uname = email.split('@')[0].toLowerCase();
    
    // Map to real user UUIDs created in the database
    const realUserMap: Record<string, string> = {
      'mayor': '11111111-1111-1111-1111-111111111111',
      'ceo': '22222222-2222-2222-2222-222222222222', 
      'finance': '33333333-3333-3333-3333-333333333333',
      'education': '44444444-4444-4444-4444-444444444444',
      'engineering': '55555555-5555-5555-5555-555555555555',
      'welfare': '66666666-6666-6666-6666-666666666666',
      'nonformal': '77777777-7777-7777-7777-777777777777',
      'business': '88888888-8888-8888-8888-888888888888',
    };
    
    const userId = realUserMap[uname] || `demo-${uname}`;
    const fakeUser = { id: userId, email } as unknown as User;
    setUser(fakeUser);
    setSession(null);
    applyAccessForEmail(email);
    localStorage.setItem('demo_user_email', email);
  };

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user?.email) {
      applyAccessForEmail(data.user.email);
    }
    return { error };
  };

  const signUp: AuthContextValue['signUp'] = async (email, password) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl }
    });
    if (!error && data.user?.email) {
      applyAccessForEmail(data.user.email);
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setDepartments([]);
    localStorage.removeItem('app_role');
    localStorage.removeItem('app_departments');
    localStorage.removeItem('demo_user_email');
  };

  const value = useMemo(() => ({ user, session, role, departments, loading, signIn, signUp, signOut, demoSignIn }), [user, session, role, departments, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
