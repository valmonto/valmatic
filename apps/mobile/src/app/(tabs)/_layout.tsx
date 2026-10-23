import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { House, User, type LucideIcon } from 'lucide-react-native';
import { k } from '@pkg/locales';
import { addons } from '@/addons.generated';

function tabIcon(TabIcon: LucideIcon) {
  function TabBarIcon({ color, size }: { color: ColorValue; size: number }) {
    return <TabIcon size={size} color={color as string} />;
  }
  return TabBarIcon;
}

/**
 * Home and Profile, with any add-on's tabs between them (docs/addons.md).
 * An add-on may also bring its own tab bar.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const tabBar = addons.find((addon) => addon.tabBar)?.tabBar;

  return (
    <Tabs tabBar={tabBar} screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: t(k.mobile.tabs.home), tabBarIcon: tabIcon(House) }}
      />
      {addons.flatMap((addon) =>
        (addon.tabs ?? []).map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{ title: t(tab.titleKey), tabBarIcon: tabIcon(tab.icon) }}
          />
        )),
      )}
      <Tabs.Screen
        name="profile"
        options={{ title: t(k.mobile.tabs.profile), tabBarIcon: tabIcon(User) }}
      />
    </Tabs>
  );
}
