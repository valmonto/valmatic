import { List, ListItem } from '@/components/ui/list';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { useColorScheme } from 'nativewind';
import {
  Bell,
  CircleHelp,
  FileText,
  Globe,
  LogOut,
  Moon,
  ShieldCheck,
  User,
  Vibrate,
} from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </Text>
  );
}

/** Settings — grouped lists, switches, and a destructive sign-out. */
export function SettingsBlock() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const [haptics, setHaptics] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Centered nav title — the back button lives in the empty left slot. */}
      <View className="h-11 flex-row items-center justify-center px-14">
        <Text className="text-base font-semibold text-foreground">Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="gap-5 px-5 pt-2">
          <View className="gap-2">
            <SectionLabel>Account</SectionLabel>
            <List>
              <ListItem icon={User} title="Profile" description="Name, photo and bio" showChevron onPress={() => {}} />
              <ListItem icon={ShieldCheck} iconTone="muted" title="Security" description="Password and 2FA" showChevron onPress={() => {}} />
              <ListItem icon={Bell} iconTone="muted" title="Notifications" value="On" showChevron onPress={() => {}} />
            </List>
          </View>

          <View className="gap-2">
            <SectionLabel>Preferences</SectionLabel>
            <List>
              <ListItem icon={Moon} iconTone="muted" title="Dark mode" trailing={<Switch checked={colorScheme === 'dark'} onCheckedChange={toggleColorScheme} />} />
              <ListItem icon={Vibrate} iconTone="muted" title="Haptic feedback" trailing={<Switch checked={haptics} onCheckedChange={setHaptics} />} />
              <ListItem icon={Globe} iconTone="muted" title="Language" value="English" showChevron onPress={() => {}} />
            </List>
          </View>

          <View className="gap-2">
            <SectionLabel>Support</SectionLabel>
            <List>
              <ListItem icon={CircleHelp} iconTone="muted" title="Help center" showChevron onPress={() => {}} />
              <ListItem icon={FileText} iconTone="muted" title="Terms & privacy" showChevron onPress={() => {}} />
            </List>
          </View>

          <List>
            <ListItem icon={LogOut} destructive title="Sign out" onPress={() => {}} />
          </List>

          <Text className="pt-1 text-center text-[11px] text-muted-foreground">Valmatic v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
