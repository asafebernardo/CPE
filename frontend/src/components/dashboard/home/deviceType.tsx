import SmartphoneIcon from '@mui/icons-material/Smartphone';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import TvIcon from '@mui/icons-material/Tv';
import PrintIcon from '@mui/icons-material/Print';
import TabletMacIcon from '@mui/icons-material/TabletMac';
import RouterIcon from '@mui/icons-material/Router';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import type { SvgIconComponent } from '@mui/icons-material';

export interface DeviceTypeInfo {
  label: string;
  icon: SvgIconComponent;
}

const RULES: { match: RegExp; label: string; icon: SvgIconComponent }[] = [
  { match: /phone|iphone|android|galaxy|pixel|xiaomi|moto|redmi/i, label: 'Smartphone', icon: SmartphoneIcon },
  { match: /ipad|tablet|tab\b/i, label: 'Tablet', icon: TabletMacIcon },
  { match: /tv|roku|chromecast|firestick|appletv|smart-tv|bravia|webos/i, label: 'Smart TV', icon: TvIcon },
  { match: /print|hp-|epson|canon|brother/i, label: 'Printer', icon: PrintIcon },
  { match: /laptop|macbook|notebook|thinkpad|ideapad|vivobook/i, label: 'Laptop', icon: LaptopMacIcon },
  { match: /desktop|pc-|workstation|imac/i, label: 'Desktop', icon: DesktopWindowsIcon },
  { match: /router|repeater|ap-|mesh|extender/i, label: 'Network', icon: RouterIcon },
];

export function getDeviceType(hostname: string, vendor?: string): DeviceTypeInfo {
  const haystack = `${hostname} ${vendor ?? ''}`;
  for (const rule of RULES) {
    if (rule.match.test(haystack)) return { label: rule.label, icon: rule.icon };
  }
  return { label: 'Device', icon: DevicesOtherIcon };
}
