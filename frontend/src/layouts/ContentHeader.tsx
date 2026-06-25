import {
  Box,
  Breadcrumbs,
  Typography,
  Link as MuiLink,
  Fade,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { useEnterpriseNav } from '../hooks/useEnterpriseNav';
import { getNavItemLabel } from '../navigation/enterpriseNav';
import { acsColors } from '../theme/colors';

export function ContentHeader() {
  const location = useLocation();
  const { activeSection } = useEnterpriseNav();
  const pageLabel = getNavItemLabel(location.pathname);

  return (
    <Fade in timeout={200}>
      <Box
        sx={{
          px: 3,
          pt: 2.5,
          pb: 1,
          borderBottom: `1px solid ${acsColors.border}`,
        }}
      >
        <Breadcrumbs
          separator="/"
          sx={{
            '& .MuiBreadcrumbs-separator': {
              color: acsColors.textMuted,
              mx: 0.75,
              fontSize: '0.75rem',
            },
          }}
        >
          <MuiLink
            component={Link}
            to="/"
            underline="hover"
            sx={{
              fontSize: '0.75rem',
              color: acsColors.textMuted,
              '&:hover': { color: acsColors.textSecondary },
            }}
          >
            {activeSection?.label ?? 'Dashboard'}
          </MuiLink>
          {pageLabel && (
            <Typography
              variant="caption"
              sx={{ fontSize: '0.75rem', color: acsColors.textSecondary, fontWeight: 500 }}
            >
              {pageLabel}
            </Typography>
          )}
        </Breadcrumbs>
      </Box>
    </Fade>
  );
}
