import { Box, IconButton, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Link, useLocation } from 'react-router-dom';
import { useEnterpriseNav } from '../../hooks/useEnterpriseNav';
import { isNavItemActive, flattenSectionEntries } from '../../navigation/enterpriseNav';
import { useUiStore } from '../../stores/uiStore';
import { acsColors } from '../../theme/colors';
import { getNavItemLabel } from '../../navigation/enterpriseNav';

export function ContextPanel() {
  const location = useLocation();
  const { activeSection, submenuItems } = useEnterpriseNav();
  const collapsed = useUiStore((s) => s.contextPanelCollapsed);
  const toggle = useUiStore((s) => s.toggleContextPanel);

  if (!activeSection) return null;

  const pageLabel = getNavItemLabel(location.pathname);

  return (
    <Box
      sx={{
        width: collapsed ? 0 : 'var(--rgos-context-width)',
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 0.2s ease',
        bgcolor: 'var(--rgos-layer-1)',
        borderRight: collapsed ? 'none' : `1px solid ${acsColors.border}`,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.25,
          py: 1,
          minWidth: 'var(--rgos-context-width)',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              color: acsColors.textMuted,
              fontWeight: 600,
              fontSize: '0.65rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'block',
            }}
          >
            {activeSection.label}
          </Typography>
          {pageLabel && (
            <Typography variant="caption" sx={{ color: acsColors.textSecondary, fontSize: '0.7rem' }} noWrap>
              {pageLabel}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={toggle} sx={{ color: acsColors.textMuted, p: 0.5 }}>
          {collapsed ? <ChevronRightIcon sx={{ fontSize: 16 }} /> : <ChevronLeftIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Box>
      <List dense disablePadding sx={{ minWidth: 'var(--rgos-context-width)', px: 0.75, pb: 1 }}>
        {submenuItems.map((item) => {
          const active = isNavItemActive(location.pathname, item.path);
          return (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              selected={active}
              sx={{
                borderRadius: '6px',
                py: 0.5,
                mb: 0.15,
                minHeight: 32,
                '&.Mui-selected': {
                  bgcolor: 'var(--rgos-layer-3)',
                  '& .MuiListItemText-primary': { color: acsColors.textPrimary, fontWeight: 600 },
                },
              }}
            >
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.75rem',
                  fontWeight: active ? 600 : 450,
                  color: active ? acsColors.textPrimary : acsColors.textSecondary,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}

export function MobileNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const { visibleSections } = useEnterpriseNav();

  if (!open) return null;

  return (
    <Box
      onClick={onClose}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        bgcolor: 'rgba(0,0,0,0.6)',
        display: { md: 'none' },
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: 260,
          height: '100%',
          bgcolor: 'var(--rgos-layer-1)',
          borderRight: `1px solid ${acsColors.border}`,
          overflow: 'auto',
        }}
      >
        {visibleSections.map((section) => (
          <Box key={section.id} sx={{ py: 0.75 }}>
            <Typography
              variant="caption"
              sx={{ px: 1.5, color: acsColors.textMuted, fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}
            >
              {section.label}
            </Typography>
            <List dense disablePadding>
              {flattenSectionEntries(section.items).map((item) => (
                <ListItemButton
                  key={item.path}
                  component={Link}
                  to={item.path}
                  onClick={onClose}
                  selected={isNavItemActive(location.pathname, item.path)}
                  sx={{ py: 0.5, minHeight: 32 }}
                >
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.8125rem' }} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
