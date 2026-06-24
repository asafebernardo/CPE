import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CredentialGeneratorService } from '../src/application/services/security/CredentialGeneratorService.js';
import { generateCertificate } from '../src/infrastructure/security/certificate.js';
import {
  DEVICE_MANUFACTURER,
  DEVICE_MODEL,
  DEVICE_SOFTWARE_VERSION,
  DEVICE_HARDWARE_VERSION,
  DEVICE_OS,
  DEFAULT_ADMIN_USERNAME,
  DEFAULT_ADMIN_PASSWORD,
  TR098_ROOT,
  TR098_DEVICE_INFO,
  TR098_MANAGEMENT_SERVER,
  TR098_WAN,
  TR098_LAN,
  TR098_WLAN,
  TR098_WLAN_24_INDEX,
  TR098_WLAN_5_INDEX,
  generateSerialNumber,
} from '@routergui/shared';

const prisma = new PrismaClient();

function buildTr098SeedParams(serial: string): Array<{ path: string; value: string; writable: boolean; type: string }> {
  const wlan24 = TR098_WLAN.wlan24(TR098_WLAN_24_INDEX);
  const wlan5 = TR098_WLAN.wlan24(TR098_WLAN_5_INDEX);

  return [
    { path: TR098_DEVICE_INFO.MANUFACTURER, value: DEVICE_MANUFACTURER, writable: false, type: 'string' },
    { path: TR098_DEVICE_INFO.MODEL_NAME, value: DEVICE_MODEL, writable: false, type: 'string' },
    { path: TR098_DEVICE_INFO.SOFTWARE_VERSION, value: DEVICE_SOFTWARE_VERSION, writable: false, type: 'string' },
    { path: TR098_DEVICE_INFO.HARDWARE_VERSION, value: DEVICE_HARDWARE_VERSION, writable: false, type: 'string' },
    { path: TR098_DEVICE_INFO.SERIAL_NUMBER, value: serial, writable: false, type: 'string' },
    { path: TR098_DEVICE_INFO.UPTIME, value: '0', writable: false, type: 'unsignedInt' },
    { path: TR098_MANAGEMENT_SERVER.URL, value: '', writable: true, type: 'string' },
    { path: TR098_MANAGEMENT_SERVER.USERNAME, value: '', writable: true, type: 'string' },
    { path: TR098_MANAGEMENT_SERVER.PASSWORD, value: '', writable: true, type: 'string' },
    { path: TR098_MANAGEMENT_SERVER.PERIODIC_INFORM_ENABLE, value: 'true', writable: true, type: 'boolean' },
    { path: TR098_MANAGEMENT_SERVER.PERIODIC_INFORM_INTERVAL, value: '300', writable: true, type: 'unsignedInt' },
    { path: TR098_MANAGEMENT_SERVER.CONNECTION_REQUEST_URL, value: 'http://localhost:3001/api/acs/connection-request', writable: false, type: 'string' },
    { path: TR098_WAN.CONNECTION_TYPE, value: 'DHCP', writable: true, type: 'string' },
    { path: TR098_WAN.EXTERNAL_IP, value: '192.0.2.10', writable: true, type: 'string' },
    { path: TR098_WAN.SUBNET_MASK, value: '255.255.255.0', writable: true, type: 'string' },
    { path: TR098_WAN.DEFAULT_GATEWAY, value: '192.0.2.1', writable: true, type: 'string' },
    { path: TR098_WAN.DNS_SERVERS, value: '8.8.8.8,8.8.4.4', writable: true, type: 'string' },
    { path: TR098_WAN.MAC_ADDRESS, value: '00:1A:2B:3C:4D:5E', writable: false, type: 'string' },
    { path: TR098_LAN.IP_ADDRESS, value: '192.168.1.1', writable: true, type: 'string' },
    { path: TR098_LAN.SUBNET_MASK, value: '255.255.255.0', writable: true, type: 'string' },
    { path: TR098_LAN.DHCP_ENABLE, value: 'true', writable: true, type: 'boolean' },
    { path: TR098_LAN.MIN_ADDRESS, value: '192.168.1.100', writable: true, type: 'string' },
    { path: TR098_LAN.MAX_ADDRESS, value: '192.168.1.200', writable: true, type: 'string' },
    { path: wlan24.ENABLE, value: 'true', writable: true, type: 'boolean' },
    { path: wlan24.SSID, value: 'RGX-5000-2G', writable: true, type: 'string' },
    { path: wlan24.CHANNEL, value: '6', writable: true, type: 'unsignedInt' },
    { path: wlan24.STANDARD, value: '802.11n', writable: false, type: 'string' },
    { path: wlan24.BEACON_TYPE, value: 'WPA2', writable: true, type: 'string' },
    { path: wlan24.WPA_ENCRYPTION, value: 'TKIPandAESEncryption', writable: true, type: 'string' },
    { path: wlan24.KEY_PASSPHRASE, value: 'routergui2024', writable: true, type: 'string' },
    { path: wlan5.ENABLE, value: 'true', writable: true, type: 'boolean' },
    { path: wlan5.SSID, value: 'RGX-5000-5G', writable: true, type: 'string' },
    { path: wlan5.CHANNEL, value: '36', writable: true, type: 'unsignedInt' },
    { path: wlan5.STANDARD, value: '802.11ac', writable: false, type: 'string' },
    { path: wlan5.BEACON_TYPE, value: 'WPA2', writable: true, type: 'string' },
    { path: wlan5.WPA_ENCRYPTION, value: 'TKIPandAESEncryption', writable: true, type: 'string' },
    { path: wlan5.KEY_PASSPHRASE, value: 'routergui2024', writable: true, type: 'string' },
    { path: `${TR098_ROOT}.WANDevice.1.WANConnectionNumberOfEntries`, value: '1', writable: false, type: 'unsignedInt' },
    { path: `${TR098_ROOT}.LANDevice.1.LANHostConfigManagement.DHCPServerConfigurable`, value: 'true', writable: false, type: 'boolean' },
    { path: `${TR098_ROOT}.LANDevice.1.WLANConfigurationNumberOfEntries`, value: '2', writable: false, type: 'unsignedInt' },
  ];
}

async function main() {
  const adminHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { username: DEFAULT_ADMIN_USERNAME },
    create: { username: DEFAULT_ADMIN_USERNAME, passwordHash: adminHash, role: 'ADMIN' },
    update: { passwordHash: adminHash, role: 'ADMIN' },
  });

  const techHash = await bcrypt.hash('tech', 10);
  await prisma.user.upsert({
    where: { username: 'tech' },
    create: { username: 'tech', passwordHash: techHash, role: 'TECHNICIAN' },
    update: { passwordHash: techHash, role: 'TECHNICIAN' },
  });

  const userHash = await bcrypt.hash('user', 10);
  await prisma.user.upsert({
    where: { username: 'user' },
    create: { username: 'user', passwordHash: userHash, role: 'USER' },
    update: { passwordHash: userHash, role: 'USER' },
  });

  const existing = await prisma.virtualDevice.findFirst();
  if (existing) {
    console.log('Device already seeded, skipping.');
    return;
  }

  const serial = generateSerialNumber();
  const device = await prisma.virtualDevice.create({
    data: {
      manufacturer: DEVICE_MANUFACTURER,
      modelName: DEVICE_MODEL,
      softwareVersion: DEVICE_SOFTWARE_VERSION,
      hardwareVersion: DEVICE_HARDWARE_VERSION,
      serialNumber: serial,
      osName: DEVICE_OS,
    },
  });

  await prisma.wanConfig.create({
    data: { deviceId: device.id },
  });

  await prisma.lanConfig.create({
    data: { deviceId: device.id },
  });

  const credGen = new CredentialGeneratorService();
  const factoryCreds = credGen.generateCredentials();

  await prisma.wlanConfig.createMany({
    data: [
      {
        deviceId: device.id,
        band: '2.4',
        ssid: factoryCreds.ssid,
        channel: 6,
        channelWidth: '20MHz',
        security: 'wpa2-psk-aes',
        password: factoryCreds.password,
      },
      {
        deviceId: device.id,
        band: '5',
        ssid: factoryCreds.ssid,
        channel: 36,
        channelWidth: '80MHz',
        security: 'wpa2-psk-aes',
        password: factoryCreds.password,
      },
    ],
  });

  const cert = generateCertificate('rsa-2048');
  await prisma.securitySettings.create({
    data: {
      deviceId: device.id,
      securityProfile: 'isp-standard',
      forcePasswordChange: false,
      factorySsid: factoryCreds.ssid,
      factoryWifiPassword: factoryCreds.password,
      passwordHashAlgorithm: 'bcrypt',
      credentialEncryptionType: 'aes-256',
      backupEncryptionType: 'aes-256',
      legacyCompatibility: false,
      certType: cert.type,
      certAlgorithm: cert.algorithm,
      certBits: cert.bits,
      certIssuer: cert.issuer,
      certSubject: cert.subject,
      certSerial: cert.serial,
      certFingerprint: cert.fingerprint,
      certValidFrom: cert.validFrom,
      certValidTo: cert.validTo,
      certPublicKey: cert.publicKey,
    },
  });

  await prisma.firewallRule.createMany({
    data: [
      {
        deviceId: device.id,
        name: 'Allow HTTP',
        direction: 'inbound',
        protocol: 'TCP',
        sourceIp: 'any',
        destIp: 'any',
        sourcePort: 'any',
        destPort: '80',
        action: 'allow',
      },
      {
        deviceId: device.id,
        name: 'Allow HTTPS',
        direction: 'inbound',
        protocol: 'TCP',
        sourceIp: 'any',
        destIp: 'any',
        sourcePort: 'any',
        destPort: '443',
        action: 'allow',
      },
      {
        deviceId: device.id,
        name: 'Block Telnet',
        direction: 'inbound',
        protocol: 'TCP',
        sourceIp: 'any',
        destIp: 'any',
        sourcePort: 'any',
        destPort: '23',
        action: 'deny',
      },
    ],
  });

  await prisma.portForward.create({
    data: {
      deviceId: device.id,
      name: 'Web Server',
      externalPort: 8080,
      internalIp: '192.168.1.50',
      internalPort: 80,
      protocol: 'TCP',
    },
  });

  await prisma.dmzConfig.create({
    data: { deviceId: device.id, enabled: false, hostIp: '' },
  });

  await prisma.cwmpSession.create({
    data: { deviceId: device.id },
  });

  await prisma.simulatedMetrics.create({
    data: { deviceId: device.id },
  });

  const params = buildTr098SeedParams(serial);
  await prisma.tr098Parameter.createMany({
    data: params.map((p) => ({ deviceId: device.id, ...p })),
  });

  console.log(`Seeded device ${DEVICE_MODEL} serial ${serial}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
