import { useState } from 'react';
import {
  AppBar,
  Box,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
  Toolbar,
  Typography,
  Avatar,
  Divider,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WifiIcon from '@mui/icons-material/Wifi';
import LanguageIcon from '@mui/icons-material/Language';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useLocation } from 'react-router-dom';
import { DEVICE_MODEL } from '@aerobrry/shared';
import { useAuthStore } from '../stores/authStore';
import { useOperationalStore } from '../stores/operationalStore';
import { useEnterpriseNav } from '../hooks/useEnterpriseNav';
import { acsColors } from '../theme/colors';
import type { MainSection } from '../navigation/enterpriseNav';
import { isNavGroup, flattenSectionEntries, isNavItemActive } from '../navigation/enterpriseNav';

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <Box
      sx={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        bgcolor: ok ? acsColors.success : acsColors.warning,
        boxShadow: ok ? '0 0 6px rgba(34,197,94,0.5)' : '0 0 6px rgba(245,158,11,0.4)',
      }}
    />
  );
}

function SectionDropdown({
  section,
  active,
  pathname,
  onNavigate,
}: {
  section: MainSection;
  active: boolean;
  pathname: string;
  onNavigate: () => void;
}) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);
  const flatItems = flattenSectionEntries(section.items);
  const hasActiveChild = flatItems.some((item) => isNavItemActive(pathname, item.path));

  return (
    <>
      <Box
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.25,
          px: 1.25,
          py: 0.55,
          borderRadius: 8,
          cursor: 'pointer',
          flexShrink: 0,
          border: `1px solid ${active || hasActiveChild ? 'rgba(56,189,248,0.35)' : acsColors.border}`,
          bgcolor: active || hasActiveChild ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.08)',
            borderColor: 'rgba(56,189,248,0.3)',
          },
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.8125rem',
            fontWeight: active || hasActiveChild ? 600 : 500,
            color: active || hasActiveChild ? '#ffffff' : acsColors.textSecondary,
            whiteSpace: 'nowrap',
          }}
        >
          {section.label}
        </Typography>
        <ExpandMoreIcon
          sx={{
            fontSize: 16,
            color: acsColors.textMuted,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        />
      </Box>

      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 200,
              mt: 0.75,
              borderRadius: 2,
              border: `1px solid ${acsColors.border}`,
              bgcolor: acsColors.bgCard,
            },
          },
        }}
      >
        {section.items.map((entry, idx) => {
          if (isNavGroup(entry)) {
            return (
              <Box key={entry.label}>
                {idx > 0 && <Divider sx={{ my: 0.5 }} />}
                <Typography
                  variant="caption"
                  sx={{
                    px: 2,
                    pt: 1,
                    pb: 0.25,
                    display: 'block',
                    color: acsColors.textMuted,
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {entry.label}
                </Typography>
                {entry.items.map((item) => {
                  const selected = isNavItemActive(pathname, item.path);
                  return (
                    <MenuItem
                      key={item.path}
                      component={Link}
                      to={item.path}
                      selected={selected}
                      onClick={() => {
                        setAnchor(null);
                        onNavigate();
                      }}
                      sx={{
                        py: 0.65,
                        pl: 2.5,
                        fontSize: '0.8125rem',
                        '&.Mui-selected': {
                          bgcolor: 'rgba(56,189,248,0.12)',
                          '&:hover': { bgcolor: 'rgba(56,189,248,0.16)' },
                        },
                      }}
                    >
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.8125rem',
                          fontWeight: selected ? 600 : 400,
                        }}
                      />
                    </MenuItem>
                  );
                })}
              </Box>
            );
          }

          const selected = isNavItemActive(pathname, entry.path);
          return (
            <MenuItem
              key={entry.path}
              component={Link}
              to={entry.path}
              selected={selected}
              onClick={() => {
                setAnchor(null);
                onNavigate();
              }}
              sx={{
                py: 0.75,
                fontSize: '0.8125rem',
                '&.Mui-selected': {
                  bgcolor: 'rgba(56,189,248,0.12)',
                  '&:hover': { bgcolor: 'rgba(56,189,248,0.16)' },
                },
              }}
            >
              <ListItemText
                primary={entry.label}
                primaryTypographyProps={{
                  fontSize: '0.8125rem',
                  fontWeight: selected ? 600 : 400,
                }}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

export function Navbar() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const operational = useOperationalStore((s) => s.data);
  const { visibleSections, activeSectionId } = useEnterpriseNav();

  const [mobileNavAnchor, setMobileNavAnchor] = useState<null | HTMLElement>(null);
  const [search, setSearch] = useState('');

  const wanOk = operational?.wan?.status === 'connected';
  const wifiOk =
    operational?.wifi?.status24 === 'active' || operational?.wifi?.status5 === 'active';

  return (
    <AppBar position="sticky" elevation={0} sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
      <Toolbar
        sx={{
          gap: 1,
          minHeight: { xs: 52, md: 48 },
          px: { xs: 1.5, md: 2 },
          flexWrap: 'nowrap',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <Box
          component={Link}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: acsColors.textPrimary }}
          >
            AeroBerry
          </Typography>
          {!isMobile && (
            <Typography
              variant="caption"
              sx={{
                color: acsColors.textMuted,
                fontWeight: 600,
                display: { md: 'none', lg: 'block' },
              }}
            >
              {DEVICE_MODEL}
            </Typography>
          )}
        </Box>

        {/* Main menus — desktop: horizontal dropdown boxes */}
        {!isMobile && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              flex: 1,
              minWidth: 0,
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              mx: 0.5,
              py: 0.25,
            }}
          >
            {visibleSections.map((section) => (
              <SectionDropdown
                key={section.id}
                section={section}
                active={section.id === activeSectionId}
                pathname={location.pathname}
                onNavigate={() => {}}
              />
            ))}
          </Box>
        )}

        {/* Main menus — mobile: single menu button */}
        {isMobile && (
          <>
            <Box sx={{ flex: 1 }} />
            <IconButton size="small" onClick={(e) => setMobileNavAnchor(e.currentTarget)}>
              <MenuIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={mobileNavAnchor}
              open={Boolean(mobileNavAnchor)}
              onClose={() => setMobileNavAnchor(null)}
              slotProps={{ paper: { sx: { minWidth: 260, maxHeight: '70vh' } } }}
            >
              {visibleSections.map((section) => (
                <Box key={section.id}>
                  <Typography
                    variant="caption"
                    sx={{
                      px: 2,
                      pt: 1.5,
                      pb: 0.5,
                      display: 'block',
                      color: acsColors.textMuted,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {section.label}
                  </Typography>
                  {section.items.map((entry) => {
                    if (isNavGroup(entry)) {
                      return (
                        <Box key={entry.label}>
                          <Typography
                            variant="caption"
                            sx={{
                              px: 3,
                              pt: 0.75,
                              pb: 0.25,
                              display: 'block',
                              color: acsColors.textMuted,
                              fontWeight: 600,
                              fontSize: '0.68rem',
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {entry.label}
                          </Typography>
                          {entry.items.map((item) => (
                            <MenuItem
                              key={item.path}
                              component={Link}
                              to={item.path}
                              selected={isNavItemActive(location.pathname, item.path)}
                              onClick={() => setMobileNavAnchor(null)}
                              sx={{ pl: 4 }}
                            >
                              {item.label}
                            </MenuItem>
                          ))}
                        </Box>
                      );
                    }
                    return (
                      <MenuItem
                        key={entry.path}
                        component={Link}
                        to={entry.path}
                        selected={isNavItemActive(location.pathname, entry.path)}
                        onClick={() => setMobileNavAnchor(null)}
                        sx={{ pl: 3 }}
                      >
                        {entry.label}
                      </MenuItem>
                    );
                  })}
                  <Divider sx={{ my: 0.5 }} />
                </Box>
              ))}
            </Menu>
          </>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0,
            ml: isMobile ? 0 : 'auto',
          }}
        >
        {/* Search — desktop */}
        {!isMobile && (
          <TextField
            size="small"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: { md: 120, lg: 160 },
              flexShrink: 0,
              '& .MuiOutlinedInput-root': {
                fontSize: '0.8125rem',
                height: 34,
                bgcolor: 'rgba(255,255,255,0.04)',
                '& fieldset': { borderColor: acsColors.border },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: acsColors.textMuted }} />
                </InputAdornment>
              ),
            }}
          />
        )}

        {/* WAN / Wi-Fi status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LanguageIcon sx={{ fontSize: 16, color: acsColors.textMuted }} />
            <StatusDot ok={wanOk} />
            {!isMobile && (
              <Typography variant="caption" sx={{ color: acsColors.textMuted, fontSize: '0.7rem' }}>
                WAN
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <WifiIcon sx={{ fontSize: 16, color: acsColors.textMuted }} />
            <StatusDot ok={wifiOk} />
            {!isMobile && (
              <Typography variant="caption" sx={{ color: acsColors.textMuted, fontSize: '0.7rem' }}>
                Wi-Fi
              </Typography>
            )}
          </Box>
        </Box>

        {/* User */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
          <Avatar
            sx={{
              width: 30,
              height: 30,
              fontSize: '0.75rem',
              bgcolor: 'rgba(255,255,255,0.08)',
              color: acsColors.textSecondary,
              border: `1px solid ${acsColors.border}`,
            }}
          >
            {(user?.username ?? 'U').charAt(0).toUpperCase()}
          </Avatar>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: acsColors.textPrimary,
              maxWidth: { xs: 64, sm: 120 },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.username}
          </Typography>
          <IconButton
            size="small"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            sx={{ color: acsColors.textMuted }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
