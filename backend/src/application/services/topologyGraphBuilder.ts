import type {
  TopologyGraphDto,
  TopologyNodeDto,
  TopologyEdgeDto,
} from '@aerobrry/shared';

interface BuildGraphInput {
  modelName: string;
  wanConnected: boolean;
  lanClients: number;
  wifi24Clients: number;
  wifi5Clients: number;
  wlan24Enabled: boolean;
  wlan5Enabled: boolean;
  meshEnabled: boolean;
  hosts: Array<{ id: string; hostname: string; interface: string; band?: string | null; rssi?: number | null }>;
}

export function buildTopologyGraph(input: BuildGraphInput): TopologyGraphDto {
  const nodes: TopologyNodeDto[] = [];
  const edges: TopologyEdgeDto[] = [];

  const internetStatus = input.wanConnected ? 'online' : 'offline';
  nodes.push({ id: 'internet', type: 'internet', label: 'Internet', status: internetStatus });
  nodes.push({
    id: 'wan',
    type: 'wan',
    label: 'WAN',
    status: input.wanConnected ? 'active' : 'offline',
    metrics: { throughput: input.wanConnected ? 0.4 + Math.random() * 0.4 : 0 },
  });
  nodes.push({
    id: 'router',
    type: 'router',
    label: input.modelName,
    status: 'active',
    metrics: { throughput: 0.5 },
  });

  edges.push({ id: 'e-internet-wan', from: 'internet', to: 'wan', traffic: input.wanConnected ? 0.6 : 0 });
  edges.push({ id: 'e-wan-router', from: 'wan', to: 'router', traffic: input.wanConnected ? 0.7 : 0 });

  nodes.push({
    id: 'lan',
    type: 'lan',
    label: 'LAN',
    status: input.lanClients > 0 ? 'active' : 'idle',
    metrics: { clients: input.lanClients },
  });
  edges.push({
    id: 'e-router-lan',
    from: 'router',
    to: 'lan',
    traffic: input.lanClients > 0 ? Math.min(1, input.lanClients * 0.15) : 0.05,
  });

  const wifiClients = input.wifi24Clients + input.wifi5Clients;
  nodes.push({
    id: 'wifi',
    type: 'wifi',
    label: 'Wi-Fi',
    status: input.wlan24Enabled || input.wlan5Enabled ? 'active' : 'offline',
    metrics: { clients: wifiClients },
  });
  edges.push({
    id: 'e-router-wifi',
    from: 'router',
    to: 'wifi',
    traffic: wifiClients > 0 ? Math.min(1, wifiClients * 0.12) : 0.05,
  });

  if (input.meshEnabled) {
    nodes.push({ id: 'mesh', type: 'mesh', label: 'Mesh', status: 'active', metrics: { throughput: 0.35 } });
    edges.push({ id: 'e-router-mesh', from: 'router', to: 'mesh', traffic: 0.3 });
  }

  const sampleHosts = input.hosts.slice(0, 6);
  for (const host of sampleHosts) {
    const nodeId = `device-${host.id}`;
    const parent = host.interface === 'lan' ? 'lan' : 'wifi';
    nodes.push({
      id: nodeId,
      type: 'device',
      label: host.hostname,
      status: 'online',
      metrics: { rssi: host.rssi ?? undefined, throughput: 0.2 + Math.random() * 0.3 },
    });
    edges.push({
      id: `e-${parent}-${nodeId}`,
      from: parent,
      to: nodeId,
      traffic: 0.15 + Math.random() * 0.35,
    });
  }

  return {
    nodes,
    edges,
    lanClientCount: input.lanClients,
    wifi24ClientCount: input.wifi24Clients,
    wifi5ClientCount: input.wifi5Clients,
  };
}

export function tickEdgeTraffic(graph: TopologyGraphDto): TopologyGraphDto {
  return {
    ...graph,
    edges: graph.edges.map((e) => ({
      ...e,
      traffic: e.traffic > 0 ? Math.max(0.05, Math.min(1, e.traffic + (Math.random() - 0.5) * 0.15)) : 0,
    })),
  };
}
