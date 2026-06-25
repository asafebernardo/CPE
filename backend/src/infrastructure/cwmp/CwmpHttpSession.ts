import axios, { type AxiosResponse } from 'axios';
import { parseDigestChallenge, buildDigestAuthHeader } from './soap/digestAuth.js';

/** HTTP state for a single TR-069 CWMP session (IXC requires the ixcTr069 cookie). */
export class CwmpHttpSession {
  private cookies: string[] = [];

  constructor(
    private readonly acsUrl: string,
    private readonly username: string,
    private readonly password: string,
  ) {}

  async post(xml: string): Promise<{ status: number; body: string }> {
    const headers: Record<string, string> = {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: '',
    };
    if (this.cookies.length) {
      headers.Cookie = this.cookies.join('; ');
    }

    let response = await this.send(xml, headers);

    if (response.status === 401 && this.username) {
      const wwwAuth = String(
        response.headers['www-authenticate'] ?? response.headers['WWW-Authenticate'] ?? '',
      );
      const challenge = parseDigestChallenge(wwwAuth);
      if (challenge) {
        const target = new URL(this.acsUrl);
        const uri = `${target.pathname}${target.search}`;
        headers.Authorization = buildDigestAuthHeader(
          challenge,
          this.username,
          this.password,
          'POST',
          uri,
        );
        response = await this.send(xml, headers);
      } else {
        const basic = Buffer.from(`${this.username}:${this.password}`).toString('base64');
        headers.Authorization = `Basic ${basic}`;
        response = await this.send(xml, headers);
      }
    }

    this.updateCookies(response);

    if (response.status === 204) {
      return { status: 204, body: '' };
    }

    if (response.status >= 400) {
      const snippet = typeof response.data === 'string' ? response.data.slice(0, 300) : '';
      throw new Error(`ACS returned HTTP ${response.status}${snippet ? `: ${snippet}` : ''}`);
    }

    const body = typeof response.data === 'string' ? response.data : String(response.data ?? '');
    return { status: response.status, body };
  }

  private async send(xml: string, headers: Record<string, string>): Promise<AxiosResponse> {
    return axios.post(this.acsUrl, xml, {
      headers,
      timeout: 60000,
      validateStatus: () => true,
    });
  }

  private updateCookies(response: AxiosResponse): void {
    const setCookie = response.headers['set-cookie'];
    if (!setCookie) return;
    const list = Array.isArray(setCookie) ? setCookie : [setCookie];
    this.cookies = list.map((c) => String(c).split(';')[0]).filter(Boolean);
  }
}

export function parseCwmpNextLevel(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === null || value === undefined) return false;
  const s = String(value).toLowerCase();
  return s === 'true' || s === '1';
}
