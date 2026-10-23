import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { ArrowUpCircle } from 'lucide-react-native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { StyleSheet, View } from 'react-native';
import { compareVersions, getConfiguredMinVersion, getCurrentVersion, openStore } from './version';

function ForceUpdateScreen({ appStoreId }: { appStoreId?: string }) {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 items-center justify-center gap-7 bg-background px-8">
      <View className="size-20 items-center justify-center rounded-full bg-primary/10">
        <Icon as={ArrowUpCircle} size={40} className="text-primary" />
      </View>
      <View className="items-center gap-2">
        <Text variant="h1" className="text-2xl">
          {t(k.common.update.required)}
        </Text>
        <Text variant="muted" className="max-w-xs text-center text-base leading-relaxed">
          {t(k.common.update.requiredBody)}
        </Text>
      </View>
      <Button
        onPress={() => openStore(appStoreId)}
        className="h-13 rounded-2xl px-8 shadow-lg shadow-primary/25"
      >
        <Text className="text-base font-semibold">{t(k.common.update.updateNow)}</Text>
      </Button>
    </SafeAreaView>
  );
}

type ForceUpdateGateProps = {
  /** Defaults to app config `extra.minAppVersion`; pass an API-fetched value to
   *  force updates without shipping a new build. */
  minVersion?: string;
  /** Numeric App Store id — deep-links iOS straight to the listing. Defaults
   *  to app config `extra.appStoreId`. */
  appStoreId?: string;
  children: React.ReactNode;
};

/**
 * Blocks the app with an "Update required" screen when the installed version is
 * below `minVersion`. Renders `children` (keeping the navigator mounted) and
 * overlays the block, so routing state is preserved underneath.
 */
export function ForceUpdateGate({ minVersion, appStoreId, children }: ForceUpdateGateProps) {
  const min = minVersion ?? getConfiguredMinVersion();
  const mustUpdate = !!min && compareVersions(getCurrentVersion(), min) < 0;

  return (
    <>
      {children}
      {mustUpdate ? (
        <View style={StyleSheet.absoluteFill} className="z-50">
          <ForceUpdateScreen appStoreId={appStoreId} />
        </View>
      ) : null}
    </>
  );
}
