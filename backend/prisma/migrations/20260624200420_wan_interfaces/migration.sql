-- CreateTable
CREATE TABLE "WanInterface" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL DEFAULT 'INTERNET',
    "connectionType" TEXT NOT NULL DEFAULT 'DHCP',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "ipAddress" TEXT NOT NULL DEFAULT '0.0.0.0',
    "subnetMask" TEXT NOT NULL DEFAULT '255.255.255.0',
    "gateway" TEXT NOT NULL DEFAULT '0.0.0.0',
    "dnsPrimary" TEXT NOT NULL DEFAULT '8.8.8.8',
    "dnsSecondary" TEXT NOT NULL DEFAULT '8.8.4.4',
    "mtu" INTEGER NOT NULL DEFAULT 1500,
    "pppoeUsername" TEXT,
    "pppoePassword" TEXT,
    "vlanEnabled" BOOLEAN NOT NULL DEFAULT false,
    "vlanId" INTEGER NOT NULL DEFAULT 0,
    "natEnabled" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WanInterface_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WanInterface_deviceId_idx" ON "WanInterface"("deviceId");
