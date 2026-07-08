import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AuthTokens } from '@pkg/contracts';

/**
 * Token storage. On iOS/Android tokens live in the device keychain/keystore via
 * expo-secure-store (never AsyncStorage, which is plain-text) — the mobile
 * equivalent of the web app's httpOnly cookies.
 *
 * expo-secure-store is native-only, so on the web target we fall back to
 * localStorage. That's fine for the web *preview*; a production web deployment
 * should use the httpOnly-cookie flow the real web app already implements.
 */
const ACCESS_TOKEN_KEY = 'valmatic.accessToken';
const REFRESH_TOKEN_KEY = 'valmatic.refreshToken';

const isWeb = Platform.OS === 'web';
const hasLocalStorage = () => typeof localStorage !== 'undefined';

async function getItem(key: string): Promise<string | null> {
  if (isWeb) return hasLocalStorage() ? localStorage.getItem(key) : null;
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    if (hasLocalStorage()) localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    if (hasLocalStorage()) localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

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
