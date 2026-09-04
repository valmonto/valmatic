import { Fragment, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { Link, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react-native';

import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { showcaseEntries } from '../registry';
import { ThemeToggle } from '../components/theme-toggle';

export default function ShowcaseIndexScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return showcaseEntries;
    return showcaseEntries.filter((e) => e.title.toLowerCase().includes(q));
  }, [query]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="gap-4 px-5 pt-2">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="-ml-1 flex-row items-center gap-0.5 active:opacity-70"
            >
              <Icon as={ChevronLeft} size={18} className="text-muted-foreground" />
              <Text className="text-sm font-medium text-muted-foreground">Profile</Text>
            </Pressable>
            <View className="flex-row items-center gap-3">
              <Text variant="muted" className="text-xs">
                {showcaseEntries.length} components
              </Text>
              <ThemeToggle />
            </View>
          </View>

          <Text className="text-3xl font-bold text-foreground">Showcase</Text>

          <Input
            icon={Search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search components"
            autoCapitalize="none"
          />

          <View className="overflow-hidden rounded-2xl border border-border bg-card">
            {visible.map((entry, index) => (
              <Fragment key={entry.id}>
                {index > 0 ? <View className="bg-border h-px" /> : null}
                <Link href={`/showcase/${entry.id}`} asChild>
                  <Pressable className="flex-row items-center justify-between px-4 py-3.5 active:bg-muted">
                    <Text className="text-[15px] text-foreground">{entry.title}</Text>
                    <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
                  </Pressable>
                </Link>
              </Fragment>
            ))}
            {visible.length === 0 ? (
              <View className="py-10">
                <Text variant="muted" className="text-center text-sm">
                  No components match.
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
