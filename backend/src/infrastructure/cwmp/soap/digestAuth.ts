import { createHash, randomBytes } from 'crypto';

function md5(input: string): string {
  return createHash('md5').update(input).digest('hex');
}

interface DigestChallenge {
  realm: string;
  nonce: string;
  qop?: string;
  opaque?: string;
  algorithm?: string;
}

/** Parses a `WWW-Authenticate: Digest ...` header into its components. */
export function parseDigestChallenge(header: string): DigestChallenge | null {
  if (!/^digest/i.test(header.trim())) return null;
  const params = header.replace(/^digest\s*/i, '');
  const result: Record<string, string> = {};
  const regex = /(\w+)=(?:"([^"]*)"|([^,]*))/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(params)) !== null) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? '';
  }
  if (!result.realm || !result.nonce) return null;
  return {
    realm: result.realm,
    nonce: result.nonce,
    qop: result.qop,
    opaque: result.opaque,
    algorithm: result.algorithm,
  };
}

/**
 * Builds an HTTP Digest `Authorization` header value (RFC 2617) for a request.
 * Supports MD5 / MD5-sess and qop="auth" (the variants ACS servers like IXC use).
 */
export function buildDigestAuthHeader(
  challenge: DigestChallenge,
  username: string,
  password: string,
  method: string,
  uri: string,
): string {
  const algorithm = (challenge.algorithm ?? 'MD5').toUpperCase();
  const cnonce = randomBytes(8).toString('hex');
  const nc = '00000001';

  let ha1 = md5(`${username}:${challenge.realm}:${password}`);
  if (algorithm === 'MD5-SESS') {
    ha1 = md5(`${ha1}:${challenge.nonce}:${cnonce}`);
  }
  const ha2 = md5(`${method}:${uri}`);

  // qop may be "auth" or "auth,auth-int" — we only support "auth".
  const qop = challenge.qop?.split(',').map((q) => q.trim()).find((q) => q === 'auth');

  let response: string;
  if (qop) {
    response = md5(`${ha1}:${challenge.nonce}:${nc}:${cnonce}:${qop}:${ha2}`);
  } else {
    response = md5(`${ha1}:${challenge.nonce}:${ha2}`);
  }

  const parts = [
    `username="${username}"`,
    `realm="${challenge.realm}"`,
    `nonce="${challenge.nonce}"`,
    `uri="${uri}"`,
    `response="${response}"`,
  ];
  if (qop) {
    parts.push(`qop=${qop}`, `nc=${nc}`, `cnonce="${cnonce}"`);
  }
  if (challenge.algorithm) parts.push(`algorithm=${challenge.algorithm}`);
  if (challenge.opaque) parts.push(`opaque="${challenge.opaque}"`);

  return `Digest ${parts.join(', ')}`;
}
