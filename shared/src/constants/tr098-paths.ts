export const TR098_ROOT = 'InternetGatewayDevice';

export const TR098_DEVICE_INFO = {
  MANUFACTURER: `${TR098_ROOT}.DeviceInfo.Manufacturer`,
  MODEL_NAME: `${TR098_ROOT}.DeviceInfo.ModelName`,
  SOFTWARE_VERSION: `${TR098_ROOT}.DeviceInfo.SoftwareVersion`,
  HARDWARE_VERSION: `${TR098_ROOT}.DeviceInfo.HardwareVersion`,
  SERIAL_NUMBER: `${TR098_ROOT}.DeviceInfo.SerialNumber`,
  UPTIME: `${TR098_ROOT}.DeviceInfo.UpTime`,
} as const;

export const TR098_MANAGEMENT_SERVER = {
  URL: `${TR098_ROOT}.ManagementServer.URL`,
  USERNAME: `${TR098_ROOT}.ManagementServer.Username`,
  PASSWORD: `${TR098_ROOT}.ManagementServer.Password`,
  PERIODIC_INFORM_ENABLE: `${TR098_ROOT}.ManagementServer.PeriodicInformEnable`,
  PERIODIC_INFORM_INTERVAL: `${TR098_ROOT}.ManagementServer.PeriodicInformInterval`,
  CONNECTION_REQUEST_URL: `${TR098_ROOT}.ManagementServer.ConnectionRequestURL`,
  CONNECTION_REQUEST_USERNAME: `${TR098_ROOT}.ManagementServer.ConnectionRequestUsername`,
  CONNECTION_REQUEST_PASSWORD: `${TR098_ROOT}.ManagementServer.ConnectionRequestPassword`,
} as const;

export const TR098_TIME = {
  ENABLE: `${TR098_ROOT}.Time.Enable`,
  NTP_SERVER_1: `${TR098_ROOT}.Time.NTPServer1`,
  NTP_SERVER_2: `${TR098_ROOT}.Time.NTPServer2`,
  LOCAL_TIME_ZONE: `${TR098_ROOT}.Time.LocalTimeZone`,
  CURRENT_LOCAL_TIME: `${TR098_ROOT}.Time.CurrentLocalTime`,
  STATUS: `${TR098_ROOT}.Time.Status`,
} as const;

/** Vendor extensions used by IXC presets and AeroBerry GUI sync */
export const TR098_X_ROUTERGUI = {
  WAN_DNS_AUTO: `${TR098_ROOT}.X_RouterGui_WANDNSAuto`,
  LAN_DNS_AUTO: `${TR098_ROOT}.X_RouterGui_LANDNSAuto`,
  IPV6_ENABLED: `${TR098_ROOT}.X_RouterGui_IPv6Enabled`,
  WEB_MANAGEMENT_ENABLED: `${TR098_ROOT}.X_RouterGui_WebManagementEnabled`,
  REMOTE_ACCESS_ENABLED: `${TR098_ROOT}.X_RouterGui_RemoteAccessEnabled`,
  REMOTE_ACCESS_PORT: `${TR098_ROOT}.X_RouterGui_RemoteAccessPort`,
  WEB_LOCAL_PORT: `${TR098_ROOT}.X_RouterGui_WebLocalPort`,
  WEB_HTTPS_ENABLED: `${TR098_ROOT}.X_RouterGui_WebHttpsEnabled`,
  WEB_HTTPS_PORT: `${TR098_ROOT}.X_RouterGui_WebHttpsPort`,
  WEB_ADMIN_USERNAME: `${TR098_ROOT}.X_RouterGui_WebAdminUsername`,
  WEB_ADMIN_PASSWORD: `${TR098_ROOT}.X_RouterGui_WebAdminPassword`,
  WEB_ADMIN_ENABLED: `${TR098_ROOT}.X_RouterGui_WebAdminEnabled`,
  WAN_DOWNLOAD_BANDWIDTH_MBPS: `${TR098_ROOT}.WANDevice.1.WANCommonInterfaceConfig.X_RouterGui_DownloadBandwidthMbps`,
  WAN_UPLOAD_BANDWIDTH_MBPS: `${TR098_ROOT}.WANDevice.1.WANCommonInterfaceConfig.X_RouterGui_UploadBandwidthMbps`,
  OPTICAL_RX_POWER: `${TR098_ROOT}.X_RouterGui_OpticalRxPower`,
  OPTICAL_TX_POWER: `${TR098_ROOT}.X_RouterGui_OpticalTxPower`,
  OPTICAL_TEMPERATURE: `${TR098_ROOT}.X_RouterGui_OpticalTemperature`,
  PON_STATUS: `${TR098_ROOT}.X_RouterGui_PonStatus`,
  OLT_ID: `${TR098_ROOT}.X_RouterGui_OltId`,
  WAN_OPTICAL_RX_POWER: `${TR098_ROOT}.WANDevice.1.X_RouterGui_OpticalRxPower`,
  WAN_OPTICAL_TX_POWER: `${TR098_ROOT}.WANDevice.1.X_RouterGui_OpticalTxPower`,
} as const;

/** IPv6 stack — LAN, WAN global and per-connection leaves use wanTr098Mapper helpers */
export const TR098_IPV6 = {
  LAN_ENABLED: `${TR098_ROOT}.X_RouterGui_LANIPv6Enabled`,
  LAN_PREFIX: `${TR098_ROOT}.X_RouterGui_LANIPv6Prefix`,
  LAN_DNS_SERVERS: `${TR098_ROOT}.X_RouterGui_LANIPv6DNSServers`,
  LAN_DHCPV6_ENABLED: `${TR098_ROOT}.X_RouterGui_LANIPv6DHCPv6Enabled`,
  LAN_SLAAC_ENABLED: `${TR098_ROOT}.X_RouterGui_LANIPv6SLAACEnabled`,
  LAN_PREFIX_DELEGATION: `${TR098_ROOT}.X_RouterGui_LANIPv6PrefixDelegation`,
  WAN_MODE: `${TR098_ROOT}.X_RouterGui_WANIPv6Mode`,
  WAN_ADDRESS: `${TR098_ROOT}.X_RouterGui_WANIPv6Address`,
  WAN_GATEWAY: `${TR098_ROOT}.X_RouterGui_WANIPv6Gateway`,
  WAN_DNS: `${TR098_ROOT}.X_RouterGui_WANIPv6Dns`,
  WAN_PREFIX_LENGTH: `${TR098_ROOT}.X_RouterGui_WANIPv6PrefixLength`,
  WAN_DNS_AUTO: `${TR098_ROOT}.X_RouterGui_WANIPv6DNSAuto`,
} as const;

export function tr098WanIpv6Leaves(connDeviceIndex: number, kind: 'ip' | 'ppp', idx = 1) {
  const conn = kind === 'ppp' ? `WANPPPConnection.${idx}` : `WANIPConnection.${idx}`;
  const base = `${TR098_ROOT}.WANDevice.1.WANConnectionDevice.${connDeviceIndex}.${conn}`;
  return {
    ENABLED: `${base}.X_RouterGui_IPv6Enabled`,
    ADDRESS: `${base}.X_RouterGui_IPv6Address`,
    GATEWAY: `${base}.X_RouterGui_IPv6Gateway`,
    DNS_SERVERS: `${base}.X_RouterGui_IPv6DNSServers`,
    PREFIX_LENGTH: `${base}.X_RouterGui_IPv6PrefixLength`,
    ACCESS_MODE: `${base}.X_RouterGui_AccessMode`,
  };
}

export const TR098_WAN_DEVICE = {
  WAN_DEVICE_NUMBER_OF_ENTRIES: `${TR098_ROOT}.WANDeviceNumberOfEntries`,
  WAN_CONNECTION_NUMBER_OF_ENTRIES: (wanDeviceIndex = 1) =>
    `${TR098_ROOT}.WANDevice.${wanDeviceIndex}.WANConnectionNumberOfEntries`,
  wanCommon: (wanDeviceIndex = 1) => {
    const base = `${TR098_ROOT}.WANDevice.${wanDeviceIndex}.WANCommonInterfaceConfig`;
    return {
      ENABLED_FOR_INTERNET: `${base}.EnabledForInternet`,
      WAN_ACCESS_TYPE: `${base}.WANAccessType`,
      PHYSICAL_LINK_STATUS: `${base}.PhysicalLinkStatus`,
      TOTAL_BYTES_RECEIVED: `${base}.TotalBytesReceived`,
      TOTAL_BYTES_SENT: `${base}.TotalBytesSent`,
    };
  },
  wanEthernet: (wanDeviceIndex = 1) => {
    const base = `${TR098_ROOT}.WANDevice.${wanDeviceIndex}.WANEthernetInterfaceConfig.1`;
    return {
      ENABLE: `${base}.Enable`,
      STATUS: `${base}.Status`,
      MAC_ADDRESS: `${base}.MACAddress`,
      MAX_BIT_RATE: `${base}.MaxBitRate`,
      DUPLEX_MODE: `${base}.DuplexMode`,
    };
  },
} as const;

export function tr098WanConnectionDevice(connDeviceIndex: number) {
  const base = `${TR098_ROOT}.WANDevice.1.WANConnectionDevice.${connDeviceIndex}`;
  return {
    base,
    PPP_NUMBER_OF_ENTRIES: `${base}.WANPPPConnectionNumberOfEntries`,
    IP_NUMBER_OF_ENTRIES: `${base}.WANIPConnectionNumberOfEntries`,
    pppObjectPath: `${base}.WANPPPConnection.`,
    ipObjectPath: `${base}.WANIPConnection.`,
    ppp: (idx: number) => {
      const b = `${base}.WANPPPConnection.${idx}`;
      return {
        ENABLE: `${b}.Enable`,
        NAME: `${b}.Name`,
        CONNECTION_TYPE: `${b}.ConnectionType`,
        USERNAME: `${b}.Username`,
        PASSWORD: `${b}.Password`,
        CONNECTION_STATUS: `${b}.ConnectionStatus`,
        EXTERNAL_IP: `${b}.ExternalIPAddress`,
        DEFAULT_GATEWAY: `${b}.DefaultGateway`,
        DNS_SERVERS: `${b}.DNSServers`,
        MAC_ADDRESS: `${b}.MACAddress`,
        NAT_ENABLED: `${b}.NATEnabled`,
        PPPoE_SERVICE_NAME: `${b}.PPPoEServiceName`,
        PPPoE_AC_NAME: `${b}.PPPoEACName`,
        MAX_MRU_SIZE: `${b}.MaxMRUSize`,
        X_VLAN_ENABLED: `${b}.X_RouterGui_VLANEnabled`,
        X_VLAN_ID: `${b}.X_RouterGui_VLANID`,
        X_SERVICE_TYPE: `${b}.X_RouterGui_ServiceType`,
      };
    },
    ip: (idx: number) => {
      const b = `${base}.WANIPConnection.${idx}`;
      return {
        ENABLE: `${b}.Enable`,
        NAME: `${b}.Name`,
        CONNECTION_TYPE: `${b}.ConnectionType`,
        ADDRESSING_TYPE: `${b}.AddressingType`,
        CONNECTION_STATUS: `${b}.ConnectionStatus`,
        EXTERNAL_IP: `${b}.ExternalIPAddress`,
        SUBNET_MASK: `${b}.SubnetMask`,
        DEFAULT_GATEWAY: `${b}.DefaultGateway`,
        DNS_SERVERS: `${b}.DNSServers`,
        MAC_ADDRESS: `${b}.MACAddress`,
        NAT_ENABLED: `${b}.NATEnabled`,
        MAX_MTU_SIZE: `${b}.MaxMTUSize`,
        X_VLAN_ENABLED: `${b}.X_RouterGui_VLANEnabled`,
        X_VLAN_ID: `${b}.X_RouterGui_VLANID`,
        X_SERVICE_TYPE: `${b}.X_RouterGui_ServiceType`,
      };
    },
  };
}

export const TR098_WAN = {
  CONNECTION_TYPE: `${TR098_ROOT}.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ConnectionType`,
  EXTERNAL_IP: `${TR098_ROOT}.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress`,
  SUBNET_MASK: `${TR098_ROOT}.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.SubnetMask`,
  DEFAULT_GATEWAY: `${TR098_ROOT}.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.DefaultGateway`,
  DNS_SERVERS: `${TR098_ROOT}.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.DNSServers`,
  MAC_ADDRESS: `${TR098_ROOT}.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.MACAddress`,
} as const;

export const TR098_LAN = {
  IP_ADDRESS: `${TR098_ROOT}.LANDevice.1.LANHostConfigManagement.IPInterface.1.IPInterfaceIPAddress`,
  SUBNET_MASK: `${TR098_ROOT}.LANDevice.1.LANHostConfigManagement.IPInterface.1.IPInterfaceSubnetMask`,
  DHCP_ENABLE: `${TR098_ROOT}.LANDevice.1.LANHostConfigManagement.DHCPServerEnable`,
  MIN_ADDRESS: `${TR098_ROOT}.LANDevice.1.LANHostConfigManagement.MinAddress`,
  MAX_ADDRESS: `${TR098_ROOT}.LANDevice.1.LANHostConfigManagement.MaxAddress`,
  DHCP_SERVER_CONFIGURABLE: `${TR098_ROOT}.LANDevice.1.LANHostConfigManagement.DHCPServerConfigurable`,
  DHCP_LEASE_TIME: `${TR098_ROOT}.LANDevice.1.LANHostConfigManagement.DHCPLeaseTime`,
  LAN_SUBNET_MASK: `${TR098_ROOT}.LANDevice.1.LANHostConfigManagement.SubnetMask`,
  DNS_SERVERS: `${TR098_ROOT}.LANDevice.1.LANHostConfigManagement.DNSServers`,
  DOMAIN_NAME: `${TR098_ROOT}.LANDevice.1.LANHostConfigManagement.DomainName`,
  IP_Routers: `${TR098_ROOT}.LANDevice.1.LANHostConfigManagement.IPRouters`,
} as const;

export const TR098_LAN_HOSTS = {
  HOST_NUMBER_OF_ENTRIES: `${TR098_ROOT}.LANDevice.1.Hosts.HostNumberOfEntries`,
  host: (index: number) => {
    const b = `${TR098_ROOT}.LANDevice.1.Hosts.Host.${index}`;
    return {
      ACTIVE: `${b}.Active`,
      IP_ADDRESS: `${b}.IPAddress`,
      MAC_ADDRESS: `${b}.MACAddress`,
      HOST_NAME: `${b}.HostName`,
      INTERFACE_TYPE: `${b}.InterfaceType`,
      LAYER2_INTERFACE: `${b}.Layer2Interface`,
      LEASE_TIME_REMAINING: `${b}.LeaseTimeRemaining`,
      X_BAND: `${b}.X_RouterGui_Band`,
      X_RSSI: `${b}.X_RouterGui_RSSI`,
    };
  },
} as const;

export const TR098_LAN_ETHERNET = {
  NUMBER_OF_ENTRIES: `${TR098_ROOT}.LANDevice.1.LANEthernetInterfaceConfigNumberOfEntries`,
  port: (index: number) => {
    const b = `${TR098_ROOT}.LANDevice.1.LANEthernetInterfaceConfig.${index}`;
    return {
      ENABLE: `${b}.Enable`,
      STATUS: `${b}.Status`,
      MAC_ADDRESS: `${b}.MACAddress`,
      MAX_BIT_RATE: `${b}.MaxBitRate`,
      DUPLEX_MODE: `${b}.DuplexMode`,
      NAME: `${b}.Name`,
    };
  },
} as const;

export const TR098_WLAN = {
  NUMBER_OF_ENTRIES: `${TR098_ROOT}.LANDevice.1.WLANConfigurationNumberOfEntries`,
  wlan: (index: number) => ({
    ENABLE: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.Enable`,
    SSID: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.SSID`,
    CHANNEL: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.Channel`,
    STANDARD: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.Standard`,
    BEACON_TYPE: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.BeaconType`,
    WPA_ENCRYPTION: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.WPAEncryptionModes`,
    KEY_PASSPHRASE: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.PreSharedKey.1.KeyPassphrase`,
    /** IXC ACS shorthand (without PreSharedKey.1) */
    KEY_PASSPHRASE_SHORT: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.KeyPassphrase`,
    RADIO_ENABLED: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.RadioEnabled`,
    SSID_ADVERTISEMENT: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.SSIDAdvertisementEnabled`,
    MAX_BIT_RATE: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.MaxBitRate`,
    X_BAND: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.X_RouterGui_Band`,
    X_CHANNEL_WIDTH: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.X_RouterGui_ChannelWidth`,
    X_INTERFACE_TYPE: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.X_RouterGui_InterfaceType`,
    X_INTERFACE_ID: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.X_RouterGui_InterfaceId`,
    X_ISOLATION: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.X_RouterGui_IsolationEnable`,
    X_VLAN_ID: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.X_RouterGui_VLANID`,
    X_BANDWIDTH_LIMIT: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.X_RouterGui_BandwidthLimitMbps`,
    X_MESH_LINK_STATUS: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.X_RouterGui_MeshLinkStatus`,
    X_MESH_LINK_QUALITY: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.X_RouterGui_MeshLinkQuality`,
  }),
  wlan24: (index: number) => ({
    ENABLE: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.Enable`,
    SSID: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.SSID`,
    CHANNEL: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.Channel`,
    STANDARD: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.Standard`,
    BEACON_TYPE: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.BeaconType`,
    WPA_ENCRYPTION: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.WPAEncryptionModes`,
    KEY_PASSPHRASE: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.PreSharedKey.1.KeyPassphrase`,
    /** IXC ACS shorthand (without PreSharedKey.1) */
    KEY_PASSPHRASE_SHORT: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.KeyPassphrase`,
  }),
} as const;

export const TR098_DIAGNOSTICS = {
  IP_PING: {
    ROOT: `${TR098_ROOT}.IPPingDiagnostics`,
    DIAGNOSTICS_STATE: `${TR098_ROOT}.IPPingDiagnostics.DiagnosticsState`,
    INTERFACE: `${TR098_ROOT}.IPPingDiagnostics.Interface`,
    HOST: `${TR098_ROOT}.IPPingDiagnostics.Host`,
    NUMBER_OF_REPETITIONS: `${TR098_ROOT}.IPPingDiagnostics.NumberOfRepetitions`,
    TIMEOUT: `${TR098_ROOT}.IPPingDiagnostics.Timeout`,
    DATA_BLOCK_SIZE: `${TR098_ROOT}.IPPingDiagnostics.DataBlockSize`,
    SUCCESS_COUNT: `${TR098_ROOT}.IPPingDiagnostics.SuccessCount`,
    FAILURE_COUNT: `${TR098_ROOT}.IPPingDiagnostics.FailureCount`,
    AVERAGE_RESPONSE_TIME: `${TR098_ROOT}.IPPingDiagnostics.AverageResponseTime`,
    MINIMUM_RESPONSE_TIME: `${TR098_ROOT}.IPPingDiagnostics.MinimumResponseTime`,
    MAXIMUM_RESPONSE_TIME: `${TR098_ROOT}.IPPingDiagnostics.MaximumResponseTime`,
  },
  TRACE_ROUTE: {
    ROOT: `${TR098_ROOT}.TraceRouteDiagnostics`,
    DIAGNOSTICS_STATE: `${TR098_ROOT}.TraceRouteDiagnostics.DiagnosticsState`,
    INTERFACE: `${TR098_ROOT}.TraceRouteDiagnostics.Interface`,
    HOST: `${TR098_ROOT}.TraceRouteDiagnostics.Host`,
    NUMBER_OF_TRIES: `${TR098_ROOT}.TraceRouteDiagnostics.NumberOfTries`,
    TIMEOUT: `${TR098_ROOT}.TraceRouteDiagnostics.Timeout`,
    DATA_BLOCK_SIZE: `${TR098_ROOT}.TraceRouteDiagnostics.DataBlockSize`,
    MAX_HOP_COUNT: `${TR098_ROOT}.TraceRouteDiagnostics.MaxHopCount`,
    RESPONSE_TIME: `${TR098_ROOT}.TraceRouteDiagnostics.ResponseTime`,
    ROUTE_HOPS_NUMBER_OF_ENTRIES: `${TR098_ROOT}.TraceRouteDiagnostics.RouteHopsNumberOfEntries`,
    hop: (index: number) => ({
      HOST: `${TR098_ROOT}.TraceRouteDiagnostics.RouteHops.${index}.HopHost`,
      RT_TIMES: `${TR098_ROOT}.TraceRouteDiagnostics.RouteHops.${index}.HopRTTimes`,
    }),
  },
  DOWNLOAD: {
    ROOT: `${TR098_ROOT}.DownloadDiagnostics`,
    DIAGNOSTICS_STATE: `${TR098_ROOT}.DownloadDiagnostics.DiagnosticsState`,
    INTERFACE: `${TR098_ROOT}.DownloadDiagnostics.Interface`,
    DOWNLOAD_URL: `${TR098_ROOT}.DownloadDiagnostics.DownloadURL`,
    DSCP: `${TR098_ROOT}.DownloadDiagnostics.DSCP`,
    ETHERNET_PRIORITY: `${TR098_ROOT}.DownloadDiagnostics.EthernetPriority`,
    ROM_TIME: `${TR098_ROOT}.DownloadDiagnostics.ROMTime`,
    BOM_TIME: `${TR098_ROOT}.DownloadDiagnostics.BOMTime`,
    EOM_TIME: `${TR098_ROOT}.DownloadDiagnostics.EOMTime`,
    TOTAL_BYTES_RECEIVED: `${TR098_ROOT}.DownloadDiagnostics.TotalBytesReceived`,
    TEST_BYTES_RECEIVED: `${TR098_ROOT}.DownloadDiagnostics.TestBytesReceived`,
  },
  UPLOAD: {
    ROOT: `${TR098_ROOT}.UploadDiagnostics`,
    DIAGNOSTICS_STATE: `${TR098_ROOT}.UploadDiagnostics.DiagnosticsState`,
    INTERFACE: `${TR098_ROOT}.UploadDiagnostics.Interface`,
    UPLOAD_URL: `${TR098_ROOT}.UploadDiagnostics.UploadURL`,
    DSCP: `${TR098_ROOT}.UploadDiagnostics.DSCP`,
    ETHERNET_PRIORITY: `${TR098_ROOT}.UploadDiagnostics.EthernetPriority`,
    TOTAL_BYTES_SENT: `${TR098_ROOT}.UploadDiagnostics.TotalBytesSent`,
    TEST_BYTES_SENT: `${TR098_ROOT}.UploadDiagnostics.TestBytesSent`,
  },
} as const;

export const TR098_WLAN_24_INDEX = 1;
export const TR098_WLAN_5_INDEX = 2;

/** Prefixes rebuilt on each syncFromDomainModels */
export const TR098_DYNAMIC_PREFIXES = [
  `${TR098_ROOT}.WANDevice.`,
  `${TR098_ROOT}.LANDevice.1.LANHostConfigManagement.`,
  `${TR098_ROOT}.LANDevice.1.Hosts.`,
  `${TR098_ROOT}.LANDevice.1.LANEthernetInterfaceConfig.`,
  `${TR098_ROOT}.LANDevice.1.LANEthernetInterfaceConfigNumberOfEntries`,
  `${TR098_ROOT}.LANDevice.1.WLANConfiguration.`,
  `${TR098_ROOT}.LANDevice.1.WLANConfigurationNumberOfEntries`,
  `${TR098_ROOT}.IPPingDiagnostics`,
  `${TR098_ROOT}.TraceRouteDiagnostics`,
  `${TR098_ROOT}.DownloadDiagnostics`,
  `${TR098_ROOT}.UploadDiagnostics`,
  `${TR098_ROOT}.X_RouterGui_Optical`,
  `${TR098_ROOT}.X_RouterGui_Web`,
  `${TR098_ROOT}.X_RouterGui_LANIPv6`,
  `${TR098_ROOT}.X_RouterGui_WANIPv6`,
] as const;

export const CWMP_SUPPORTED_RPC_METHODS = [
  'GetRPCMethods',
  'SetParameterValues',
  'GetParameterValues',
  'GetParameterNames',
  'AddObject',
  'DeleteObject',
  'Reboot',
  'FactoryReset',
  'ScheduleInform',
] as const;
