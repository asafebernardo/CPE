import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useDashboardStore } from '../stores/dashboardStore';
import { useLogsStore } from '../stores/logsStore';
import { useOperationalStore } from '../stores/operationalStore';
import type { ConnectedHostDto, WanStatsPayload } from '@routergui/shared';
import { useWanStore } from '../stores/wanStore';

export function useWebSocket() {
  const token = useAuthStore((s) => s.token);
  const updateMetrics = useDashboardStore((s) => s.updateMetrics);
  const addEntry = useLogsStore((s) => s.addEntry);
  const wsRef = useRef<WebSocket | null>(null);
  const [hosts, setHosts] = useState<ConnectedHostDto[]>([]);

  useEffect(() => {
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'dashboard.metrics') {
          updateMetrics(msg.payload.cpuUsage, msg.payload.memoryUsage, msg.payload.uptime);
          const opData = useOperationalStore.getState().data;
          if (opData) {
            useOperationalStore.getState().setData({
              ...opData,
              system: {
                ...opData.system,
                cpuUsage: msg.payload.cpuUsage,
                memoryUsage: msg.payload.memoryUsage,
                uptime: msg.payload.uptime,
              },
              updatedAt: new Date().toISOString(),
            });
          }
        } else if (msg.type === 'log.new') {
          addEntry({
            id: msg.payload.id,
            type: msg.payload.type,
            message: msg.payload.message,
            createdAt: msg.payload.createdAt,
          });
        } else if (msg.type === 'wan.stats') {
          const payload = msg.payload as WanStatsPayload;
          const wanData = useWanStore.getState().data;
          if (wanData) {
            useWanStore.getState().setFromPayload({
              status: payload.status,
              statistics: payload.statistics,
              quality: payload.quality,
              updatedAt: new Date().toISOString(),
            });
          }
        } else if (msg.type === 'hosts.updated') {
          setHosts(msg.payload);
        }
      } catch {
        // ignore
      }
    };

    return () => ws.close();
  }, [token, updateMetrics, addEntry]);

  return { hosts };
}
