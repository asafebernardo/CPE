-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ipv6Config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "wanEnabled" BOOLEAN NOT NULL DEFAULT false,
    "wanMode" TEXT NOT NULL DEFAULT 'auto',
    "lanEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lanPrefix" TEXT NOT NULL DEFAULT 'fd00::/64',
    "dhcpv6Enabled" BOOLEAN NOT NULL DEFAULT true,
    "slaacEnabled" BOOLEAN NOT NULL DEFAULT true,
    "prefixDelegation" BOOLEAN NOT NULL DEFAULT true,
    "wanAddress" TEXT NOT NULL DEFAULT '2001:db8:1::2',
    "wanGateway" TEXT NOT NULL DEFAULT '2001:db8:1::1',
    "wanDns" TEXT NOT NULL DEFAULT '2001:db8:1::53',
    "prefixLength" INTEGER NOT NULL DEFAULT 64,
    CONSTRAINT "Ipv6Config_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Ipv6Config" ("deviceId", "dhcpv6Enabled", "id", "lanEnabled", "lanPrefix", "wanEnabled", "wanMode") SELECT "deviceId", "dhcpv6Enabled", "id", "lanEnabled", "lanPrefix", "wanEnabled", "wanMode" FROM "Ipv6Config";
DROP TABLE "Ipv6Config";
ALTER TABLE "new_Ipv6Config" RENAME TO "Ipv6Config";
CREATE UNIQUE INDEX "Ipv6Config_deviceId_key" ON "Ipv6Config"("deviceId");
CREATE TABLE "new_WanConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "connectionType" TEXT NOT NULL DEFAULT 'DHCP',
    "ipAddress" TEXT NOT NULL DEFAULT '192.0.2.10',
    "subnetMask" TEXT NOT NULL DEFAULT '255.255.255.0',
    "gateway" TEXT NOT NULL DEFAULT '192.0.2.1',
    "dnsPrimary" TEXT NOT NULL DEFAULT '8.8.8.8',
    "dnsSecondary" TEXT NOT NULL DEFAULT '8.8.4.4',
    "dnsAuto" BOOLEAN NOT NULL DEFAULT true,
    "mtu" INTEGER NOT NULL DEFAULT 1500,
    "pppoeUsername" TEXT,
    "pppoePassword" TEXT,
    "pppoeServiceName" TEXT NOT NULL DEFAULT '',
    "pppoeAcName" TEXT NOT NULL DEFAULT '',
    "pppoeMtu" INTEGER NOT NULL DEFAULT 1492,
    "pppoeConnected" BOOLEAN NOT NULL DEFAULT false,
    "pppoeAuthStatus" TEXT NOT NULL DEFAULT 'authenticated',
    "vlanEnabled" BOOLEAN NOT NULL DEFAULT false,
    "vlanId" INTEGER NOT NULL DEFAULT 0,
    "vlanPriority" INTEGER NOT NULL DEFAULT 0,
    "natEnabled" BOOLEAN NOT NULL DEFAULT true,
    "natType" TEXT NOT NULL DEFAULT 'NAT',
    "status" TEXT NOT NULL DEFAULT 'connected',
    "connectedSince" DATETIME,
    "lastReconnect" DATETIME,
    CONSTRAINT "WanConfig_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WanConfig" ("connectionType", "deviceId", "dnsPrimary", "dnsSecondary", "gateway", "id", "ipAddress", "pppoePassword", "pppoeUsername", "status", "subnetMask") SELECT "connectionType", "deviceId", "dnsPrimary", "dnsSecondary", "gateway", "id", "ipAddress", "pppoePassword", "pppoeUsername", "status", "subnetMask" FROM "WanConfig";
DROP TABLE "WanConfig";
ALTER TABLE "new_WanConfig" RENAME TO "WanConfig";
CREATE UNIQUE INDEX "WanConfig_deviceId_key" ON "WanConfig"("deviceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
