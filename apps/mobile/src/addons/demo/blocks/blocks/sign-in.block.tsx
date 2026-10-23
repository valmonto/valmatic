import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { Lock, Mail, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

/** Sign-in screen template — email/password + remember/forgot + SSO. */
export function SignInBlock() {
  const [remember, setRemember] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 justify-center gap-8 px-6">
          {/* Brand + heading */}
          <View className="items-center gap-4">
            <View className="size-16 items-center justify-center rounded-3xl bg-primary shadow-lg shadow-primary/40">
              <Text className="text-3xl font-bold text-primary-foreground">V</Text>
            </View>
            <View className="items-center gap-1.5">
              <Text variant="h1" className="text-3xl">
                Welcome back
              </Text>
              <Text variant="muted" className="text-center text-base">
                Sign in to continue to Valmatic
              </Text>
            </View>
          </View>

          {/* Form */}
          <View className="gap-3.5">
            <View className="gap-1.5">
              <Label>Email</Label>
              <Input
                icon={Mail}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View className="gap-1.5">
              <Label>Password</Label>
              <Input icon={Lock} placeholder="••••••••" secureTextEntry />
            </View>
            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={() => setRemember((v) => !v)}
                className="flex-row items-center gap-2 active:opacity-70"
              >
                <Checkbox checked={remember} onCheckedChange={setRemember} />
                <Text className="text-sm text-foreground">Remember me</Text>
              </Pressable>
              <Text className="text-sm font-medium text-primary">Forgot password?</Text>
            </View>
            <Button className="mt-1 h-13 rounded-2xl shadow-lg shadow-primary/25">
              <Text className="text-base font-semibold">Sign in</Text>
            </Button>
          </View>

          {/* SSO */}
          <View className="gap-3.5">
            <View className="flex-row items-center gap-3">
              <Separator className="flex-1" />
              <Text variant="muted" className="text-xs">
                OR
              </Text>
              <Separator className="flex-1" />
            </View>
            <Button variant="outline" className="h-12 rounded-2xl">
              <Icon as={ShieldCheck} size={18} className="text-foreground" />
              <Text>Continue with SSO</Text>
            </Button>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-center gap-1">
            <Text variant="muted">Don&apos;t have an account?</Text>
            <Text className="font-semibold text-primary">Sign up</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
