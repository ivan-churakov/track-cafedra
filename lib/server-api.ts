/** Server-only requests use the Docker network, never the browser's origin. */
export async function serverApiFetch<T>(path: string): Promise<T> {
  const base = (process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Backend request failed: ${response.status}`);
  return response.json() as Promise<T>;
}
