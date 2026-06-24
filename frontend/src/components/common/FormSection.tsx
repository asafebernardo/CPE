import { Box, Typography, Divider } from '@mui/material';
import { acsColors } from '../../theme/colors';

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        mb: 3,
        p: 2.5,
        borderRadius: 2,
        border: `1px solid ${acsColors.border}`,
        bgcolor: acsColors.bgCard,
      }}
    >
      <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: acsColors.textPrimary }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 2, borderColor: acsColors.border }} />
      {children}
    </Box>
  );
}
