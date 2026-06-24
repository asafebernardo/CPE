import { Box, Typography } from '@mui/material';
import type { DeviceInfoPanelDto } from '@routergui/shared';
import { acsColors } from '../../theme/colors';

export function CompactDeviceInfo({ device }: { device: DeviceInfoPanelDto }) {
  const rows = [
    { label: 'Manufacturer', value: device.manufacturer },
    { label: 'Model', value: device.modelName },
    { label: 'Firmware', value: device.softwareVersion },
    { label: 'Serial', value: device.serialNumber },
  ];

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${acsColors.border}`,
        bgcolor: acsColors.bgCard,
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Equipment</Typography>
      {rows.map((r) => (
        <Box key={r.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.35 }}>
          <Typography variant="caption" color="text.secondary">{r.label}</Typography>
          <Typography variant="caption" fontWeight={600} sx={{ fontFamily: r.label === 'Serial' ? 'monospace' : undefined }}>
            {r.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
