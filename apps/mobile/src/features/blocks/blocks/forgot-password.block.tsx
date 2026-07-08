import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { KeyRound, Mail } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

/** Forgot-password screen template — request a reset link. */
export function ForgotPasswordBlock() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 justify-center gap-8 px-6">
          <View className="items-center gap-4">
            <View className="size-14 items-center justify-center rounded-2xl bg-primary/10">
              <Icon as={KeyRound} size={26} className="text-primary" />
            </View>
            <View className="items-center gap-1.5">
              <Text variant="h1" className="text-2xl">Forgot password?</Text>
              <Text variant="muted" className="max-w-xs text-center text-base">
                Enter your email and we&apos;ll send you a link to reset it.
              </Text>
            </View>
          </View>

          <View className="gap-3.5">
            <View className="gap-1.5">
              <Label>Email</Label>
              <Input icon={Mail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
            </View>
            <Button className="mt-1 h-13 rounded-2xl shadow-lg shadow-primary/25">
              <Text className="text-base font-semibold">Send reset link</Text>
            </Button>
          </View>

          <View className="flex-row items-center justify-center gap-1">
            <Text variant="muted">Remember your password?</Text>
            <Text className="font-semibold text-primary">Sign in</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
