import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Typography,
  Collapse, ListSubheader,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LanguageIcon from '@mui/icons-material/Language';
import LanIcon from '@mui/icons-material/Lan';
import WifiIcon from '@mui/icons-material/Wifi';
import SecurityIcon from '@mui/icons-material/Security';
import ArticleIcon from '@mui/icons-material/Article';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import DevicesIcon from '@mui/icons-material/Devices';
import SpeedIcon from '@mui/icons-material/Speed';
import RouterIcon from '@mui/icons-material/Router';
import FiberIcon from '@mui/icons-material/FiberManualRecord';
import DnsIcon from '@mui/icons-material/Dns';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ForwardIcon from '@mui/icons-material/Forward';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';
import EventIcon from '@mui/icons-material/Event';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import BackupIcon from '@mui/icons-material/Backup';
import InfoIcon from '@mui/icons-material/Info';
import CloudIcon from '@mui/icons-material/Cloud';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useLocation, Link } from 'react-router-dom';
import { RouterGuiLogo } from '../components/common/RouterGuiLogo';
import { DEVICE_MODEL } from '@routergui/shared';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { ADMIN_SECTIONS, USER_MENU, type NavItem } from '../navigation/menuConfig';
import { acsColors } from '../theme/colors';

const DRAWER_WIDTH = 240;

const ICONS: Record<string, React.ReactNode> = {
  '/': <DashboardIcon fontSize="small" />,
  '/internet': <CloudIcon fontSize="small" />,
  '/wifi': <WifiIcon fontSize="small" />,
  '/hosts': <DevicesIcon fontSize="small" />,
  '/diagnostic': <NetworkCheckIcon fontSize="small" />,
  '/system': <InfoIcon fontSize="small" />,
  '/wan': <LanguageIcon fontSize="small" />,
  '/lan': <LanIcon fontSize="small" />,
  '/dhcp': <DnsIcon fontSize="small" />,
  '/routing': <AltRouteIcon fontSize="small" />,
  '/security': <SecurityIcon fontSize="small" />,
  '/firewall': <SecurityIcon fontSize="small" />,
  '/nat': <SwapHorizIcon fontSize="small" />,
  '/port-forward': <ForwardIcon fontSize="small" />,
  '/upnp': <RouterIcon fontSize="small" />,
  '/security-advanced': <SecurityIcon fontSize="small" />,
  '/tr069/management': <SettingsRemoteIcon fontSize="small" />,
  '/tr069/events': <EventIcon fontSize="small" />,
  '/tr069/parameters': <AccountTreeIcon fontSize="small" />,
  '/pon/optical': <FiberIcon fontSize="small" />,
  '/pon/onu': <FiberIcon fontSize="small" />,
  '/speedtest': <SpeedIcon fontSize="small" />,
  '/logs': <ArticleIcon fontSize="small" />,
  '/management': <BackupIcon fontSize="small" />,
};

function NavListItem({ item, selected }: { item: NavItem; selected: boolean }) {
  return (
    <ListItemButton component={Link} to={item.path} selected={selected} sx={{ py: 0.75 }}>
      <ListItemIcon sx={{ minWidth: 36, color: selected ? acsColors.accent : acsColors.textMuted }}>
        {ICONS[item.path] ?? <DashboardIcon fontSize="small" />}
      </ListItemIcon>
      <ListItemText
        primary={item.label}
        primaryTypographyProps={{
          fontSize: '0.8125rem',
          fontWeight: selected ? 600 : 400,
          color: selected ? acsColors.textPrimary : acsColors.textSecondary,
        }}
      />
    </ListItemButton>
  );
}

export function Sidebar() {
  const location = useLocation();
  const role = useAuthStore((s) => s.user?.role ?? 'USER');
  const canAccess = useUiStore((s) => s.canAccess);
  const collapsedSections = useUiStore((s) => s.collapsedSections);
  const toggleSection = useUiStore((s) => s.toggleSection);

  const filterItem = (item: NavItem) => canAccess(item.minRole, item.advancedOnly, role);

  const userItems = USER_MENU.filter(filterItem);

  const sections = ADMIN_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter(filterItem),
    }))
    .filter((s) => s.items.length > 0 && canAccess(s.minRole, s.advancedOnly, role));

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      <Toolbar sx={{ px: 2, py: 1.5 }}>
        <Box>
          <RouterGuiLogo variant="compact" height={32} />
          <Typography variant="caption" sx={{ color: acsColors.textMuted, pl: 0.5 }}>
            {DEVICE_MODEL}
          </Typography>
        </Box>
      </Toolbar>

      {role === 'USER' ? (
        <List dense sx={{ py: 0 }}>
          {userItems.map((item) => (
            <NavListItem
              key={item.path}
              item={item}
              selected={location.pathname === item.path}
            />
          ))}
        </List>
      ) : (
        sections.map((section) => {
          const collapsed = collapsedSections[section.id] ?? false;
          return (
            <List key={section.id} dense sx={{ py: 0 }}>
              <ListSubheader
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  lineHeight: 2,
                  bgcolor: 'transparent',
                  color: acsColors.textMuted,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                }}
                onClick={() => toggleSection(section.id)}
              >
                {section.title}
                <ExpandMoreIcon fontSize="small" sx={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: '0.2s' }} />
              </ListSubheader>
              <Collapse in={!collapsed}>
                {section.items.map((item) => (
                  <NavListItem
                    key={item.path}
                    item={item}
                    selected={location.pathname === item.path}
                  />
                ))}
              </Collapse>
            </List>
          );
        })
      )}
    </Drawer>
  );
}

export const sidebarWidth = DRAWER_WIDTH;
