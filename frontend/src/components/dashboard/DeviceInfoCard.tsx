import { Box, Typography, Divider } from '@mui/material';
import type { DeviceInfoPanelDto } from '@routergui/shared';
import { acsColors } from '../../theme/colors';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export function DeviceInfoCard({ device }: { device: DeviceInfoPanelDto }) {
  const rows = [
    { label: 'Manufacturer', value: device.manufacturer },
    { label: 'Model', value: device.modelName },
    { label: 'System', value: device.osName },
    { label: 'Firmware', value: device.softwareVersion },
    { label: 'Hardware', value: device.hardwareVersion },
    { label: 'Serial', value: device.serialNumber },
    { label: 'Uptime', value: formatUptime(device.uptime) },
  ];

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: `1px solid ${acsColors.border}`,
        bgcolor: acsColors.bgCard,
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Equipment Information</Typography>
      <Divider sx={{ mb: 2, borderColor: acsColors.border }} />
      {rows.map((r) => (
        <Box key={r.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
          <Typography variant="body2" color="text.secondary">{r.label}</Typography>
          <Typography variant="body2" fontWeight={500} sx={{ fontFamily: r.label === 'Serial' ? 'monospace' : undefined }}>
            {r.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
