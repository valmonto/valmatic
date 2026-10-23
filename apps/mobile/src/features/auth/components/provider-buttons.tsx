import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import type { AuthIdentityProvider } from '@pkg/contracts';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';

/**
 * One provider's button. Apple's is black with white text and Google's is
 * outlined with its four-colour mark — both companies publish rules for
 * their button. The marks are inline SVG, sharp at every density.
 */
export function ProviderButton({
  provider,
  label,
  onPress,
  disabled,
}: {
  provider: AuthIdentityProvider;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const apple = provider === 'apple';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={`sign-in-${provider}`}
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'h-13 flex-row items-center justify-center gap-2.5 rounded-2xl active:opacity-85',
        apple ? 'bg-black dark:bg-white' : 'border border-border bg-card',
        disabled && 'opacity-50',
      )}
    >
      {apple ? <AppleMark /> : <GoogleMark />}
      <Text
        className={cn(
          'text-base font-semibold',
          apple ? 'text-white dark:text-black' : 'text-foreground',
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** "Continue with Apple / Google" for each usable provider. */
export function ProviderButtons({
  providers,
  onPress,
  disabled,
}: {
  providers: AuthIdentityProvider[];
  onPress: (provider: AuthIdentityProvider) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  if (providers.length === 0) return null;
  return (
    <View className="gap-3">
      {providers.map((provider) => (
        <ProviderButton
          key={provider}
          provider={provider}
          label={t(provider === 'apple' ? k.auth.continueWithApple : k.auth.continueWithGoogle)}
          onPress={() => onPress(provider)}
          disabled={disabled}
        />
      ))}
    </View>
  );
}

export function OrDivider() {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-px flex-1 bg-border" />
      <Text className="text-xs uppercase text-muted-foreground">{t(k.auth.or)}</Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}

function AppleMark() {
  // Apple's button is black in light mode and white in dark; the mark is the opposite.
  const { colorScheme } = useColorScheme();
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24">
      <Path
        fill={colorScheme === 'dark' ? '#000000' : '#ffffff'}
        d="M17.05 12.53c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.19-1.72-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.18-1.54 2.67-.39 6.62 1.11 8.79.73 1.06 1.6 2.25 2.75 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.71.71 2.88.69 1.19-.02 1.94-1.08 2.67-2.14.84-1.23 1.19-2.42 1.2-2.48-.03-.01-2.3-.88-2.32-3.54zM14.9 5.6c.61-.74 1.02-1.77.91-2.8-.88.04-1.94.59-2.57 1.32-.56.65-1.05 1.7-.92 2.7.98.08 1.98-.5 2.58-1.22z"
      />
    </Svg>
  );
}

function GoogleMark() {
  return (
    <Svg width={17} height={17} viewBox="0 0 48 48">
      <Path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <Path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <Path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <Path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </Svg>
  );
}
