import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { Lock, Mail, User } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

/** Sign-up screen template — name/email/password + terms. */
export function SignUpBlock() {
  const [agreed, setAgreed] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View className="gap-8 px-6 py-8">
            <View className="items-center gap-4">
              <View className="size-16 items-center justify-center rounded-3xl bg-primary shadow-lg shadow-primary/40">
                <Text className="text-3xl font-bold text-primary-foreground">V</Text>
              </View>
              <View className="items-center gap-1.5">
                <Text variant="h1" className="text-3xl">Create account</Text>
                <Text variant="muted" className="text-center text-base">Start your 14-day free trial</Text>
              </View>
            </View>

            <View className="gap-3.5">
              <View className="gap-1.5">
                <Label>Full name</Label>
                <Input icon={User} placeholder="Ada Lovelace" autoCapitalize="words" />
              </View>
              <View className="gap-1.5">
                <Label>Email</Label>
                <Input icon={Mail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
              </View>
              <View className="gap-1.5">
                <Label>Password</Label>
                <Input icon={Lock} placeholder="At least 8 characters" secureTextEntry />
              </View>

              <Pressable onPress={() => setAgreed((v) => !v)} className="mt-1 flex-row items-center gap-2.5 active:opacity-70">
                <Checkbox checked={agreed} onCheckedChange={setAgreed} />
                <Text className="flex-1 text-sm text-muted-foreground">
                  I agree to the <Text className="font-medium text-primary">Terms</Text> and{' '}
                  <Text className="font-medium text-primary">Privacy Policy</Text>
                </Text>
              </Pressable>

              <Button disabled={!agreed} className="mt-1 h-13 rounded-2xl shadow-lg shadow-primary/25">
                <Text className="text-base font-semibold">Create account</Text>
              </Button>
            </View>

            <View className="flex-row items-center justify-center gap-1">
              <Text variant="muted">Already have an account?</Text>
              <Text className="font-semibold text-primary">Sign in</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
