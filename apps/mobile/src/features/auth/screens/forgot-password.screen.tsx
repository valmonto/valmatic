import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { k } from '@pkg/locales';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { authApi } from '../api';

/**
 * "I forgot my password": ask for the email. The link in it opens the web
 * app's page, where the new password is chosen; then the user signs in here.
 * The answer is the same whether or not the address has an account.
 */
export default function ForgotPasswordScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onSubmit() {
    if (!email.includes('@')) return;
    setSending(true);
    setFailed(false);
    try {
      await authApi.requestPasswordReset({ email: email.trim(), locale: i18n.language });
      setSent(true);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
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
              {t(k.auth.forgotPasswordTitle)}
            </Text>
            <Text variant="muted" className="text-center text-base">
              {t(k.auth.forgotPasswordDescription)}
            </Text>
          </View>

          {sent ? (
            <View className="rounded-xl bg-muted px-4 py-3">
              <Text className="text-sm">{t(k.auth.resetLinkSent)}</Text>
            </View>
          ) : (
            <View className="gap-3.5">
              <View className="h-13 flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4">
                <Icon as={Mail} size={18} className="text-muted-foreground" />
                <Input
                  className="h-full flex-1 border-0 bg-transparent px-0 shadow-none"
                  placeholder={t(k.auth.email)}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  editable={!sending}
                  onSubmitEditing={onSubmit}
                />
              </View>
              {failed ? (
                <View className="rounded-xl bg-destructive/10 px-4 py-3">
                  <Text className="text-sm font-medium text-destructive">
                    {t(k.common.somethingWentWrong)}
                  </Text>
                </View>
              ) : null}
              <Button
                onPress={onSubmit}
                disabled={sending}
                className="mt-2 h-13 rounded-2xl shadow-lg shadow-primary/25"
              >
                <Text className="text-base font-semibold">
                  {sending ? t(k.auth.sendingResetLink) : t(k.auth.sendResetLink)}
                </Text>
              </Button>
            </View>
          )}

          <Button variant="ghost" onPress={() => router.replace('/login')}>
            <Text className="font-semibold text-primary">{t(k.auth.backToSignIn)}</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
