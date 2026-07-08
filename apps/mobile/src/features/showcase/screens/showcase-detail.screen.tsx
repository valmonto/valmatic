import { Component, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { showcaseEntries } from '../registry';
import { ThemeToggle } from '../components/theme-toggle';

/** Keeps one flaky demo from taking down the whole showcase. */
class DemoBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <View className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <Text className="text-sm font-medium text-destructive">This demo failed to render</Text>
          <Text variant="muted" className="mt-1 text-xs">{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function ShowcaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const entry = showcaseEntries.find((e) => e.id === id);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="gap-6 px-5 pt-2">
          <View className="flex-row items-center justify-between pt-1">
            <Pressable onPress={() => router.back()} hitSlop={8} className="-ml-1 flex-row items-center gap-0.5 active:opacity-70">
              <Icon as={ChevronLeft} size={18} className="text-muted-foreground" />
              <Text className="text-sm font-medium text-muted-foreground">Showcase</Text>
            </Pressable>
            <ThemeToggle />
          </View>

          {entry ? (
            <>
              <Text className="text-3xl font-bold text-foreground">{entry.title}</Text>
              <View className="items-center pt-1">
                <DemoBoundary>
                  <entry.Demo />
                </DemoBoundary>
              </View>
            </>
          ) : (
            <Text variant="muted">Component not found.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
