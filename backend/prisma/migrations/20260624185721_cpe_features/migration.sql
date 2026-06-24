-- CreateTable
CREATE TABLE "ConnectedHost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "macAddress" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "interface" TEXT NOT NULL DEFAULT 'lan',
    "band" TEXT,
    "rssi" INTEGER,
    "leaseExpiry" DATETIME,
    "connectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConnectedHost_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WifiNeighbor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "bssid" TEXT NOT NULL,
    "ssid" TEXT NOT NULL,
    "channel" INTEGER NOT NULL,
    "rssi" INTEGER NOT NULL,
    "security" TEXT NOT NULL DEFAULT 'WPA2',
    "band" TEXT NOT NULL,
    "scannedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WifiNeighbor_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BandSteeringConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rssiThreshold" INTEGER NOT NULL DEFAULT -70,
    "prefer5G" BOOLEAN NOT NULL DEFAULT true,
    "clientSteering" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "BandSteeringConfig_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpeedTestResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "downloadMbps" REAL NOT NULL,
    "uploadMbps" REAL NOT NULL,
    "latencyMs" REAL NOT NULL,
    "jitterMs" REAL NOT NULL DEFAULT 2,
    "server" TEXT NOT NULL DEFAULT 'RouterGui Speed Server',
    "testedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpeedTestResult_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ipv6Config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "wanEnabled" BOOLEAN NOT NULL DEFAULT false,
    "wanMode" TEXT NOT NULL DEFAULT 'auto',
    "lanEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lanPrefix" TEXT NOT NULL DEFAULT 'fd00::/64',
    "dhcpv6Enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Ipv6Config_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GuestWlanConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "ssid" TEXT NOT NULL DEFAULT 'RGX-Guest',
    "password" TEXT NOT NULL DEFAULT 'guest2024',
    "security" TEXT NOT NULL DEFAULT 'WPA2',
    "isolation" BOOLEAN NOT NULL DEFAULT true,
    "band" TEXT NOT NULL DEFAULT '2.4',
    CONSTRAINT "GuestWlanConfig_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DhcpReservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "macAddress" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "hostname" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "DhcpReservation_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaticRoute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "subnetMask" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "interface" TEXT NOT NULL DEFAULT 'wan',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "StaticRoute_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UpnpConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "UpnpConfig_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QosRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "protocol" TEXT NOT NULL DEFAULT 'ANY',
    "srcPort" TEXT NOT NULL DEFAULT 'any',
    "destPort" TEXT NOT NULL DEFAULT 'any',
    "dscp" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "QosRule_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VpnConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OpenVPN',
    "server" TEXT NOT NULL DEFAULT '',
    "username" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "VpnConfig_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FirmwareInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "currentVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "pendingVersion" TEXT,
    "lastUpgrade" DATETIME,
    "upgradeStatus" TEXT NOT NULL DEFAULT 'idle',
    CONSTRAINT "FirmwareInfo_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NtpConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "server" TEXT NOT NULL DEFAULT 'pool.ntp.org',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    CONSTRAINT "NtpConfig_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpticalInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "rxPowerDbm" REAL NOT NULL DEFAULT -18.5,
    "txPowerDbm" REAL NOT NULL DEFAULT 2.1,
    "temperature" REAL NOT NULL DEFAULT 42.0,
    "ponStatus" TEXT NOT NULL DEFAULT 'registered',
    "oltId" TEXT NOT NULL DEFAULT 'OLT-001',
    CONSTRAINT "OpticalInfo_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoipLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "lineId" INTEGER NOT NULL,
    "number" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'idle',
    CONSTRAINT "VoipLine_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ConnectedHost_deviceId_idx" ON "ConnectedHost"("deviceId");

-- CreateIndex
CREATE INDEX "WifiNeighbor_deviceId_scannedAt_idx" ON "WifiNeighbor"("deviceId", "scannedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BandSteeringConfig_deviceId_key" ON "BandSteeringConfig"("deviceId");

-- CreateIndex
CREATE INDEX "SpeedTestResult_deviceId_testedAt_idx" ON "SpeedTestResult"("deviceId", "testedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Ipv6Config_deviceId_key" ON "Ipv6Config"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestWlanConfig_deviceId_key" ON "GuestWlanConfig"("deviceId");

-- CreateIndex
CREATE INDEX "DhcpReservation_deviceId_idx" ON "DhcpReservation"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "DhcpReservation_deviceId_macAddress_key" ON "DhcpReservation"("deviceId", "macAddress");

-- CreateIndex
CREATE INDEX "StaticRoute_deviceId_idx" ON "StaticRoute"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "UpnpConfig_deviceId_key" ON "UpnpConfig"("deviceId");

-- CreateIndex
CREATE INDEX "QosRule_deviceId_idx" ON "QosRule"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "VpnConfig_deviceId_key" ON "VpnConfig"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "FirmwareInfo_deviceId_key" ON "FirmwareInfo"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "NtpConfig_deviceId_key" ON "NtpConfig"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "OpticalInfo_deviceId_key" ON "OpticalInfo"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "VoipLine_deviceId_lineId_key" ON "VoipLine"("deviceId", "lineId");
