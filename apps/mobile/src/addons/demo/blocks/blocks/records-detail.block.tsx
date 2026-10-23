import { Badge } from '@/components/ui/badge';
import { DataList } from '@/components/ui/data-list';
import { Icon } from '@/components/ui/icon';
import { RowMenu } from '@/components/ui/row-menu';
import { Text } from '@/components/ui/text';
import { Timeline } from '@/components/ui/timeline';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import {
  Archive,
  Check,
  CircleCheck,
  FileText,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

function QuickAction({ icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <Pressable className="items-center gap-1.5 active:opacity-70">
      <View className="size-12 items-center justify-center rounded-full bg-muted">
        <Icon as={icon} size={20} className="text-foreground" />
      </View>
      <Text variant="muted" className="text-xs">
        {label}
      </Text>
    </Pressable>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </Text>
  );
}

/** Record detail — hero, quick actions, key-value fields, and activity. */
export function RecordsDetailBlock() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="h-11 flex-row items-center justify-between px-4">
        <View className="w-12" />
        <Text className="text-base font-semibold text-foreground">Deal</Text>
        <RowMenu
          actions={[
            { label: 'Edit', icon: Pencil, onPress: () => {} },
            { label: 'Archive', icon: Archive, onPress: () => {} },
            {
              label: 'Delete',
              icon: Trash2,
              destructive: true,
              separated: true,
              onPress: () => {},
            },
          ]}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="gap-6 px-5 pt-2">
          {/* Hero */}
          <View className="items-center gap-3">
            <View className="size-20 items-center justify-center rounded-3xl bg-primary/10">
              <Text className="text-2xl font-bold text-primary">AC</Text>
            </View>
            <View className="items-center gap-1.5">
              <Text variant="h1" className="text-2xl">
                Acme Inc
              </Text>
              <Text variant="muted" className="text-base">
                Enterprise plan · Ada Lovelace
              </Text>
              <Badge variant="success">
                <Icon as={Check} size={12} />
                <Text>Won</Text>
              </Badge>
            </View>
          </View>

          {/* Quick actions */}
          <View className="flex-row justify-center gap-6">
            <QuickAction icon={Phone} label="Call" />
            <QuickAction icon={MessageSquare} label="Message" />
            <QuickAction icon={Mail} label="Email" />
          </View>

          {/* Details */}
          <View className="gap-2">
            <SectionLabel>Details</SectionLabel>
            <View className="overflow-hidden rounded-2xl border border-border bg-card px-4">
              <DataList
                rows={[
                  { label: 'Amount', value: '$12,400' },
                  {
                    label: 'Stage',
                    value: (
                      <Badge variant="success">
                        <Text>Won</Text>
                      </Badge>
                    ),
                  },
                  { label: 'Owner', value: 'Alex Morgan' },
                  { label: 'Close date', value: 'Jul 2, 2026' },
                  { label: 'Created', value: 'May 14, 2026' },
                ]}
              />
            </View>
          </View>

          {/* Activity */}
          <View className="gap-2">
            <SectionLabel>Activity</SectionLabel>
            <Timeline
              items={[
                {
                  icon: CircleCheck,
                  tone: 'success',
                  title: 'Deal marked as won',
                  description: 'by Alex Morgan',
                  time: 'Jul 2',
                },
                {
                  icon: FileText,
                  tone: 'primary',
                  title: 'Proposal sent',
                  description: 'Enterprise plan · annual',
                  time: 'Jun 20',
                },
                {
                  icon: MessageSquare,
                  tone: 'muted',
                  title: 'Discovery call',
                  description: '30 min with Ada',
                  time: 'Jun 3',
                },
              ]}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
