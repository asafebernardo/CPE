-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SecuritySettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "securityProfile" TEXT NOT NULL DEFAULT 'isp-standard',
    "forcePasswordChange" BOOLEAN NOT NULL DEFAULT false,
    "factorySsid" TEXT NOT NULL DEFAULT '',
    "factoryWifiPassword" TEXT NOT NULL DEFAULT '',
    "passwordHashAlgorithm" TEXT NOT NULL DEFAULT 'bcrypt',
    "credentialEncryptionType" TEXT NOT NULL DEFAULT 'aes-256',
    "backupEncryptionType" TEXT NOT NULL DEFAULT 'aes-256',
    "legacyCompatibility" BOOLEAN NOT NULL DEFAULT false,
    "certType" TEXT NOT NULL DEFAULT 'rsa-2048',
    "certAlgorithm" TEXT NOT NULL DEFAULT 'RSA',
    "certBits" INTEGER NOT NULL DEFAULT 2048,
    "certIssuer" TEXT NOT NULL DEFAULT 'RouterGui CA',
    "certSubject" TEXT NOT NULL DEFAULT 'CN=RouterGui RGX-5000',
    "certSerial" TEXT NOT NULL DEFAULT '',
    "certFingerprint" TEXT NOT NULL DEFAULT '',
    "certValidFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certValidTo" DATETIME NOT NULL,
    "certPublicKey" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SecuritySettings_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "VirtualDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SecuritySettings" ("backupEncryptionType", "certAlgorithm", "certBits", "certFingerprint", "certIssuer", "certPublicKey", "certSerial", "certSubject", "certType", "certValidFrom", "certValidTo", "createdAt", "credentialEncryptionType", "deviceId", "id", "legacyCompatibility", "passwordHashAlgorithm", "updatedAt") SELECT "backupEncryptionType", "certAlgorithm", "certBits", "certFingerprint", "certIssuer", "certPublicKey", "certSerial", "certSubject", "certType", "certValidFrom", "certValidTo", "createdAt", "credentialEncryptionType", "deviceId", "id", "legacyCompatibility", "passwordHashAlgorithm", "updatedAt" FROM "SecuritySettings";
DROP TABLE "SecuritySettings";
ALTER TABLE "new_SecuritySettings" RENAME TO "SecuritySettings";
CREATE UNIQUE INDEX "SecuritySettings_deviceId_key" ON "SecuritySettings"("deviceId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "id", "passwordHash", "role", "updatedAt", "username") SELECT "createdAt", "id", "passwordHash", "role", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
