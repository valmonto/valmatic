import { Navigate } from 'react-router';
import { useSystemRole } from '@/shared/hooks/use-permissions';
import { useAuth } from '@/shared/auth/auth-context';

/**
 * Rendering gate for /admin pages: non-admins are routed home. NOT security —
 * every endpoint behind these pages enforces @SystemRoles(ADMIN) on the API;
 * this only decides what to render.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const systemRole = useSystemRole();

  if (isLoading) return null;
  if (systemRole !== 'ADMIN') return <Navigate to="/" replace />;

  return <>{children}</>;
}
