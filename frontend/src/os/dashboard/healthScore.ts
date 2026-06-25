import type { OperationalDashboardResponse } from '@aerobrry/shared';

export function computeHealthScore(data: OperationalDashboardResponse): number {
  let score = 100;
  if (data.internet.status === 'offline') score -= 35;
  if (data.wifi.status24 === 'disabled' && data.wifi.status5 === 'disabled') score -= 15;
  if (data.system.cpuUsage > 80) score -= 15;
  else if (data.system.cpuUsage > 60) score -= 5;
  if (data.system.memoryUsage > 85) score -= 10;
  else if (data.system.memoryUsage > 70) score -= 5;
  const totalClients = data.topology.lanClientCount + data.topology.wifi24ClientCount + data.topology.wifi5ClientCount;
  if (totalClients === 0) score -= 5;
  return Math.max(0, Math.min(100, score));
}
