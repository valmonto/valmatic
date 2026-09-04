import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Key/value storage that is secure where it can be.
 *
 * iOS/Android: the device keychain/keystore via expo-secure-store — never
 * AsyncStorage, which is plain text. This is the mobile equivalent of the web
 * app's httpOnly cookies, and it is where the auth tokens live.
 *
 * Web: expo-secure-store ships NO web implementation (its web module is an
 * empty object, so every call throws), so the web target falls back to
 * localStorage. That is fine for the web *preview* the mobile rules use for
 * verification; a production web deployment should use the httpOnly-cookie
 * flow the real web app already implements. Every caller in this app that
 * touches secure storage must go through here — a direct `SecureStore.*`
 * call takes down the whole web preview at module load.
 */
const isWeb = Platform.OS === 'web';
const hasLocalStorage = (): boolean => typeof localStorage !== 'undefined';

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) return hasLocalStorage() ? localStorage.getItem(key) : null;
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    if (hasLocalStorage()) localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    if (hasLocalStorage()) localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
