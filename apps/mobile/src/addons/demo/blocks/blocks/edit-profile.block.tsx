import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { AtSign, Camera, Mail } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

/** Edit profile — avatar with change badge and a form of fields. */
export function EditProfileBlock() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Nav bar: back slot (left) · title · Save */}
      <View className="h-11 flex-row items-center justify-between px-4">
        <View className="w-12" />
        <Text className="text-base font-semibold text-foreground">Edit profile</Text>
        <Pressable hitSlop={8} className="active:opacity-70">
          <Text className="text-sm font-semibold text-primary">Save</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <View className="gap-6 px-5 pt-3">
            {/* Avatar */}
            <View className="items-center gap-2">
              <View>
                <Avatar alt="Alex Morgan" className="size-24">
                  <AvatarImage source={{ uri: 'https://i.pravatar.cc/160?img=15' }} />
                  <AvatarFallback>
                    <Text className="text-xl font-semibold">AM</Text>
                  </AvatarFallback>
                </Avatar>
                <View className="bg-background absolute -bottom-1 -right-1 rounded-full p-0.5">
                  <View className="bg-primary size-8 items-center justify-center rounded-full">
                    <Icon as={Camera} size={15} className="text-primary-foreground" />
                  </View>
                </View>
              </View>
              <Text className="text-sm font-medium text-primary">Change photo</Text>
            </View>

            {/* Form */}
            <View className="gap-4">
              <View className="gap-1.5">
                <Label>Full name</Label>
                <Input defaultValue="Alex Morgan" autoCapitalize="words" />
              </View>
              <View className="gap-1.5">
                <Label>Username</Label>
                <Input icon={AtSign} defaultValue="alexmorgan" autoCapitalize="none" />
              </View>
              <View className="gap-1.5">
                <Label>Email</Label>
                <Input
                  icon={Mail}
                  defaultValue="alex@acme.dev"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <View className="gap-1.5">
                <Label>Bio</Label>
                <Textarea
                  placeholder="Tell us about yourself…"
                  maxLength={160}
                  defaultValue="Product engineer building delightful mobile experiences."
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
