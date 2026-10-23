import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { blockEntries } from '../registry';

export default function BlocksIndexScreen() {
  const router = useRouter();
  const categories = [...new Set(blockEntries.map((b) => b.category))];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="gap-5 px-5 pt-2">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="-ml-1 flex-row items-center gap-0.5 active:opacity-70"
            >
              <Icon as={ChevronLeft} size={18} className="text-muted-foreground" />
              <Text className="text-sm font-medium text-muted-foreground">Profile</Text>
            </Pressable>
            <Text variant="muted" className="text-xs">
              {blockEntries.length} blocks
            </Text>
          </View>

          <View className="gap-1">
            <Text className="text-3xl font-bold text-foreground">Blocks</Text>
            <Text variant="muted" className="text-sm">
              Ready-made screen templates composed from the components.
            </Text>
          </View>

          {categories.map((category) => (
            <View key={category} className="gap-2">
              <Text className="px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {category}
              </Text>
              <View className="gap-2">
                {blockEntries
                  .filter((b) => b.category === category)
                  .map((block) => (
                    <Pressable
                      key={block.id}
                      onPress={() => router.push(`/blocks/${block.id}`)}
                      className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4 active:bg-muted"
                    >
                      <View className="size-10 items-center justify-center rounded-full bg-primary/10">
                        <Icon as={block.icon} size={20} className="text-primary" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[15px] font-medium text-foreground">
                          {block.title}
                        </Text>
                        <Text variant="muted" className="text-[13px]">
                          {block.description}
                        </Text>
                      </View>
                      <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
                    </Pressable>
                  ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
