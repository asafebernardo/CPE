import { useState } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { acsColors } from '../../theme/colors';

export function CollapsiblePanel({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Box
      sx={{
        mb: 2,
        borderRadius: 2,
        border: `1px solid ${acsColors.border}`,
        bgcolor: acsColors.bgCard,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          cursor: 'pointer',
        }}
        onClick={() => setOpen(!open)}
      >
        <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
        <IconButton size="small" sx={{ transform: open ? 'rotate(180deg)' : 'none' }}>
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 2, pb: 2 }}>{children}</Box>
      </Collapse>
    </Box>
  );
}
