-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VirtualDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manufacturer" TEXT NOT NULL DEFAULT 'RouterGui',
    "modelName" TEXT NOT NULL DEFAULT 'RGX-5000',
    "softwareVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "hardwareVersion" TEXT NOT NULL DEFAULT 'RGX-HW-A1',
    "serialNumber" TEXT NOT NULL,
    "osName" TEXT NOT NULL DEFAULT 'RGOS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Tr098Parameter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'string',
    "writable" BOOLEAN NOT NULL DEFAULT false,
    "notification" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tr098Parameter_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WanConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "connectionType" TEXT NOT NULL DEFAULT 'DHCP',
    "ipAddress" TEXT NOT NULL DEFAULT '192.0.2.10',
    "subnetMask" TEXT NOT NULL DEFAULT '255.255.255.0',
    "gateway" TEXT NOT NULL DEFAULT '192.0.2.1',
    "dnsPrimary" TEXT NOT NULL DEFAULT '8.8.8.8',
    "dnsSecondary" TEXT NOT NULL DEFAULT '8.8.4.4',
    "pppoeUsername" TEXT,
    "pppoePassword" TEXT,
    "status" TEXT NOT NULL DEFAULT 'connected',
    CONSTRAINT "WanConfig_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LanConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL DEFAULT '192.168.1.1',
    "subnetMask" TEXT NOT NULL DEFAULT '255.255.255.0',
    "dhcpEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dhcpRangeStart" TEXT NOT NULL DEFAULT '192.168.1.100',
    "dhcpRangeEnd" TEXT NOT NULL DEFAULT '192.168.1.200',
    CONSTRAINT "LanConfig_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WlanConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "band" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "ssid" TEXT NOT NULL,
    "channel" INTEGER NOT NULL,
    "channelWidth" TEXT NOT NULL DEFAULT '20MHz',
    "security" TEXT NOT NULL DEFAULT 'WPA2',
    "password" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "WlanConfig_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FirewallRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "sourceIp" TEXT NOT NULL DEFAULT 'any',
    "destIp" TEXT NOT NULL DEFAULT 'any',
    "sourcePort" TEXT NOT NULL DEFAULT 'any',
    "destPort" TEXT NOT NULL DEFAULT 'any',
    "action" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "FirewallRule_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PortForward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "externalPort" INTEGER NOT NULL,
    "internalIp" TEXT NOT NULL,
    "internalPort" INTEGER NOT NULL,
    "protocol" TEXT NOT NULL DEFAULT 'TCP',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "PortForward_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DmzConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "hostIp" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "DmzConfig_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LogEntry_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CwmpSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "acsUrl" TEXT NOT NULL DEFAULT '',
    "acsUsername" TEXT NOT NULL DEFAULT '',
    "acsPassword" TEXT NOT NULL DEFAULT '',
    "periodicInformEnabled" BOOLEAN NOT NULL DEFAULT true,
    "periodicInformInterval" INTEGER NOT NULL DEFAULT 300,
    "sessionState" TEXT NOT NULL DEFAULT 'idle',
    "lastInform" DATETIME,
    "lastEventCodes" TEXT NOT NULL DEFAULT '[]',
    "pendingEvents" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "CwmpSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SimulatedMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "cpuUsage" REAL NOT NULL DEFAULT 25.0,
    "memoryUsage" REAL NOT NULL DEFAULT 55.0,
    "uptime" INTEGER NOT NULL DEFAULT 0,
    "bootTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SimulatedMetrics_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeviceSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeviceSnapshot_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "VirtualDevice_serialNumber_key" ON "VirtualDevice"("serialNumber");

-- CreateIndex
CREATE INDEX "Tr098Parameter_deviceId_idx" ON "Tr098Parameter"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Tr098Parameter_deviceId_path_key" ON "Tr098Parameter"("deviceId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "WanConfig_deviceId_key" ON "WanConfig"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "LanConfig_deviceId_key" ON "LanConfig"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "WlanConfig_deviceId_band_key" ON "WlanConfig"("deviceId", "band");

-- CreateIndex
CREATE INDEX "FirewallRule_deviceId_idx" ON "FirewallRule"("deviceId");

-- CreateIndex
CREATE INDEX "PortForward_deviceId_idx" ON "PortForward"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "DmzConfig_deviceId_key" ON "DmzConfig"("deviceId");

-- CreateIndex
CREATE INDEX "LogEntry_deviceId_createdAt_idx" ON "LogEntry"("deviceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CwmpSession_deviceId_key" ON "CwmpSession"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "SimulatedMetrics_deviceId_key" ON "SimulatedMetrics"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceSnapshot_deviceId_idx" ON "DeviceSnapshot"("deviceId");
