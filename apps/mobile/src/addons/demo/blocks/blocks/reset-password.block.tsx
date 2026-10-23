import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { Lock, LockKeyhole } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

/** Reset-password screen template — set a new password. */
export function ResetPasswordBlock() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 justify-center gap-8 px-6">
          <View className="items-center gap-4">
            <View className="size-14 items-center justify-center rounded-2xl bg-primary/10">
              <Icon as={LockKeyhole} size={26} className="text-primary" />
            </View>
            <View className="items-center gap-1.5">
              <Text variant="h1" className="text-2xl">
                Set a new password
              </Text>
              <Text variant="muted" className="max-w-xs text-center text-base">
                Your new password must be different from previously used ones.
              </Text>
            </View>
          </View>

          <View className="gap-3.5">
            <View className="gap-1.5">
              <Label>New password</Label>
              <Input icon={Lock} placeholder="At least 8 characters" secureTextEntry />
            </View>
            <View className="gap-1.5">
              <Label>Confirm password</Label>
              <Input icon={Lock} placeholder="Re-enter password" secureTextEntry />
            </View>
            <Button className="mt-1 h-13 rounded-2xl shadow-lg shadow-primary/25">
              <Text className="text-base font-semibold">Reset password</Text>
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
