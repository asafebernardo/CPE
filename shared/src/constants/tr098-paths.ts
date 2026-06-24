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
} as const;

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
} as const;

export const TR098_WLAN = {
  wlan24: (index: number) => ({
    ENABLE: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.Enable`,
    SSID: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.SSID`,
    CHANNEL: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.Channel`,
    STANDARD: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.Standard`,
    BEACON_TYPE: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.BeaconType`,
    WPA_ENCRYPTION: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.WPAEncryptionModes`,
    KEY_PASSPHRASE: `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${index}.PreSharedKey.1.KeyPassphrase`,
  }),
} as const;

export const TR098_WLAN_24_INDEX = 1;
export const TR098_WLAN_5_INDEX = 2;
