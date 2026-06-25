import { generateKeyPairSync, createHash, randomBytes } from 'crypto';
import { getCertificateType, type CertificateType } from '@aerobrry/shared';

export interface GeneratedCertificate {
  type: CertificateType;
  algorithm: string;
  bits: number;
  issuer: string;
  subject: string;
  serial: string;
  fingerprint: string;
  validFrom: Date;
  validTo: Date;
  publicKey: string;
}

/**
 * Generates a real asymmetric key pair (RSA or ECDSA) and synthesizes the
 * surrounding X.509-style certificate metadata. The key material is genuine;
 * issuer/validity/serial are simulated for the virtual CA.
 */
export function generateCertificate(typeId: CertificateType): GeneratedCertificate {
  const meta = getCertificateType(typeId);
  if (!meta) throw new Error('Unknown certificate type');

  let publicKey: string;
  if (meta.algorithm === 'RSA') {
    const pair = generateKeyPairSync('rsa', {
      modulusLength: meta.bits,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    publicKey = pair.publicKey;
  } else {
    const curve = meta.bits === 256 ? 'prime256v1' : meta.bits === 384 ? 'secp384r1' : 'secp521r1';
    const pair = generateKeyPairSync('ec', {
      namedCurve: curve,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    publicKey = pair.publicKey;
  }

  const fingerprint = (createHash('sha256').update(publicKey).digest('hex').match(/.{2}/g) ?? [])
    .join(':')
    .toUpperCase();
  const serial = randomBytes(8).toString('hex').toUpperCase();
  const validFrom = new Date();
  const validTo = new Date(validFrom.getTime() + 365 * 24 * 60 * 60 * 1000);

  return {
    type: typeId,
    algorithm: meta.algorithm,
    bits: meta.bits,
    issuer: 'AeroBerry CA',
    subject: 'CN=AeroBerry RGX-5000, O=AeroBerry Virtual CPE',
    serial,
    fingerprint,
    validFrom,
    validTo,
    publicKey,
  };
}
