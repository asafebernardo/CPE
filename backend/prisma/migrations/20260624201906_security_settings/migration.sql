-- CreateTable
CREATE TABLE "SecuritySettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "SecuritySettings_deviceId_key" ON "SecuritySettings"("deviceId");
