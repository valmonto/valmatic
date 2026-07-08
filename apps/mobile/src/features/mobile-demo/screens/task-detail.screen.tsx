import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronLeft, Clock, MessageSquare } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { priorityMeta } from '../lib';
import { useMobileDemoStore } from '../store';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const task = useMobileDemoStore((s) => s.tasks.find((t) => t.id === id));
  const toggleTaskStatus = useMobileDemoStore((s) => s.toggleTaskStatus);
  const toggleSubtask = useMobileDemoStore((s) => s.toggleSubtask);

  if (!task) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-background">
        <Text className="text-sm font-medium text-foreground">Task not found</Text>
        <Link href="/tasks" asChild>
          <Button variant="outline" size="sm">
            <Text>Back to tasks</Text>
          </Button>
        </Link>
      </SafeAreaView>
    );
  }

  const done = task.status === 'done';
  const subtasksDone = task.subtasks.filter((s) => s.done).length;
  const progress = task.subtasks.length
    ? Math.round((subtasksDone / task.subtasks.length) * 100)
    : done
      ? 100
      : 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="gap-5 px-5 pt-2">
          {/* Header */}
          <View className="flex-row items-center justify-between pt-1">
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="-ml-1 flex-row items-center gap-0.5 active:opacity-70"
            >
              <Icon as={ChevronLeft} size={18} className="text-muted-foreground" />
              <Text className="text-sm font-medium text-muted-foreground">Back</Text>
            </Pressable>
            <Text className="text-xs font-medium text-muted-foreground/70">{task.id}</Text>
          </View>

          {/* Title block */}
          <View>
            <View className="flex-row items-center gap-2">
              <View className={cn('rounded-full px-2 py-0.5', priorityMeta[task.priority].container)}>
                <Text className={cn('text-[10px] font-semibold', priorityMeta[task.priority].text)}>
                  {priorityMeta[task.priority].label}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View className={cn('h-1.5 w-1.5 rounded-full', task.projectColor)} />
                <Text className="text-[11px] font-medium text-muted-foreground">{task.project}</Text>
              </View>
              <View className="ml-auto flex-row items-center gap-1">
                <Icon
                  as={Clock}
                  size={12}
                  className={task.dueToday && !done ? 'text-orange-500' : 'text-muted-foreground'}
                />
                <Text
                  className={cn(
                    'text-[11px] font-medium',
                    task.dueToday && !done ? 'text-orange-500' : 'text-muted-foreground'
                  )}
                >
                  {task.due}
                </Text>
              </View>
            </View>
            <Text
              className={cn(
                'mt-2.5 text-xl font-semibold text-foreground',
                done && 'text-muted-foreground line-through'
              )}
            >
              {task.title}
            </Text>
            <Text className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {task.description}
            </Text>
          </View>

          {/* Subtasks */}
          {task.subtasks.length > 0 ? (
            <View className="gap-2.5">
              <View className="flex-row items-baseline justify-between">
                <Text className="text-sm font-semibold text-foreground">Subtasks</Text>
                <Text className="text-xs text-muted-foreground">
                  {subtasksDone}/{task.subtasks.length} · {progress}%
                </Text>
              </View>
              <View className="overflow-hidden rounded-full bg-muted" style={{ height: 6 }}>
                <View className="rounded-full bg-primary" style={{ height: 6, width: `${progress}%` }} />
              </View>
              <View className="rounded-2xl border border-border bg-card shadow-sm shadow-black/5">
                {task.subtasks.map((subtask, index) => (
                  <Pressable
                    key={subtask.id}
                    onPress={() => toggleSubtask(task.id, subtask.id)}
                    className={cn(
                      'flex-row items-center gap-3 px-3.5 py-3 active:bg-muted/40',
                      index > 0 && 'border-t border-border'
                    )}
                  >
                    <View
                      className={cn(
                        'h-5 w-5 items-center justify-center rounded-full border-2',
                        subtask.done ? 'border-primary bg-primary' : 'border-muted-foreground/35'
                      )}
                    >
                      {subtask.done ? (
                        <Icon as={Check} size={11} className="text-primary-foreground" />
                      ) : null}
                    </View>
                    <Text
                      className={cn(
                        'text-[13px] font-medium text-foreground',
                        subtask.done && 'text-muted-foreground line-through'
                      )}
                    >
                      {subtask.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {/* Comments */}
          <View className="gap-2.5">
            <View className="flex-row items-center gap-1.5">
              <Icon as={MessageSquare} size={14} className="text-muted-foreground" />
              <Text className="text-sm font-semibold text-foreground">Comments</Text>
            </View>
            {task.comments.length === 0 ? (
              <View className="rounded-2xl border border-dashed border-border py-6">
                <Text className="text-center text-xs text-muted-foreground">No comments yet.</Text>
              </View>
            ) : (
              <View className="gap-2.5">
                {task.comments.map((comment) => (
                  <View
                    key={comment.id}
                    className="rounded-2xl border border-border bg-card p-3.5 shadow-sm shadow-black/5"
                  >
                    <View className="flex-row items-center gap-2">
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-muted">
                        <Text className="text-[9px] font-semibold text-muted-foreground">
                          {comment.initials}
                        </Text>
                      </View>
                      <Text className="text-xs font-semibold text-foreground">{comment.author}</Text>
                      <Text className="ml-auto text-[11px] text-muted-foreground">{comment.time}</Text>
                    </View>
                    <Text className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                      {comment.body}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <Button
            size="lg"
            variant={done ? 'outline' : 'default'}
            onPress={() => toggleTaskStatus(task.id)}
            className="rounded-2xl"
          >
            <Icon as={Check} size={16} className={done ? 'text-foreground' : 'text-primary-foreground'} />
            <Text>{done ? 'Reopen task' : 'Mark as done'}</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
