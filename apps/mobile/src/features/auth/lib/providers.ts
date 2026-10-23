import { Platform } from 'react-native';
import type { AuthIdentityProvider, ProviderProof } from '@pkg/contracts';
import { authApi } from '../api';

/** What a provider's sheet handed back, ready for the API. */
export type ProviderResult = ProviderProof & { fullName?: string };

/** The "Web" OAuth client id this build was given, or undefined. */
export function googleClientId(): string | undefined {
  // A literal property access: Expo inlines `process.env.EXPO_PUBLIC_*` at
  // build time only when it can see the whole name.
  const id = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  return id && id.length > 0 ? id : undefined;
}

/** The iOS OAuth client id; Google's sheet on iPhone needs it. */
export function googleIosClientId(): string | undefined {
  const id = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  return id && id.length > 0 ? id : undefined;
}

/**
 * Whether this build can offer a provider. Checked before a button is drawn,
 * never after it is pressed — a button that fails on tap teaches people the
 * app is broken:
 *
 *  1. the server can verify it (`GET /auth/options` lists it);
 *  2. the platform has its sheet — Apple's is iPhone-only, and neither
 *     exists in the web preview;
 *  3. for Google, the build has its client ids (Apple's sheet needs none:
 *     it signs for the app's own bundle id).
 */
export function providerUsable(
  provider: AuthIdentityProvider,
  offered: readonly AuthIdentityProvider[],
  platform: typeof Platform.OS,
  google: { web?: string; ios?: string },
): boolean {
  if (!offered.includes(provider) || platform === 'web') return false;
  if (provider === 'apple') return platform === 'ios';
  return Boolean(google.web) && (platform !== 'ios' || Boolean(google.ios));
}

export function usableProviders(offered: readonly AuthIdentityProvider[]): AuthIdentityProvider[] {
  const google = { web: googleClientId(), ios: googleIosClientId() };
  return (['apple', 'google'] as const).filter((p) =>
    providerUsable(p, offered, Platform.OS, google),
  );
}

/**
 * Open the provider's own sheet and return its proof, or `null` when the
 * person closed it (a choice, not an error). Throws when sign-in failed.
 *
 * The native modules are imported here, not at the top of a file: neither
 * has a browser implementation, and a module-scope import takes the web
 * preview down.
 */
export async function askProvider(provider: AuthIdentityProvider): Promise<ProviderResult | null> {
  return provider === 'apple' ? askApple() : askGoogle();
}

async function askApple(): Promise<ProviderResult | null> {
  const AppleAuthentication = await import('expo-apple-authentication');
  // From our server first: Apple signs it into the token, and the server
  // refuses an Apple token without one it handed out.
  const { nonce } = await authApi.providerNonce();
  try {
    const credential = await AppleAuthentication.signInAsync({
      nonce,
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) throw new Error('Apple returned no identity token');
    // Apple gives the name on the first sign-in only, and never in the token.
    const parts = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean);
    return {
      provider: 'apple',
      identityToken: credential.identityToken,
      nonce,
      fullName: parts.length > 0 ? parts.join(' ') : undefined,
    };
  } catch (error) {
    if ((error as { code?: string } | null)?.code === 'ERR_REQUEST_CANCELED') return null;
    throw error;
  }
}

/**
 * Google's own account sheet, not a browser window. `webClientId` is the
 * "Web" OAuth client on every platform: it is the audience Google writes into
 * the token, so the id the server checks (`AUTH_GOOGLE_CLIENT_ID`). The
 * Android client is matched by package and signing key, never named here.
 */
async function askGoogle(): Promise<ProviderResult | null> {
  const { GoogleSignin, isSuccessResponse } =
    await import('@react-native-google-signin/google-signin');
  GoogleSignin.configure({ webClientId: googleClientId(), iosClientId: googleIosClientId() });
  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }
  // Ask which account every time; otherwise the sheet quietly reuses the
  // last one and a wrong pick can never be undone.
  await GoogleSignin.signOut().catch(() => undefined);
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return null;
  if (!response.data.idToken) throw new Error('Google returned no identity token');
  return { provider: 'google', identityToken: response.data.idToken };
}
