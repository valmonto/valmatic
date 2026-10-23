import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { Text } from '@/components/ui/text';
import { useAuthStore } from '@/shared/auth/auth-store';

/** The app's starting screen. Replace it with the product's own. */
export default function HomeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const name = user?.displayName ?? user?.name ?? '';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 justify-center gap-2 px-6">
        <Text variant="h1" className="text-3xl">
          {t(k.mobile.home.greeting, { name })}
        </Text>
        <Text variant="muted" className="text-base">
          {t(k.mobile.home.body)}
        </Text>
      </View>
    </SafeAreaView>
  );
}
