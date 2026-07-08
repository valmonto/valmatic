import { useColorScheme } from 'nativewind';

/**
 * Concrete theme colors for contexts that can't consume CSS-var tokens — SVG
 * `stroke`/`fill`, native pickers, etc. Mirrors the `--primary`/border tokens.
 * (Same tradeoff as the Modal/Toast surface tints.)
 */
export function useThemeColors() {
  const dark = useColorScheme().colorScheme === 'dark';
  return {
    primary: '#6366f1',
    track: dark ? 'rgba(255,255,255,0.12)' : '#e8e8ea',
    amber: '#f59e0b',
    starEmpty: dark ? '#3f3f46' : '#d4d4d8',
    foreground: dark ? '#ededf0' : '#26262b',
    mutedForeground: dark ? '#9a9aa7' : '#6f6f78',
  };
}
