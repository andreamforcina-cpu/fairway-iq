import { baseUrl } from './api';

export type Profile = { id: string; full_name: string; email: string; created_at: string };
export type TokenPair = { access_token: string; refresh_token: string; expires_in: number; refresh_expires_in: number; token_type: 'bearer' };
export class AuthError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}
export function validRefresh(value: unknown): value is string {
  return typeof value === 'string' && /^fiqr_[A-Za-z0-9_-]{43}$/.test(value);
}
function pair(value: unknown): TokenPair {
  const data = value as Partial<TokenPair> | null;
  if (!data || typeof data.access_token !== 'string' || !/^fiqa_[A-Za-z0-9_-]{43}$/.test(data.access_token) || !validRefresh(data.refresh_token) || data.token_type !== 'bearer' || !Number.isInteger(data.expires_in) || data.expires_in! <= 0 || data.expires_in! > 900 || !Number.isInteger(data.refresh_expires_in) || data.refresh_expires_in! <= 0 || data.refresh_expires_in! > 2592000) throw new AuthError(0, 'Unexpected authentication response. Please log in again.');
  return { access_token: data.access_token, refresh_token: data.refresh_token, token_type: 'bearer', expires_in: data.expires_in!, refresh_expires_in: data.refresh_expires_in! };
}
async function request(path: string, body?: object, access?: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${baseUrl()}${path}`, {
      method: body ? 'POST' : 'GET', signal: controller.signal, credentials: 'omit', redirect: 'error', cache: 'no-store',
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(access ? { Authorization: `Bearer ${access}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    // Never render server bodies, validation payloads or transport error details.
    if (!response.ok) throw new AuthError(response.status,
      response.status === 401 ? 'Invalid credentials or expired session. Please log in again.' :
        response.status === 429 ? 'Too many attempts. Please wait a minute and try again.' :
          response.status === 409 ? 'Unable to create an account with these details.' :
            response.status === 422 ? 'Check your details and try again.' : 'Authentication is temporarily unavailable.');
    return response.status === 204 ? undefined : await response.json();
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError(0, 'Unable to connect. Check API configuration and connectivity.');
  } finally { clearTimeout(timer); }
}
export const sessionApi = {
  async login(email: string, password: string) { return pair(await request('/auth/token', { email: email.trim(), password })); },
  async refresh(refresh_token: string) { return pair(await request('/auth/refresh', { refresh_token })); },
  async logout(refresh_token: string) { await request('/auth/logout', { refresh_token }); },
  async register(full_name: string, email: string, password: string) { await request('/auth/register', { full_name: full_name.trim(), email: email.trim(), password }); },
  async me(access: string): Promise<Profile> {
    const data = await request('/auth/me', undefined, access) as Partial<Profile> | null;
    if (!data || typeof data.id !== 'string' || typeof data.full_name !== 'string' || !data.full_name || typeof data.email !== 'string' || typeof data.created_at !== 'string' || !Number.isFinite(Date.parse(data.created_at))) throw new AuthError(0, 'Unexpected profile response. Please log in again.');
    return { id: data.id, full_name: data.full_name, email: data.email, created_at: data.created_at };
  },
};
