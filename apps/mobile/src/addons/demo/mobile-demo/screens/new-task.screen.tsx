import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { useRouter } from 'expo-router';
import { toast } from 'sonner-native';
import { X } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { useMobileDemoStore, type DemoPriority } from '../store';

const projects = ['Mobile App', 'Website', 'API', 'Operations', 'Design System'];
const priorities: { value: DemoPriority; label: string; dot: string }[] = [
  { value: 'urgent', label: 'Urgent', dot: 'bg-red-500' },
  { value: 'high', label: 'High', dot: 'bg-orange-500' },
  { value: 'medium', label: 'Medium', dot: 'bg-amber-500' },
  { value: 'low', label: 'Low', dot: 'bg-muted-foreground/50' },
];

export default function NewTaskScreen() {
  const router = useRouter();
  const addTask = useMobileDemoStore((s) => s.addTask);
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('Mobile App');
  const [priority, setPriority] = useState<DemoPriority>('medium');

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error('Give the task a title first');
      return;
    }
    addTask({ title: trimmed, project, priority });
    router.back();
    toast.success('Task created', { description: `Added to ${project} — demo data only.` });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-6 px-5 pt-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-semibold text-foreground">New task</Text>
              <Text className="text-[13px] text-muted-foreground">
                Demo only — nothing is persisted.
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full bg-muted active:opacity-70"
            >
              <Icon as={X} size={18} className="text-muted-foreground" />
            </Pressable>
          </View>

          {/* Title */}
          <View className="gap-2">
            <Text className="text-[13px] font-medium text-foreground">Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What needs doing?"
              placeholderTextColor="#9ca3af"
              autoFocus
              className="h-12 rounded-2xl border border-border bg-card px-4 text-base text-foreground"
            />
          </View>

          {/* Project */}
          <View className="gap-2">
            <Text className="text-[13px] font-medium text-foreground">Project</Text>
            <View className="flex-row flex-wrap gap-2">
              {projects.map((p) => {
                const active = project === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setProject(p)}
                    className={cn(
                      'rounded-full border px-3.5 py-2 active:opacity-70',
                      active ? 'border-primary bg-primary/10' : 'border-border bg-card',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs font-medium',
                        active ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {p}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Priority */}
          <View className="gap-2">
            <Text className="text-[13px] font-medium text-foreground">Priority</Text>
            <View className="flex-row gap-2">
              {priorities.map((p) => {
                const active = priority === p.value;
                return (
                  <Pressable
                    key={p.value}
                    onPress={() => setPriority(p.value)}
                    className={cn(
                      'flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2.5 active:opacity-70',
                      active ? 'border-primary bg-primary/10' : 'border-border bg-card',
                    )}
                  >
                    <View className={cn('h-2 w-2 rounded-full', p.dot)} />
                    <Text
                      className={cn(
                        'text-xs font-medium',
                        active ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Button
            onPress={handleCreate}
            size="lg"
            className="mt-2 rounded-2xl shadow-lg shadow-primary/25"
          >
            <Text className="text-base font-semibold">Create task</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
