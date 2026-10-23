import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { RefreshCw, WifiOff } from 'lucide-react-native';
import { View } from 'react-native';

/** Error / offline state — reassuring copy and a retry action. */
export function ErrorStateBlock() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center gap-7 bg-background px-8">
      <View className="size-20 items-center justify-center rounded-full bg-muted">
        <Icon as={WifiOff} size={38} className="text-muted-foreground" />
      </View>
      <View className="items-center gap-2">
        <Text variant="h1" className="text-2xl">
          You&apos;re offline
        </Text>
        <Text variant="muted" className="max-w-xs text-center text-base leading-relaxed">
          Check your connection and try again. Any changes you made are saved and will sync.
        </Text>
      </View>
      <Button variant="outline" className="h-12 rounded-2xl px-6">
        <Icon as={RefreshCw} size={16} className="text-foreground" />
        <Text className="font-medium">Try again</Text>
      </Button>
    </SafeAreaView>
  );
}
