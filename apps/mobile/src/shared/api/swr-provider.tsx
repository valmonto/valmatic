import * as React from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { SWRConfig } from 'swr';

/** Revalidate when the app returns to the foreground (SWR's browser `focus`
 *  event doesn't exist in React Native — wire it to AppState instead). */
function initFocus(callback: () => void) {
  let current = AppState.currentState;
  const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
    if (current.match(/inactive|background/) && next === 'active') callback();
    current = next;
  });
  return () => sub.remove();
}

/**
 * App-wide SWR config for React Native. Mount once at the root; every
 * `useCachedRequest` hook shares this cache + revalidation behavior.
 */
export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: () => new Map(),
        isVisible: () => true,
        initFocus,
        revalidateOnFocus: true,
        shouldRetryOnError: false,
      }}>
      {children}
    </SWRConfig>
  );
}
