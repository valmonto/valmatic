import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AxiosError } from 'axios';
import { Lock } from 'lucide-react-native';
import { k } from '@pkg/locales';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { useAuthStore } from '@/shared/auth/auth-store';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

/** The server answers with a translation key; anything else is a generic failure. */
function messageKeyOf(error: unknown): string {
  const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
  return typeof message === 'string' ? message : k.common.somethingWentWrong;
}

/**
 * Delete the account from inside the app — the App Store requires it of any
 * app where an account can be made. The password again, then it is gone; the
 * auth gate takes the person back to the sign-in screen.
 */
export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!password) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount(password);
    } catch (e) {
      setError(messageKeyOf(e));
      setDeleting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 justify-center gap-8 px-6">
          <View className="items-center gap-1.5">
            <Text variant="h1" className="text-center text-3xl">
              {t(k.auth.settings.deleteAccountConfirm)}
            </Text>
            <Text variant="muted" className="text-center text-base">
              {t(k.auth.settings.deleteAccountDescription)}
            </Text>
            <Text variant="muted" className="text-center text-base">
              {t(k.auth.settings.deleteAccountWarning)}
            </Text>
          </View>

          <View className="gap-3.5">
            <View className="h-13 flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4">
              <Icon as={Lock} size={18} className="text-muted-foreground" />
              <Input
                className="h-full flex-1 border-0 bg-transparent px-0 shadow-none"
                placeholder={t(k.auth.settings.deleteAccountPassword)}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                editable={!deleting}
                onSubmitEditing={onSubmit}
              />
            </View>
            {error ? (
              <View className="rounded-xl bg-destructive/10 px-4 py-3">
                <Text className="text-sm font-medium text-destructive">{t(error)}</Text>
              </View>
            ) : null}
            <Button
              variant="destructive"
              onPress={onSubmit}
              disabled={deleting || !password}
              className="mt-2 h-13 rounded-2xl"
            >
              <Text className="text-base font-semibold">
                {deleting ? t(k.auth.settings.deletingAccount) : t(k.auth.settings.deleteAccount)}
              </Text>
            </Button>
          </View>

          <Button variant="ghost" onPress={() => router.back()} disabled={deleting}>
            <Text className="font-semibold text-primary">{t(k.common.actions.cancel)}</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
