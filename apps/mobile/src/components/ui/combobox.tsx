import { Icon } from '@/components/ui/icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { useRootContext as usePopoverRootContext } from '@rn-primitives/popover';
import { Check, ChevronsUpDown, Search, X, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

type ComboboxOption = { label: string; value: string; icon?: LucideIcon };

type ComboboxProps = {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
};

// PopoverContent's inner glass surface pads by 16px each side; subtract it so the
// panel's total width matches the trigger.
const POPOVER_PADDING = 32;

/**
 * A searchable Select: a field that opens the glass Popover with a command-style
 * search row and a filterable list. Theme-token styled; closes on selection and
 * matches the trigger's width.
 */
function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results.',
  className,
}: ComboboxProps) {
  const selected = options.find((o) => o.value === value);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Pressable
          className={cn(
            'h-12 flex-row items-center justify-between gap-2 rounded-2xl border border-border bg-card px-3.5 shadow-sm shadow-black/5 active:opacity-90',
            className
          )}>
          <View className="flex-1 flex-row items-center gap-2.5">
            {selected?.icon ? <Icon as={selected.icon} size={18} className="text-muted-foreground" /> : null}
            <Text
              numberOfLines={1}
              className={cn('flex-1 text-base', selected ? 'text-foreground' : 'text-muted-foreground')}>
              {selected ? selected.label : placeholder}
            </Text>
          </View>
          <Icon as={ChevronsUpDown} size={18} className="text-muted-foreground" />
        </Pressable>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto">
        <ComboPanel
          options={options}
          value={value}
          onChange={onChange}
          searchPlaceholder={searchPlaceholder}
          emptyText={emptyText}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Rendered inside PopoverContent so it can read the trigger width + close on select. */
function ComboPanel({
  options,
  value,
  onChange,
  searchPlaceholder,
  emptyText,
}: Pick<ComboboxProps, 'options' | 'value' | 'onChange' | 'searchPlaceholder' | 'emptyText'>) {
  const { onOpenChange, triggerPosition } = usePopoverRootContext();
  const [query, setQuery] = React.useState('');

  const width = triggerPosition?.width ? triggerPosition.width - POPOVER_PADDING : undefined;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  return (
    <View style={{ width }} className="gap-1.5">
      {/* Slim command-style search row with a divider. */}
      <View className="flex-row items-center gap-2 border-b border-border pb-2.5">
        <Icon as={Search} size={16} className="text-muted-foreground" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          style={{ fontFamily: 'Inter_400Regular', padding: 0 }}
          className="text-foreground placeholder:text-muted-foreground flex-1 text-[15px]"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8} className="active:opacity-60">
            <Icon as={X} size={16} className="text-muted-foreground" />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        style={{ maxHeight: 224 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View className="py-6">
            <Text variant="muted" className="text-center text-sm">
              {emptyText}
            </Text>
          </View>
        ) : (
          filtered.map((o) => {
            const isSelected = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  onChange?.(o.value);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex-row items-center gap-2.5 rounded-lg px-2.5 py-2.5 active:bg-accent',
                  isSelected && 'bg-accent'
                )}>
                {o.icon ? <Icon as={o.icon} size={16} className="text-muted-foreground" /> : null}
                <Text numberOfLines={1} className="flex-1 text-[15px] text-foreground">
                  {o.label}
                </Text>
                {isSelected ? <Icon as={Check} size={16} className="text-primary" /> : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

export { Combobox };
export type { ComboboxOption, ComboboxProps };
