import type { WanStatisticsDto, WanQualityDto, WanStatusPanelDto } from './wan.js';
import type { TopologyGraphDto } from './operational.js';

export type WebSocketEventType =
  | 'dashboard.metrics'
  | 'wan.stats'
  | 'topology.update'
  | 'throughput.tick'
  | 'log.new'
  | 'cwmp.session.started'
  | 'cwmp.session.completed'
  | 'cwmp.command.received'
  | 'device.reboot'
  | 'device.factory-reset';

export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
}

export interface DashboardMetricsPayload {
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
}

export interface WanStatsPayload {
  statistics: WanStatisticsDto;
  quality: WanQualityDto;
  status: WanStatusPanelDto;
}

export interface CwmpCommandPayload {
  method: string;
  parameters?: string[];
}

export interface LogNewPayload {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface TopologyUpdatePayload {
  graph: TopologyGraphDto;
}

export interface ThroughputTickPayload {
  edges: Array<{ id: string; traffic: number }>;
}
