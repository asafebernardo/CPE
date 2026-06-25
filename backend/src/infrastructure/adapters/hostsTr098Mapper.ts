import { TR098_LAN_HOSTS, type CwmpParameterValue } from '@routergui/shared';

export interface HostSource {
  index: number;
  macAddress: string;
  ipAddress: string;
  hostname: string;
  interface: string;
  band: string | null;
  rssi: number | null;
  leaseExpiry: Date | null;
}

export function buildHostsTr098Parameters(hosts: HostSource[]): CwmpParameterValue[] {
  const params: CwmpParameterValue[] = [
    { name: TR098_LAN_HOSTS.HOST_NUMBER_OF_ENTRIES, value: String(hosts.length) },
  ];

  for (const host of hosts) {
    const p = TR098_LAN_HOSTS.host(host.index);
    const leaseRemaining = host.leaseExpiry
      ? Math.max(0, Math.floor((host.leaseExpiry.getTime() - Date.now()) / 1000))
      : 0;
    const ifaceType = host.interface === 'wifi' || host.band ? '802.11' : 'Ethernet';

    params.push(
      { name: p.ACTIVE, value: 'true' },
      { name: p.IP_ADDRESS, value: host.ipAddress },
      { name: p.MAC_ADDRESS, value: host.macAddress },
      { name: p.HOST_NAME, value: host.hostname },
      { name: p.INTERFACE_TYPE, value: ifaceType },
      { name: p.LAYER2_INTERFACE, value: host.interface },
      { name: p.LEASE_TIME_REMAINING, value: String(leaseRemaining) },
      { name: p.X_BAND, value: host.band ?? '' },
      { name: p.X_RSSI, value: host.rssi != null ? String(host.rssi) : '' },
    );
  }

  return params;
}
