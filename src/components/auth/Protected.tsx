import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
