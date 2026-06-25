import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

const port = parseInt(process.env.PORT || '3001', 10);

export const env = {
  port,
  jwtSecret: process.env.JWT_SECRET || 'aerobrry-dev-secret',
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'file:./prisma/dev.db',

  /**
   * Public base URL the ACS uses to reach this CPE for TR-069 Connection
   * Requests. Point it at your tunnel/public host (e.g. an ngrok / Cloudflare
   * Tunnel URL or a VPS). Defaults to localhost (only reachable locally).
   */
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || `http://localhost:${port}`).replace(/\/+$/, ''),
  /** Path of the public Connection Request endpoint (no JWT). */
  connectionRequestPath: process.env.CONNECTION_REQUEST_PATH || '/cwmp/connection-request',
  /**
   * Optional credentials the ACS must use (HTTP Digest) to trigger a
   * Connection Request. Leave empty to accept unauthenticated requests
   * (fine for a local/test simulator).
   */
  connectionRequestUsername: process.env.CONNECTION_REQUEST_USERNAME || '',
  connectionRequestPassword: process.env.CONNECTION_REQUEST_PASSWORD || '',
};

/** Fully-qualified Connection Request URL reported to the ACS in Informs. */
export const connectionRequestUrl = `${env.publicBaseUrl}${env.connectionRequestPath}`;
