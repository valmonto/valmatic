import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { FilterChips } from '@/components/ui/filter-chips';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { DollarSign } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Create / edit form — inputs, select, date picker, priority chips, notes. */
export function NewRecordBlock() {
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState<Date | undefined>();
  const [priority, setPriority] = useState('medium');

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="h-11 flex-row items-center justify-between px-4">
        <View className="w-12" />
        <Text className="text-base font-semibold text-foreground">New deal</Text>
        <Pressable hitSlop={8} className="active:opacity-70">
          <Text className="text-sm font-semibold text-primary">Save</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className="gap-5 px-5 pt-3">
            <View className="gap-1.5">
              <Label>Deal name</Label>
              <Input placeholder="e.g. Acme — Enterprise" />
            </View>
            <View className="gap-1.5">
              <Label>Company</Label>
              <Input placeholder="Acme Inc" />
            </View>
            <View className="gap-1.5">
              <Label>Amount</Label>
              <Input icon={DollarSign} placeholder="0.00" keyboardType="decimal-pad" />
            </View>
            <View className="gap-1.5">
              <Label>Stage</Label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent insets={insets}>
                  <SelectItem label="Lead" value="lead">
                    Lead
                  </SelectItem>
                  <SelectItem label="Qualified" value="qualified">
                    Qualified
                  </SelectItem>
                  <SelectItem label="Proposal" value="proposal">
                    Proposal
                  </SelectItem>
                  <SelectItem label="Won" value="won">
                    Won
                  </SelectItem>
                  <SelectItem label="Lost" value="lost">
                    Lost
                  </SelectItem>
                </SelectContent>
              </Select>
            </View>
            <View className="gap-1.5">
              <Label>Close date</Label>
              <DatePicker value={date} onChange={setDate} placeholder="Pick a date" />
            </View>
            <View className="gap-1.5">
              <Label>Priority</Label>
              <FilterChips
                value={priority}
                onChange={setPriority}
                options={[
                  { label: 'Low', value: 'low' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'High', value: 'high' },
                ]}
              />
            </View>
            <View className="gap-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Add context for your team…" maxLength={280} />
            </View>

            <Button className="mt-1 h-13 rounded-2xl shadow-lg shadow-primary/25">
              <Text className="text-base font-semibold">Create deal</Text>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
