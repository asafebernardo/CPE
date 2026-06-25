import { useMemo } from 'react';
import type { OperationalDashboardResponse } from '@aerobrry/shared';
import { computeHealthScore } from './healthScore';

export interface OsAlert {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export function useSmartAlerts(data: OperationalDashboardResponse | null, ponEnabled: boolean): OsAlert[] {
  return useMemo(() => {
    if (!data) return [];
    const alerts: OsAlert[] = [];
    if (data.internet.status === 'offline') {
      alerts.push({ id: 'wan-down', severity: 'error', message: 'Internet connection offline' });
    }
    if (data.system.cpuUsage > 80) {
      alerts.push({ id: 'cpu-high', severity: 'warning', message: `High CPU usage (${Math.round(data.system.cpuUsage)}%)` });
    }
    if (data.system.memoryUsage > 85) {
      alerts.push({ id: 'mem-high', severity: 'warning', message: `High memory usage (${Math.round(data.system.memoryUsage)}%)` });
    }
    if (data.acs.configured && data.acs.status === 'idle' && !data.acs.lastInform) {
      alerts.push({ id: 'acs-idle', severity: 'info', message: 'ACS configured — awaiting first Inform' });
    }
    if (ponEnabled && data.leds.find((l) => l.id === 'pon')?.state === 'error') {
      alerts.push({ id: 'pon-signal', severity: 'warning', message: 'Optical signal degraded' });
    }
    return alerts;
  }, [data, ponEnabled]);
}

export { computeHealthScore };
