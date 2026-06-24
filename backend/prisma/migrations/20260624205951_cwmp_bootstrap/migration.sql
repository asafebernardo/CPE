-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CwmpSession" (
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
    "bootstrapSent" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "CwmpSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CwmpSession" ("acsPassword", "acsUrl", "acsUsername", "deviceId", "id", "lastEventCodes", "lastInform", "pendingEvents", "periodicInformEnabled", "periodicInformInterval", "sessionState") SELECT "acsPassword", "acsUrl", "acsUsername", "deviceId", "id", "lastEventCodes", "lastInform", "pendingEvents", "periodicInformEnabled", "periodicInformInterval", "sessionState" FROM "CwmpSession";
DROP TABLE "CwmpSession";
ALTER TABLE "new_CwmpSession" RENAME TO "CwmpSession";
CREATE UNIQUE INDEX "CwmpSession_deviceId_key" ON "CwmpSession"("deviceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
