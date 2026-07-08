import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { OTPInput } from '@/components/ui/otp-input';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { MailCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

/** OTP / email verification screen template — 6-digit code with resend timer. */
export function OtpVerifyBlock() {
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 justify-center gap-8 px-6">
          <View className="items-center gap-4">
            <View className="size-14 items-center justify-center rounded-2xl bg-primary/10">
              <Icon as={MailCheck} size={26} className="text-primary" />
            </View>
            <View className="items-center gap-1.5">
              <Text variant="h1" className="text-2xl">Verify your email</Text>
              <Text variant="muted" className="max-w-xs text-center text-base">
                Enter the 6-digit code we sent to{'\n'}
                <Text className="font-medium text-foreground">you@example.com</Text>
              </Text>
            </View>
          </View>

          <View className="gap-4">
            <OTPInput value={code} onChange={setCode} autoFocus />
            <Button disabled={code.length < 6} className="h-13 rounded-2xl shadow-lg shadow-primary/25">
              <Text className="text-base font-semibold">Verify</Text>
            </Button>
          </View>

          <View className="flex-row items-center justify-center gap-1">
            <Text variant="muted">Didn&apos;t get the code?</Text>
            {seconds > 0 ? (
              <Text variant="muted" className="tabular-nums">Resend in {seconds}s</Text>
            ) : (
              <Pressable onPress={() => setSeconds(30)} className="active:opacity-70">
                <Text className="font-semibold text-primary">Resend</Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
