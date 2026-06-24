import { Box, Button, CircularProgress } from '@mui/material';

interface WanQuickActionsProps {
  loading: boolean;
  onAction: (action: string) => void;
}

const ACTIONS = [
  { key: 'renew-dhcp', label: 'Renew DHCP' },
  { key: 'release-dhcp', label: 'Release DHCP' },
  { key: 'reconnect', label: 'Reconnect WAN' },
  { key: 'test-connection', label: 'Test Connection' },
  { key: 'ping-gateway', label: 'Ping Gateway' },
];

export function WanQuickActions({ loading, onAction }: WanQuickActionsProps) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {ACTIONS.map((a) => (
        <Button
          key={a.key}
          size="small"
          variant="outlined"
          disabled={loading}
          onClick={() => onAction(a.key)}
        >
          {loading ? <CircularProgress size={16} /> : a.label}
        </Button>
      ))}
    </Box>
  );
}
