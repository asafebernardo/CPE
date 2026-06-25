-- AlterTable
ALTER TABLE "LanConfig" ADD COLUMN "dnsPrimary" TEXT NOT NULL DEFAULT '8.8.8.8';
ALTER TABLE "LanConfig" ADD COLUMN "dnsSecondary" TEXT NOT NULL DEFAULT '8.8.4.4';
ALTER TABLE "LanConfig" ADD COLUMN "dnsAuto" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "NtpConfig" ADD COLUMN "serverSecondary" TEXT NOT NULL DEFAULT 'time.google.com';

-- CreateTable
CREATE TABLE "WebManagementConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "remoteAccess" BOOLEAN NOT NULL DEFAULT false,
    "remotePort" INTEGER NOT NULL DEFAULT 8080,
    CONSTRAINT "WebManagementConfig_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WebManagementConfig_deviceId_key" ON "WebManagementConfig"("deviceId");
