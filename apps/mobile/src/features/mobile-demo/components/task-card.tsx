import { Pressable, View } from 'react-native';
import { Link } from 'expo-router';
import { Check, ChevronRight, Clock } from 'lucide-react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { priorityMeta } from '../lib';
import { useMobileDemoStore, type DemoTask } from '../store';

export function TaskCard({ task }: { task: DemoTask }) {
  const toggleTaskStatus = useMobileDemoStore((s) => s.toggleTaskStatus);
  const done = task.status === 'done';
  const subtasksDone = task.subtasks.filter((s) => s.done).length;

  return (
    <View
      className={cn(
        'rounded-2xl border border-border bg-card p-3.5 shadow-sm shadow-black/5',
        done && 'opacity-60'
      )}
    >
      <View className="flex-row items-start gap-3">
        <Pressable
          onPress={() => toggleTaskStatus(task.id)}
          hitSlop={8}
          className={cn(
            'mt-0.5 h-6 w-6 items-center justify-center rounded-full border-2 active:opacity-70',
            done ? 'border-primary bg-primary' : 'border-muted-foreground/40'
          )}
        >
          {done ? <Icon as={Check} size={13} className="text-primary-foreground" /> : null}
        </Pressable>

        <Link href={`/task/${task.id}`} asChild>
          <Pressable className="min-w-0 flex-1 active:opacity-80">
            <View className="flex-row items-center gap-2">
              <Text className="text-[11px] font-medium text-muted-foreground/70">{task.id}</Text>
              <View className={cn('rounded-full px-1.5 py-0.5', priorityMeta[task.priority].container)}>
                <Text className={cn('text-[10px] font-semibold', priorityMeta[task.priority].text)}>
                  {priorityMeta[task.priority].label}
                </Text>
              </View>
            </View>

            <Text
              numberOfLines={1}
              className={cn(
                'mt-1 text-sm font-medium text-foreground',
                done && 'text-muted-foreground line-through'
              )}
            >
              {task.title}
            </Text>

            <View className="mt-2 flex-row items-center gap-3">
              <View className="flex-row items-center gap-1.5">
                <View className={cn('h-1.5 w-1.5 rounded-full', task.projectColor)} />
                <Text className="text-[11px] text-muted-foreground">{task.project}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Icon
                  as={Clock}
                  size={12}
                  className={cn(
                    task.dueToday && !done ? 'text-orange-500' : 'text-muted-foreground'
                  )}
                />
                <Text
                  className={cn(
                    'text-[11px]',
                    task.dueToday && !done ? 'text-orange-500' : 'text-muted-foreground'
                  )}
                >
                  {task.due}
                </Text>
              </View>
              {task.subtasks.length > 0 ? (
                <Text className="text-[11px] text-muted-foreground">
                  {subtasksDone}/{task.subtasks.length}
                </Text>
              ) : null}
              <View className="ml-auto flex-row items-center">
                <View className="flex-row">
                  {task.assignees.map((a, i) => (
                    <View
                      key={a.initials}
                      className={cn(
                        'h-5 w-5 items-center justify-center rounded-full bg-muted',
                        i > 0 && '-ml-1.5'
                      )}
                      style={{ borderWidth: 2, borderColor: 'transparent' }}
                    >
                      <Text className="text-[8px] font-semibold text-muted-foreground">
                        {a.initials}
                      </Text>
                    </View>
                  ))}
                </View>
                <Icon as={ChevronRight} size={14} className="ml-1 text-muted-foreground/50" />
              </View>
            </View>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
