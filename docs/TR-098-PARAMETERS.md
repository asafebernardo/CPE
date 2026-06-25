# TR-098 Parameters (v1)

Initial parameter tree seeded for AeroBerry RGX-5000.

## DeviceInfo

| Path | Default | Writable |
|------|---------|----------|
| InternetGatewayDevice.DeviceInfo.Manufacturer | AeroBerry | No |
| InternetGatewayDevice.DeviceInfo.ModelName | RGX-5000 | No |
| InternetGatewayDevice.DeviceInfo.SoftwareVersion | 1.0.0 | No |
| InternetGatewayDevice.DeviceInfo.HardwareVersion | RGX-HW-A1 | No |
| InternetGatewayDevice.DeviceInfo.SerialNumber | RGX-* (auto) | No |
| InternetGatewayDevice.DeviceInfo.UpTime | 0 | No |

## ManagementServer

| Path | Writable |
|------|----------|
| InternetGatewayDevice.ManagementServer.URL | Yes |
| InternetGatewayDevice.ManagementServer.Username | Yes |
| InternetGatewayDevice.ManagementServer.Password | Yes |
| InternetGatewayDevice.ManagementServer.PeriodicInformEnable | Yes |
| InternetGatewayDevice.ManagementServer.PeriodicInformInterval | Yes |
| InternetGatewayDevice.ManagementServer.ConnectionRequestURL | No |

## WANDevice

| Path | Writable |
|------|----------|
| InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ConnectionType | Yes |
| InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress | Yes |
| InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.SubnetMask | Yes |
| InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.DefaultGateway | Yes |
| InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.DNSServers | Yes |
| InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.MACAddress | No |

## LANDevice

| Path | Writable |
|------|----------|
| InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.IPInterface.1.IPInterfaceIPAddress | Yes |
| InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.IPInterface.1.IPInterfaceSubnetMask | Yes |
| InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.DHCPServerEnable | Yes |
| InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.MinAddress | Yes |
| InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.MaxAddress | Yes |

## WLANConfiguration

Two instances: index 1 (2.4 GHz), index 2 (5 GHz).

| Path suffix | Writable |
|-------------|----------|
| Enable | Yes |
| SSID | Yes |
| Channel | Yes |
| Standard | No |
| BeaconType | Yes |
| WPAEncryptionModes | Yes |
| PreSharedKey.1.KeyPassphrase | Yes |

## Sync Behavior

GUI changes update domain tables (WanConfig, etc.) then `ParameterTreeService.syncFromDomainModels()` updates TR-098 parameters.

ACS SetParameterValues updates TR-098 first, then `syncToDomainModels()` applies to domain tables.
