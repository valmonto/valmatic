import type { AuthTokens } from '@pkg/contracts';
import { Platform } from 'react-native';
import { deleteItem, getItem, setItem } from '../lib/secure-storage';

/**
 * How this build holds a session.
 *
 * A phone keeps the token pair itself, in the keychain, and sends the access
 * token on every request. A BROWSER must not: anything a page's script can
 * read, a script injected into the page can read too, and a refresh token is
 * weeks of somebody's account. So on the web the API keeps the session in
 * httpOnly cookies — set by the sign-in response, sent by the browser, and
 * invisible to every script, ours included. It is the same session the
 * dashboard uses.
 *
 * With a cookie session there is no token for the app to hold: the getters
 * below answer `null`, the setter does nothing, and "am I signed in?" is
 * answered by asking the server (`GET /auth/me`).
 */
export const cookieSession = Platform.OS === 'web';

/**
 * Token storage: the device keychain/keystore on iOS/Android, localStorage on
 * the web preview. The platform split lives in `shared/lib/secure-storage`
 * so the i18n language override and anything else that persists a secret
 * share one fallback.
 */
const ACCESS_TOKEN_KEY = 'valmatic.accessToken';
const REFRESH_TOKEN_KEY = 'valmatic.refreshToken';

export async function getAccessToken(): Promise<string | null> {
  return cookieSession ? null : getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return cookieSession ? null : getItem(REFRESH_TOKEN_KEY);
}

export async function setTokens(tokens: AuthTokens): Promise<void> {
  if (cookieSession) return;
  await Promise.all([
    setItem(ACCESS_TOKEN_KEY, tokens.accessToken),
    setItem(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([deleteItem(ACCESS_TOKEN_KEY), deleteItem(REFRESH_TOKEN_KEY)]);
}
