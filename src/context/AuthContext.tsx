import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type DepartmentSlug = 'finance' | 'education' | 'engineering' | 'welfare' | 'non-formal' | 'business' | 'city-improvement' | 'enforcement' | 'ceo';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: 'mayor' | 'ceo' | 'manager' | null;
  departments: DepartmentSlug[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
}


const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'mayor' | 'ceo' | 'manager' | null>(null);
  const [departments, setDepartments] = useState<DepartmentSlug[]>([]);

  // Fetch user roles and departments from database
  const fetchUserAccess = async (userId: string) => {
    try {
      // Fetch user role
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .limit(1);

      // Fetch user departments
      const { data: userDepts } = await supabase
        .from('user_departments')
        .select('department')
        .eq('user_id', userId);

      const userRole = userRoles?.[0]?.role || null;
      const userDepartments = userDepts?.map(d => d.department) || [];

      setRole(userRole);
      setDepartments(userDepartments);
    } catch (error) {
      console.error('Error fetching user access:', error);
      setRole(null);
      setDepartments([]);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      
      if (s?.user) {
        // Fetch user access from database
        setTimeout(() => {
          fetchUserAccess(s.user.id);
        }, 0);
      } else {
        setRole(null);
        setDepartments([]);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserAccess(session.user.id);
      }
      
      setLoading(false);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp: AuthContextValue['signUp'] = async (email, password) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setDepartments([]);
  };

  const value = useMemo(() => ({ user, session, role, departments, loading, signIn, signUp, signOut }), [user, session, role, departments, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
