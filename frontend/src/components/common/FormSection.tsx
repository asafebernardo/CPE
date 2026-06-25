import { Box, Paper, Typography, Divider } from '@mui/material';
import { acsColors } from '../../theme/colors';

export function FormSection({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 3,
        p: 2.5,
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: action ? 1 : 0 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ color: acsColors.textPrimary }}>
          {title}
        </Typography>
        {action}
      </Box>
      <Divider sx={{ mb: 2, borderColor: acsColors.border }} />
      {children}
    </Paper>
  );
}
