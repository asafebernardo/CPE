-- AlterTable
ALTER TABLE "WanConfig" ADD COLUMN "downloadBandwidthMbps" INTEGER NOT NULL DEFAULT 500;
ALTER TABLE "WanConfig" ADD COLUMN "uploadBandwidthMbps" INTEGER NOT NULL DEFAULT 250;

-- AlterTable
ALTER TABLE "WebManagementConfig" ADD COLUMN "localPort" INTEGER NOT NULL DEFAULT 80;
ALTER TABLE "WebManagementConfig" ADD COLUMN "httpsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WebManagementConfig" ADD COLUMN "httpsPort" INTEGER NOT NULL DEFAULT 443;
ALTER TABLE "WebManagementConfig" ADD COLUMN "adminUsername" TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE "WebManagementConfig" ADD COLUMN "adminPassword" TEXT NOT NULL DEFAULT '';
