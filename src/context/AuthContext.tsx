import { useState, useEffect, createContext, useContext } from 'react';

export type DepartmentSlug = 'finance' | 'education' | 'engineering' | 'welfare' | 'non-formal' | 'business' | 'city-improvement' | 'enforcement' | 'ceo';

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
}

interface AuthContextValue {
  user: User | null;
  session: { user: User } | null;
  role: 'mayor' | 'ceo' | 'manager' | null;
  departments: DepartmentSlug[];
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
}

// Predefined users with their credentials and access
const PREDEFINED_USERS = [
  { 
    id: '11111111-1111-1111-1111-111111111111', 
    username: 'mayor', 
    password: 'mayor123', 
    email: 'mayor@city.gov.il',
    displayName: 'ראש העיר',
    role: 'mayor' as const,
    departments: [] as DepartmentSlug[]
  },
  { 
    id: '22222222-2222-2222-2222-222222222222', 
    username: 'ceo', 
    password: 'ceo123', 
    email: 'ceo@city.gov.il',
    displayName: 'מנכ"ל העירייה',
    role: 'ceo' as const,
    departments: [] as DepartmentSlug[]
  },
  { 
    id: '33333333-3333-3333-3333-333333333333', 
    username: 'finance', 
    password: 'finance123', 
    email: 'finance@city.gov.il',
    displayName: 'מנהל/ת פיננסים',
    role: 'manager' as const,
    departments: ['finance'] as DepartmentSlug[]
  },
  { 
    id: '44444444-4444-4444-4444-444444444444', 
    username: 'education', 
    password: 'education123', 
    email: 'education@city.gov.il',
    displayName: 'מנהל/ת חינוך',
    role: 'manager' as const,
    departments: ['education'] as DepartmentSlug[]
  },
  { 
    id: '55555555-5555-5555-5555-555555555555', 
    username: 'engineering', 
    password: 'engineering123', 
    email: 'engineering@city.gov.il',
    displayName: 'מנהל/ת הנדסה',
    role: 'manager' as const,
    departments: ['engineering'] as DepartmentSlug[]
  },
  { 
    id: '66666666-6666-6666-6666-666666666666', 
    username: 'welfare', 
    password: 'welfare123', 
    email: 'welfare@city.gov.il',
    displayName: 'מנהל/ת רווחה',
    role: 'manager' as const,
    departments: ['welfare'] as DepartmentSlug[]
  },
  { 
    id: '77777777-7777-7777-7777-777777777777', 
    username: 'nonformal', 
    password: 'nonformal123', 
    email: 'non-formal@city.gov.il',
    displayName: 'מנהל/ת חינוך בלתי פורמאלי',
    role: 'manager' as const,
    departments: ['non-formal'] as DepartmentSlug[]
  },
  { 
    id: '88888888-8888-8888-8888-888888888888', 
    username: 'business', 
    password: 'business123', 
    email: 'business@city.gov.il',
    displayName: 'מנהל/ת רישוי עסקים',
    role: 'manager' as const,
    departments: ['business'] as DepartmentSlug[]
  },
];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ user: User } | null>(null);
  const [role, setRole] = useState<'mayor' | 'ceo' | 'manager' | null>(null);
  const [departments, setDepartments] = useState<DepartmentSlug[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const predefinedUser = PREDEFINED_USERS.find(u => u.id === userData.id);
        if (predefinedUser) {
          const user: User = {
            id: predefinedUser.id,
            username: predefinedUser.username,
            email: predefinedUser.email,
            displayName: predefinedUser.displayName
          };
          setUser(user);
          setSession({ user });
          setRole(predefinedUser.role);
          setDepartments(predefinedUser.departments);
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const predefinedUser = PREDEFINED_USERS.find(
        u => u.username === username && u.password === password
      );

      if (!predefinedUser) {
        return { error: { message: 'שם משתמש או סיסמה שגויים' } };
      }

      const user: User = {
        id: predefinedUser.id,
        username: predefinedUser.username,
        email: predefinedUser.email,
        displayName: predefinedUser.displayName
      };

      // Store user in localStorage
      localStorage.setItem('currentUser', JSON.stringify({ id: user.id }));

      setUser(user);
      setSession({ user });
      setRole(predefinedUser.role);
      setDepartments(predefinedUser.departments);

      return { error: null };
    } catch (error) {
      return { error: { message: 'שגיאה בתהליך ההתחברות' } };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('currentUser');
      setUser(null);
      setSession(null);
      setRole(null);
      setDepartments([]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      role,
      departments,
      loading,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}