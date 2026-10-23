import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { Search, SquareCheckBig } from 'lucide-react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { TaskCard } from '../components/task-card';
import { useMobileDemoStore } from '../store';

type Filter = 'all' | 'active' | 'done';
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'done', label: 'Done' },
];

export default function TasksScreen() {
  const tasks = useMobileDemoStore((s) => s.tasks);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (filter === 'active' && task.status === 'done') return false;
      if (filter === 'done' && task.status !== 'done') return false;
      if (!q) return true;
      return (
        task.title.toLowerCase().includes(q) ||
        task.project.toLowerCase().includes(q) ||
        task.id.toLowerCase().includes(q)
      );
    });
  }, [tasks, filter, query]);

  const activeCount = tasks.filter((t) => t.status !== 'done').length;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="gap-4 px-5 pt-4">
          <View>
            <Text className="text-2xl font-semibold text-foreground">Tasks</Text>
            <Text className="text-[13px] text-muted-foreground">
              {activeCount} active · {tasks.length - activeCount} done
            </Text>
          </View>

          {/* Search */}
          <View className="h-11 flex-row items-center gap-2 rounded-xl border border-border bg-muted/40 px-3">
            <Icon as={Search} size={16} className="text-muted-foreground/60" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search tasks…"
              placeholderTextColor="#9ca3af"
              className="h-full flex-1 text-sm text-foreground"
            />
          </View>

          {/* Filter segmented control */}
          <View className="flex-row rounded-xl bg-muted p-1">
            {filters.map((option) => {
              const active = filter === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setFilter(option.value)}
                  className={cn(
                    'flex-1 rounded-lg py-1.5',
                    active && 'bg-background shadow-sm shadow-black/10',
                  )}
                >
                  <Text
                    className={cn(
                      'text-center text-xs font-medium',
                      active ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {visible.length === 0 ? (
            <View className="items-center rounded-2xl border border-dashed border-border py-12">
              <Icon as={SquareCheckBig} size={32} className="mb-2 text-muted-foreground/40" />
              <Text className="text-sm font-medium text-foreground">No tasks here</Text>
              <Text className="mt-1 text-xs text-muted-foreground">
                {query ? 'Try a different search.' : 'Tap + to create one.'}
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {visible.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
