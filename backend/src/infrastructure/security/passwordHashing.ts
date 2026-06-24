import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { argon2i, argon2id, argon2Verify } from 'hash-wasm';
import type { PasswordHashAlgorithm } from '@routergui/shared';

/**
 * Produces a stored-password representation for the given algorithm.
 * Modern algorithms (bcrypt, PBKDF2, Argon2i/id) and the classic digests
 * are computed for real; "plain" is kept as-is for simulation purposes.
 */
export async function hashPassword(algo: PasswordHashAlgorithm, password: string): Promise<string> {
  switch (algo) {
    case 'plain':
      return password;
    case 'md5':
      return `md5$${createHash('md5').update(password).digest('hex')}`;
    case 'sha1':
      return `sha1$${createHash('sha1').update(password).digest('hex')}`;
    case 'sha256':
      return `sha256$${createHash('sha256').update(password).digest('hex')}`;
    case 'sha512':
      return `sha512$${createHash('sha512').update(password).digest('hex')}`;
    case 'pbkdf2': {
      const salt = randomBytes(16);
      const iterations = 100_000;
      const dk = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
      return `pbkdf2_sha256$${iterations}$${salt.toString('base64')}$${dk.toString('base64')}`;
    }
    case 'bcrypt':
      return bcrypt.hashSync(password, 10);
    case 'argon2i':
      return argon2i({
        password,
        salt: randomBytes(16),
        parallelism: 1,
        iterations: 3,
        memorySize: 4096,
        hashLength: 32,
        outputType: 'encoded',
      });
    case 'argon2id':
      return argon2id({
        password,
        salt: randomBytes(16),
        parallelism: 1,
        iterations: 3,
        memorySize: 4096,
        hashLength: 32,
        outputType: 'encoded',
      });
    default:
      return password;
  }
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * Verifies a password against a stored representation, auto-detecting the
 * algorithm from the stored format. Keeps login working regardless of which
 * hashing algorithm the admin selected in the Security Center.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  if (stored.startsWith('$2')) return bcrypt.compareSync(password, stored);
  if (stored.startsWith('$argon2')) {
    try {
      return await argon2Verify({ password, hash: stored });
    } catch {
      return false;
    }
  }
  if (stored.startsWith('md5$')) return safeEqual(`md5$${createHash('md5').update(password).digest('hex')}`, stored);
  if (stored.startsWith('sha1$')) return safeEqual(`sha1$${createHash('sha1').update(password).digest('hex')}`, stored);
  if (stored.startsWith('sha256$')) return safeEqual(`sha256$${createHash('sha256').update(password).digest('hex')}`, stored);
  if (stored.startsWith('sha512$')) return safeEqual(`sha512$${createHash('sha512').update(password).digest('hex')}`, stored);
  if (stored.startsWith('pbkdf2_sha256$')) {
    const [, iterStr, saltB64, dkB64] = stored.split('$');
    const iterations = parseInt(iterStr, 10);
    const salt = Buffer.from(saltB64, 'base64');
    const dk = pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64');
    return safeEqual(dk, dkB64);
  }
  return safeEqual(password, stored);
}
