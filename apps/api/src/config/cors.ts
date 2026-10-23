/**
 * Who may call the API from a browser, and with which headers.
 *
 * Native apps don't enforce CORS, so this only matters for web clients (the
 * dashboard, the Expo web build, any SPA on another origin).
 *
 * Origins come from CORS_ORIGINS (comma-separated, validated in
 * env.schema.ts). Unset → local development: localhost and the LAN reflected.
 *
 * Headers are a contract between this API and its own clients, so they live
 * here, in code: a client that sends a new request header adds it to
 * CORS_ALLOWED_HEADERS, and a browser's preflight then allows it. Without the
 * entry the browser refuses the request before it is sent.
 */
export const CORS_ALLOWED_HEADERS: readonly string[] = [
  'Content-Type',
  'Authorization',
  'X-Client',
];

const LOCAL_ORIGINS = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
];

export function corsOrigins(configured: string | undefined): (string | RegExp)[] {
  const listed = (configured ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return listed.length > 0 ? listed : LOCAL_ORIGINS;
}
