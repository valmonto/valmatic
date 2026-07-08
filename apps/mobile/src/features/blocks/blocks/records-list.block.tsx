import { Fab } from '@/components/ui/fab';
import { FilterChips } from '@/components/ui/filter-chips';
import { Input } from '@/components/ui/input';
import { List, ListItem } from '@/components/ui/list';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { Plus, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

type Deal = { company: string; contact: string; amount: string; stage: 'active' | 'won' | 'lost'; initials: string };
const DEALS: Deal[] = [
  { company: 'Acme Inc', contact: 'Ada Lovelace', amount: '$12,400', stage: 'won', initials: 'AC' },
  { company: 'Globex', contact: 'Alan Turing', amount: '$8,900', stage: 'active', initials: 'GX' },
  { company: 'Initech', contact: 'Grace Hopper', amount: '$21,000', stage: 'active', initials: 'IN' },
  { company: 'Umbrella', contact: 'Linus Pauling', amount: '$4,200', stage: 'lost', initials: 'UM' },
];
const STAGE_LABEL = { active: 'In progress', won: 'Won', lost: 'Lost' } as const;
const STAGE_COLOR = { active: 'text-foreground', won: 'text-green-600 dark:text-green-500', lost: 'text-muted-foreground' } as const;

/** Records list / index — search, filter chips, rows, and a create FAB. */
export function RecordsListBlock() {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('all');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEALS.filter(
      (d) =>
        (stage === 'all' || d.stage === stage) &&
        (!q || d.company.toLowerCase().includes(q) || d.contact.toLowerCase().includes(q))
    );
  }, [query, stage]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="h-11 flex-row items-center justify-center px-14">
        <Text className="text-base font-semibold text-foreground">Deals</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        <View className="gap-4 px-5 pt-2">
          <Input icon={Search} value={query} onChangeText={setQuery} placeholder="Search deals" autoCapitalize="none" />
          <FilterChips
            value={stage}
            onChange={setStage}
            options={[
              { label: 'All', value: 'all' },
              { label: 'In progress', value: 'active', count: 2 },
              { label: 'Won', value: 'won', count: 1 },
              { label: 'Lost', value: 'lost', count: 1 },
            ]}
          />

          {visible.length ? (
            <List>
              {visible.map((d) => (
                <ListItem
                  key={d.company}
                  leading={
                    <View className="size-10 items-center justify-center rounded-xl bg-primary/10">
                      <Text className="text-xs font-semibold text-primary">{d.initials}</Text>
                    </View>
                  }
                  title={d.company}
                  description={d.contact}
                  value={d.amount}
                  caption={STAGE_LABEL[d.stage]}
                  valueClassName={STAGE_COLOR[d.stage]}
                  showChevron={false}
                  onPress={() => {}}
                />
              ))}
            </List>
          ) : (
            <View className="items-center rounded-2xl border border-dashed border-border py-12">
              <Text variant="muted" className="text-sm">No deals match.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Fab icon={Plus} className={cn('bottom-6 right-6')} />
    </SafeAreaView>
  );
}
