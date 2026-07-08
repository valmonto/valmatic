import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { toast } from 'sonner-native';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Blocks,
  Check,
  ChevronRight,
  CircleHelp,
  FileText,
  Globe,
  LayoutGrid,
  LogOut,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
  Vibrate,
  type LucideIcon,
} from 'lucide-react-native';

import { Icon } from '@/components/ui/icon';
import { Sheet } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { setLanguage, supportedLanguages } from '@/shared/lib/i18n';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/shared/auth/auth-store';

const LANGUAGE_META: Record<string, { flag: string; native: string }> = {
  en: { flag: '🇬🇧', native: 'English' },
  es: { flag: '🇪🇸', native: 'Español' },
  lt: { flag: '🇱🇹', native: 'Lietuvių' },
};

const menuItems: { label: string; icon: LucideIcon }[] = [
  { label: 'Security & sessions', icon: ShieldCheck },
  { label: 'Connected devices', icon: Smartphone },
  { label: 'Help & support', icon: CircleHelp },
  { label: 'Terms of service', icon: FileText },
];

function PreferenceRow({
  icon,
  label,
  description,
  checked,
  onCheckedChange,
  border,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  border?: boolean;
}) {
  return (
    <View className={cn('flex-row items-center gap-3 px-3.5 py-3', border && 'border-t border-border')}>
      <View className="h-8 w-8 items-center justify-center rounded-full bg-muted">
        <Icon as={icon} size={16} className="text-muted-foreground" />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[13px] font-medium text-foreground">{label}</Text>
        <Text className="text-[11px] text-muted-foreground">{description}</Text>
      </View>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </View>
  );
}

export default function ProfileScreen() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { i18n } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [langOpen, setLangOpen] = useState(false);

  const name = user?.displayName ?? user?.name ?? 'Alex Morgan';
  const email = user?.email ?? 'alex@acme.dev';
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="gap-4 px-5 pt-4">
          <Text className="text-2xl font-semibold text-foreground">Profile</Text>

          {/* Identity card */}
          <View className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/5">
            <View className="items-center px-4 pb-5 pt-7">
              <LinearGradient
                colors={['#5a60c2', '#7c82d9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ height: 64, width: 64, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text className="text-lg font-semibold text-primary-foreground">{initials}</Text>
              </LinearGradient>
              <Text className="mt-3 text-base font-semibold text-foreground">{name}</Text>
              <Text className="text-xs text-muted-foreground">{email}</Text>
              <View className="mt-2 rounded-full bg-primary/10 px-2.5 py-0.5">
                <Text className="text-[10px] font-semibold text-primary">
                  {user?.role ?? 'Product Engineer'}
                </Text>
              </View>
            </View>
            <View className="flex-row border-t border-border">
              {[
                { value: '128', label: 'Tasks' },
                { value: '9', label: 'This week' },
                { value: '97%', label: 'On time' },
              ].map((stat, i) => (
                <View
                  key={stat.label}
                  className={cn('flex-1 items-center py-3', i > 0 && 'border-l border-border')}
                >
                  <Text className="text-sm font-semibold text-foreground">{stat.value}</Text>
                  <Text className="text-[10px] text-muted-foreground">{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Preferences */}
          <View className="gap-2">
            <Text className="px-1 text-[11px] font-medium uppercase tracking-[1.2px] text-muted-foreground/70">
              Preferences
            </Text>
            <View className="rounded-2xl border border-border bg-card shadow-sm shadow-black/5">
              <PreferenceRow
                icon={colorScheme === 'dark' ? Moon : Sun}
                label="Dark mode"
                description="Switch the app theme"
                checked={colorScheme === 'dark'}
                onCheckedChange={toggleColorScheme}
              />
              <PreferenceRow
                icon={Bell}
                label="Push notifications"
                description="Mentions, assignments and deploys"
                checked={pushEnabled}
                onCheckedChange={setPushEnabled}
                border
              />
              <PreferenceRow
                icon={Vibrate}
                label="Haptic feedback"
                description="Vibrate on key interactions"
                checked={hapticsEnabled}
                onCheckedChange={setHapticsEnabled}
                border
              />
              <Pressable
                onPress={() => setLangOpen(true)}
                className="flex-row items-center gap-3 border-t border-border px-3.5 py-3 active:bg-muted/40"
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Icon as={Globe} size={16} className="text-muted-foreground" />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-[13px] font-medium text-foreground">Language</Text>
                  <Text className="text-[11px] text-muted-foreground">
                    {LANGUAGE_META[i18n.language]?.flag} {LANGUAGE_META[i18n.language]?.native ?? i18n.language}
                  </Text>
                </View>
                <Icon as={ChevronRight} size={16} className="text-muted-foreground/50" />
              </Pressable>
            </View>
          </View>

          <Sheet open={langOpen} onOpenChange={setLangOpen} title="Language" description="Choose your language">
            <View className="gap-1">
              {supportedLanguages.map((lang) => {
                const meta = LANGUAGE_META[lang];
                const active = i18n.language === lang;
                return (
                  <Pressable
                    key={lang}
                    onPress={() => {
                      setLanguage(lang);
                      setLangOpen(false);
                    }}
                    className={cn(
                      'flex-row items-center gap-3 rounded-xl px-3 py-3 active:bg-muted',
                      active && 'bg-muted'
                    )}
                  >
                    <Text className="text-2xl">{meta?.flag}</Text>
                    <Text className="flex-1 text-[15px] text-foreground">{meta?.native ?? lang}</Text>
                    {active ? <Icon as={Check} size={18} className="text-primary" /> : null}
                  </Pressable>
                );
              })}
            </View>
          </Sheet>

          {/* Account menu */}
          <View className="gap-2">
            <Text className="px-1 text-[11px] font-medium uppercase tracking-[1.2px] text-muted-foreground/70">
              Account
            </Text>
            <View className="rounded-2xl border border-border bg-card shadow-sm shadow-black/5">
              {menuItems.map((item, index) => (
                <Pressable
                  key={item.label}
                  onPress={() => toast('Demo only', { description: 'This screen is not part of the demo.' })}
                  className={cn(
                    'flex-row items-center gap-3 px-3.5 py-3 active:bg-muted/40',
                    index > 0 && 'border-t border-border'
                  )}
                >
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Icon as={item.icon} size={16} className="text-muted-foreground" />
                  </View>
                  <Text className="flex-1 text-[13px] font-medium text-foreground">{item.label}</Text>
                  <Icon as={ChevronRight} size={16} className="text-muted-foreground/50" />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Developer */}
          <View className="gap-2">
            <Text className="px-1 text-[11px] font-medium uppercase tracking-[1.2px] text-muted-foreground/70">
              Developer
            </Text>
            <View className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/5">
              <Pressable
                onPress={() => router.push('/showcase')}
                className="flex-row items-center gap-3 px-3.5 py-3 active:bg-muted/40"
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Icon as={LayoutGrid} size={16} className="text-primary" />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-medium text-foreground">Component showcase</Text>
                  <Text className="text-[11px] text-muted-foreground">Browse all UI components</Text>
                </View>
                <Icon as={ChevronRight} size={16} className="text-muted-foreground/50" />
              </Pressable>
              <View className="bg-border h-px" />
              <Pressable
                onPress={() => router.push('/blocks')}
                className="flex-row items-center gap-3 px-3.5 py-3 active:bg-muted/40"
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Icon as={Blocks} size={16} className="text-primary" />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-medium text-foreground">Blocks</Text>
                  <Text className="text-[11px] text-muted-foreground">Ready-made screen templates</Text>
                </View>
                <Icon as={ChevronRight} size={16} className="text-muted-foreground/50" />
              </Pressable>
            </View>
          </View>

          {/* Sign out */}
          <Pressable
            onPress={signOut}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 shadow-sm shadow-black/5 active:opacity-80"
          >
            <Icon as={LogOut} size={16} className="text-destructive" />
            <Text className="text-[13px] font-medium text-destructive">Sign out</Text>
          </Pressable>

          <Text className="pb-2 text-center text-[11px] text-muted-foreground/60">
            Valmatic mobile · demo data
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
