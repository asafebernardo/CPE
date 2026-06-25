-- AlterTable: split RSSI threshold per band
ALTER TABLE "BandSteeringConfig" ADD COLUMN "rssiThreshold24" INTEGER NOT NULL DEFAULT -70;
ALTER TABLE "BandSteeringConfig" ADD COLUMN "rssiThreshold5" INTEGER NOT NULL DEFAULT -65;
UPDATE "BandSteeringConfig" SET "rssiThreshold24" = "rssiThreshold", "rssiThreshold5" = "rssiThreshold";
ALTER TABLE "BandSteeringConfig" DROP COLUMN "rssiThreshold";
