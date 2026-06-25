-- CreateTable
CREATE TABLE "WirelessInterface" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "interfaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "interfaceType" TEXT NOT NULL,
    "band" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "ssid" TEXT NOT NULL,
    "channel" INTEGER NOT NULL,
    "channelWidth" TEXT NOT NULL DEFAULT '20MHz',
    "security" TEXT NOT NULL DEFAULT 'wpa2-psk-aes',
    "password" TEXT NOT NULL DEFAULT '',
    "isolated" BOOLEAN NOT NULL DEFAULT false,
    "vlanId" INTEGER,
    "bandwidthLimitMbps" INTEGER,
    "captivePortal" BOOLEAN NOT NULL DEFAULT false,
    "scheduleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleStart" TEXT,
    "scheduleEnd" TEXT,
    "ipv4Enabled" BOOLEAN NOT NULL DEFAULT true,
    "ipv6Enabled" BOOLEAN NOT NULL DEFAULT true,
    "backhaulMode" TEXT,
    "linkQuality" INTEGER,
    "linkStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WirelessInterface_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WirelessInterface_deviceId_interfaceId_key" ON "WirelessInterface"("deviceId", "interfaceId");
CREATE INDEX "WirelessInterface_deviceId_interfaceType_idx" ON "WirelessInterface"("deviceId", "interfaceType");

-- Seed primary interfaces from WlanConfig
INSERT INTO "WirelessInterface" (
    "id", "deviceId", "interfaceId", "name", "interfaceType", "band",
    "enabled", "hidden", "ssid", "channel", "channelWidth", "security", "password",
    "updatedAt"
)
SELECT
    lower(hex(randomblob(16))),
    w."deviceId",
    CASE WHEN w."band" = '2.4' THEN 'wlan1' ELSE 'wlan2' END,
    CASE WHEN w."band" = '2.4' THEN 'Home 2.4 GHz' ELSE 'Home 5 GHz' END,
    'primary',
    w."band",
    w."enabled",
    false,
    w."ssid",
    w."channel",
    w."channelWidth",
    w."security",
    w."password",
    CURRENT_TIMESTAMP
FROM "WlanConfig" w;

-- Seed guest from GuestWlanConfig (one row per device)
INSERT INTO "WirelessInterface" (
    "id", "deviceId", "interfaceId", "name", "interfaceType", "band",
    "enabled", "hidden", "ssid", "channel", "channelWidth", "security", "password",
    "isolated", "vlanId", "updatedAt"
)
SELECT
    lower(hex(randomblob(16))),
    g."deviceId",
    'wlan1-1',
    'Guest WiFi',
    'guest',
    g."band",
    g."enabled",
    false,
    g."ssid",
    6,
    '20MHz',
    g."security",
    g."password",
    g."isolation",
    30,
    CURRENT_TIMESTAMP
FROM "GuestWlanConfig" g;

-- Default mesh backhaul
INSERT INTO "WirelessInterface" (
    "id", "deviceId", "interfaceId", "name", "interfaceType", "band",
    "enabled", "hidden", "ssid", "channel", "channelWidth", "security", "password",
    "backhaulMode", "linkQuality", "linkStatus", "updatedAt"
)
SELECT
    lower(hex(randomblob(16))),
    d."id",
    'mesh0',
    'Mesh Backhaul',
    'mesh_backhaul',
    '5',
    true,
    true,
    'mesh-backhaul-hidden',
    149,
    '80MHz',
    'wpa2-psk-aes',
    '',
    'wireless',
    92,
    'connected',
    CURRENT_TIMESTAMP
FROM "VirtualDevice" d;
