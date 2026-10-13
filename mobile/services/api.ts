export type HealthResponse = { status: 'healthy' };
export type WelcomeResponse = { message: string; status: 'running' };

function baseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (!configured) throw new Error('API is not configured. Set EXPO_PUBLIC_API_URL.');
  const url = new URL(configured);
  if (url.username || url.password || url.search || url.hash) throw new Error('Invalid API URL configuration.');
  if (url.protocol !== 'https:' && !(__DEV__ && url.protocol === 'http:')) throw new Error('API requests require HTTPS.');
  return url.toString().replace(/\/$/, '');
}
async function request(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${baseUrl()}${path}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('The service is temporarily unavailable.');
    return await response.json();
  } catch {
    throw new Error('Unable to connect. Check API configuration and connectivity.');
  } finally { clearTimeout(timeout); }
}
export const api = {
  async health(): Promise<HealthResponse> {
    const data = await request('/health');
    if (!data || typeof data !== 'object' || !('status' in data) || data.status !== 'healthy') throw new Error('Unexpected health response.');
    return { status: 'healthy' };
  },
  async welcome(): Promise<WelcomeResponse> {
    const data = await request('/');
    if (!data || typeof data !== 'object' || !('message' in data) || typeof data.message !== 'string' || !('status' in data) || data.status !== 'running') throw new Error('Unexpected welcome response.');
    return { message: data.message, status: 'running' };
  },
};
