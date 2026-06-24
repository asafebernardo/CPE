import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { env } from '../../config/env.js';
import type { CredentialEncryptionType } from '@routergui/shared';

function keyFor(bytes: number): Buffer {
  return createHash('sha256').update(env.jwtSecret).digest().subarray(0, bytes);
}

function aesEncrypt(value: string, keyBytes: 16 | 32): string {
  const iv = randomBytes(16);
  const algo = keyBytes === 16 ? 'aes-128-cbc' : 'aes-256-cbc';
  const cipher = createCipheriv(algo, keyFor(keyBytes), iv);
  const enc = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${algo}:${iv.toString('hex')}:${enc.toString('hex')}`;
}

function aesDecrypt(stored: string, keyBytes: 16 | 32): string {
  const [algo, ivHex, dataHex] = stored.split(':');
  if (!algo || !ivHex || !dataHex) return '';
  const decipher = createDecipheriv(algo, keyFor(keyBytes), Buffer.from(ivHex, 'hex'));
  const dec = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return dec.toString('utf8');
}

/** Encrypts/encodes a credential according to the selected storage scheme. */
export function encryptCredential(type: CredentialEncryptionType, value: string): string {
  if (!value) return '';
  switch (type) {
    case 'plain':
      return value;
    case 'base64':
      return Buffer.from(value, 'utf8').toString('base64');
    case 'aes-128':
      return aesEncrypt(value, 16);
    case 'aes-256':
      return aesEncrypt(value, 32);
    default:
      return value;
  }
}

export function decryptCredential(type: CredentialEncryptionType, stored: string): string {
  if (!stored) return '';
  switch (type) {
    case 'plain':
      return stored;
    case 'base64':
      return Buffer.from(stored, 'base64').toString('utf8');
    case 'aes-128':
      return aesDecrypt(stored, 16);
    case 'aes-256':
      return aesDecrypt(stored, 32);
    default:
      return stored;
  }
}
