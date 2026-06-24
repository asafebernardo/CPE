import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { getRouteAccess } from '../../navigation/menuConfig';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const role = useAuthStore((s) => s.user?.role ?? 'USER');
  const canAccess = useUiStore((s) => s.canAccess);
  const access = getRouteAccess(location.pathname);

  if (!access) return <>{children}</>;

  if (!role || !canAccess(access.minRole, access.advancedOnly, role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
