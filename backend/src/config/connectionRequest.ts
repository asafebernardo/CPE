import { connectionRequestUrl, env } from './env.js';

/** Hosts ACS platforms (e.g. IXC) typically reject as SSRF / unreachable. */
export function isBlockedConnectionRequestUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== 'http:' && protocol !== 'https:') return true;

    const host = hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.localhost')) {
      return true;
    }
    if (/^10\./.test(host)) return true;
    if (/^192\.168\./.test(host)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
    if (/^169\.254\./.test(host)) return true;
    return false;
  } catch {
    return true;
  }
}

export function getConnectionRequestWarning(url: string): string | undefined {
  if (!isBlockedConnectionRequestUrl(url)) return undefined;
  return (
    'ACS platforms (e.g. IXC) block localhost and private-network Connection Request URLs as SSRF. ' +
    'Set PUBLIC_BASE_URL in backend/.env to a public URL (ngrok, Cloudflare Tunnel, or VPS) ' +
    'that forwards to this CPE, then restart the backend and send a new Inform.'
  );
}

export function getConnectionRequestInfo() {
  const url = connectionRequestUrl;
  const blocked = isBlockedConnectionRequestUrl(url);
  return {
    url,
    username: env.connectionRequestUsername,
    blocked,
    warning: getConnectionRequestWarning(url),
  };
}
