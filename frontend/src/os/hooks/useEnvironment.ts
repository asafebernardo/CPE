import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import type { MainSectionId } from '../../navigation/enterpriseNav';
import { getSectionForPath } from '../../navigation/enterpriseNav';

export type OsEnvironment = 'dashboard' | 'network' | 'wireless' | 'security' | 'diagnostics' | 'system' | 'default';

const SECTION_ENV: Record<MainSectionId, OsEnvironment> = {
  dashboard: 'dashboard',
  network: 'network',
  wireless: 'wireless',
  security: 'security',
  diagnostics: 'diagnostics',
  system: 'system',
};

export function useEnvironment(): OsEnvironment {
  const location = useLocation();
  return useMemo(() => {
    if (location.pathname === '/login') return 'default';
    return SECTION_ENV[getSectionForPath(location.pathname)] ?? 'default';
  }, [location.pathname]);
}
