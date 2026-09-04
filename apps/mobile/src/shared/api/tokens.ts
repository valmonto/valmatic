import type { AuthTokens } from '@pkg/contracts';
import { deleteItem, getItem, setItem } from '../lib/secure-storage';

/**
 * Token storage: the device keychain/keystore on iOS/Android, localStorage on
 * the web preview. The platform split lives in `shared/lib/secure-storage`
 * so the i18n language override and anything else that persists a secret
 * share one fallback.
 */
const ACCESS_TOKEN_KEY = 'valmatic.accessToken';
const REFRESH_TOKEN_KEY = 'valmatic.refreshToken';

export async function getAccessToken(): Promise<string | null> {
  return getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_TOKEN_KEY);
}

export async function setTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    setItem(ACCESS_TOKEN_KEY, tokens.accessToken),
    setItem(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([deleteItem(ACCESS_TOKEN_KEY), deleteItem(REFRESH_TOKEN_KEY)]);
}
