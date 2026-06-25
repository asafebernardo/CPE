import { memo, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import type { TopologyGraphDto, TopologyNodeDto } from '@aerobrry/shared';
import { acsColors } from '../../theme/colors';

const CORE_LAYOUT: Record<string, { x: number; y: number }> = {
  internet: { x: 50, y: 12 },
  wan: { x: 50, y: 28 },
  router: { x: 50, y: 48 },
  lan: { x: 28, y: 72 },
  wifi: { x: 50, y: 72 },
  mesh: { x: 72, y: 72 },
};

function layoutNodes(graph: TopologyGraphDto, compact: boolean) {
  const positions = new Map<string, { x: number; y: number }>();
  for (const node of graph.nodes.filter((n) => n.type !== 'device')) {
    if (CORE_LAYOUT[node.id]) positions.set(node.id, CORE_LAYOUT[node.id]);
  }
  if (!compact) {
    graph.nodes
      .filter((n) => n.type === 'device')
      .slice(0, 4)
      .forEach((d, i) => positions.set(d.id, { x: 22 + i * 18, y: 88 }));
  }
  return positions;
}

const NodeDot = memo(function NodeDot({
  node,
  x,
  y,
  onHover,
}: {
  node: TopologyNodeDto;
  x: number;
  y: number;
  onHover: (n: TopologyNodeDto | null) => void;
}) {
  const active = node.status === 'online' || node.status === 'active';
  const isRouter = node.type === 'router';
  const r = isRouter ? 3.2 : node.type === 'device' ? 2 : 2.6;
  const fill = isRouter ? 'var(--rgos-layer-4)' : 'var(--rgos-layer-2)';
  const stroke = active ? (isRouter ? acsColors.textSecondary : acsColors.success) : acsColors.textMuted;

  return (
    <g onMouseEnter={() => onHover(node)} onMouseLeave={() => onHover(null)} style={{ cursor: 'default' }}>
      <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={0.8} />
      {isRouter && (
        <text x={x} y={y - 5} textAnchor="middle" fill={acsColors.textSecondary} fontSize={2.6} fontWeight={500}>
          {node.label.length > 14 ? `${node.label.slice(0, 12)}…` : node.label}
        </text>
      )}
      {!isRouter && node.type !== 'device' && (
        <text x={x} y={y + 5.5} textAnchor="middle" fill={acsColors.textMuted} fontSize={2.2}>
          {node.label}
        </text>
      )}
    </g>
  );
});

export function LiveTopology({
  graph,
  compact = true,
  height = 160,
}: {
  graph: TopologyGraphDto;
  compact?: boolean;
  height?: number;
}) {
  const [hovered, setHovered] = useState<TopologyNodeDto | null>(null);
  const positions = useMemo(() => layoutNodes(graph, compact), [graph, compact]);
  const visibleNodes = compact ? graph.nodes.filter((n) => n.type !== 'device') : graph.nodes.slice(0, 12);
  const visibleEdges = graph.edges.filter((e) => {
    if (compact && e.to.startsWith('device-')) return false;
    return positions.has(e.from) && positions.has(e.to);
  });

  return (
    <Box sx={{ position: 'relative', width: '100%', height }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {visibleEdges.map((edge) => {
          const from = positions.get(edge.from);
          const to = positions.get(edge.to);
          if (!from || !to) return null;
          const t = edge.traffic;
          return (
            <line
              key={edge.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={t > 0 ? 'rgba(94,184,212,0.35)' : 'rgba(255,255,255,0.06)'}
              strokeWidth={0.35 + t * 0.35}
              strokeDasharray={t > 0.1 ? '2 3' : undefined}
              className="rgos-traffic-flow"
              style={{
                animation: t > 0.1 ? `rgos-traffic-flow ${2 - t}s linear infinite` : undefined,
              }}
            />
          );
        })}
        {visibleNodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          return <NodeDot key={node.id} node={node} x={pos.x} y={pos.y} onHover={setHovered} />;
        })}
      </svg>
      {hovered && (
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: 4,
            left: 8,
            color: acsColors.textMuted,
            fontSize: '0.65rem',
            fontFamily: 'var(--rgos-font-mono)',
          }}
        >
          {hovered.label} · {hovered.status}
          {hovered.metrics?.clients != null && ` · ${hovered.metrics.clients} clients`}
        </Typography>
      )}
    </Box>
  );
}
