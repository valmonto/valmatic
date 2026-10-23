import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { k, languageFlag, languageName } from '@pkg/locales';
import { Check, ChevronRight, Globe, LogOut, Moon, Sun, Trash2 } from 'lucide-react-native';
import { addons } from '@/addons.generated';
import { Icon } from '@/components/ui/icon';
import { Sheet } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { useAuthStore } from '@/shared/auth/auth-store';
import { setLanguage, supportedLanguages } from '@/shared/lib/i18n';
import { cn } from '@/shared/lib/utils';

/**
 * Who is signed in, the app's preferences, and the account's way out: sign
 * out, or delete the account (the App Store requires that in the app). Pages
 * an add-on brings are listed here too.
 */
export default function ProfileScreen() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [langOpen, setLangOpen] = useState(false);

  const name = user?.displayName ?? user?.name ?? '';
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const links = addons.flatMap((addon) => addon.links ?? []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="gap-4 px-5 pt-4">
          <Text className="text-2xl font-semibold text-foreground">{t(k.mobile.tabs.profile)}</Text>

          <View className="items-center rounded-2xl border border-border bg-card px-4 pb-5 pt-7">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Text className="text-lg font-semibold text-primary-foreground">{initials}</Text>
            </View>
            <Text className="mt-3 text-base font-semibold text-foreground">{name}</Text>
            <Text className="text-xs text-muted-foreground">{user?.email}</Text>
          </View>

          <Section title={t(k.mobile.profile.preferences)}>
            <View className="flex-row items-center gap-3 px-3.5 py-3">
              <RowIcon icon={colorScheme === 'dark' ? Moon : Sun} />
              <View className="min-w-0 flex-1">
                <Text className="text-[13px] font-medium text-foreground">
                  {t(k.mobile.profile.darkMode)}
                </Text>
                <Text className="text-[11px] text-muted-foreground">
                  {t(k.mobile.profile.darkModeDescription)}
                </Text>
              </View>
              <Switch checked={colorScheme === 'dark'} onCheckedChange={toggleColorScheme} />
            </View>
            {supportedLanguages.length > 1 ? (
              <Pressable
                onPress={() => setLangOpen(true)}
                className="flex-row items-center gap-3 border-t border-border px-3.5 py-3 active:bg-muted/40"
              >
                <RowIcon icon={Globe} />
                <View className="min-w-0 flex-1">
                  <Text className="text-[13px] font-medium text-foreground">
                    {t(k.mobile.profile.language)}
                  </Text>
                  <Text className="text-[11px] text-muted-foreground">
                    {languageFlag(i18n.language)} {languageName(i18n.language)}
                  </Text>
                </View>
                <Icon as={ChevronRight} size={16} className="text-muted-foreground/50" />
              </Pressable>
            ) : null}
          </Section>

          <Sheet
            open={langOpen}
            onOpenChange={setLangOpen}
            title={t(k.mobile.profile.language)}
            description={t(k.mobile.profile.chooseLanguage)}
          >
            <View className="gap-1">
              {supportedLanguages.map((lang) => (
                <Pressable
                  key={lang}
                  onPress={() => {
                    void setLanguage(lang);
                    setLangOpen(false);
                  }}
                  className={cn(
                    'flex-row items-center gap-3 rounded-xl px-3 py-3 active:bg-muted',
                    i18n.language === lang && 'bg-muted',
                  )}
                >
                  <Text className="text-2xl">{languageFlag(lang)}</Text>
                  <Text className="flex-1 text-[15px] text-foreground">{languageName(lang)}</Text>
                  {i18n.language === lang ? (
                    <Icon as={Check} size={18} className="text-primary" />
                  ) : null}
                </Pressable>
              ))}
            </View>
          </Sheet>

          {links.length > 0 ? (
            <Section title={t(k.mobile.home.explore)}>
              {links.map((link, index) => (
                <Pressable
                  key={String(link.href)}
                  onPress={() => router.push(link.href)}
                  className={cn(
                    'flex-row items-center gap-3 px-3.5 py-3 active:bg-muted/40',
                    index > 0 && 'border-t border-border',
                  )}
                >
                  <RowIcon icon={link.icon} />
                  <View className="flex-1">
                    <Text className="text-[13px] font-medium text-foreground">
                      {t(link.titleKey)}
                    </Text>
                    {link.descriptionKey ? (
                      <Text className="text-[11px] text-muted-foreground">
                        {t(link.descriptionKey)}
                      </Text>
                    ) : null}
                  </View>
                  <Icon as={ChevronRight} size={16} className="text-muted-foreground/50" />
                </Pressable>
              ))}
            </Section>
          ) : null}

          <Pressable
            onPress={() => void signOut()}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 active:opacity-80"
          >
            <Icon as={LogOut} size={16} className="text-destructive" />
            <Text className="text-[13px] font-medium text-destructive">{t(k.auth.logOut)}</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/delete-account')}
            className="flex-row items-center justify-center gap-2 py-2 active:opacity-60"
          >
            <Icon as={Trash2} size={14} className="text-muted-foreground" />
            <Text className="text-[12px] text-muted-foreground">
              {t(k.auth.settings.deleteAccount)}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="px-1 text-[11px] font-medium uppercase tracking-[1.2px] text-muted-foreground/70">
        {title}
      </Text>
      <View className="overflow-hidden rounded-2xl border border-border bg-card">{children}</View>
    </View>
  );
}

function RowIcon({ icon }: { icon: React.ComponentProps<typeof Icon>['as'] }) {
  return (
    <View className="h-8 w-8 items-center justify-center rounded-full bg-muted">
      <Icon as={icon} size={16} className="text-muted-foreground" />
    </View>
  );
}
