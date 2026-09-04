import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { blockEntries } from '../registry';

/** Renders a block full-screen with a floating back button overlay. */
export default function BlockDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const entry = blockEntries.find((e) => e.id === id);

  if (!entry) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text variant="muted">Block not found.</Text>
      </SafeAreaView>
    );
  }

  const Screen = entry.Screen;
  return (
    <View className="flex-1 bg-background">
      <Screen />
      <SafeAreaView edges={['top']} pointerEvents="box-none" className="absolute inset-x-0 top-0">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="border-border bg-card/90 m-3 size-9 items-center justify-center rounded-full border active:opacity-70"
        >
          <Icon as={ChevronLeft} size={20} className="text-foreground" />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
