import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { styled } from 'nativewind';

/**
 * NativeWind's `className` polyfill only auto-wraps React Native core components.
 * Third-party components like react-native-safe-area-context's SafeAreaView need
 * to be registered explicitly, otherwise `className` (flex-1, bg-background, …)
 * is silently ignored. `styled()` returns a className-aware version.
 */
export const SafeAreaView = styled(RNSafeAreaView);
