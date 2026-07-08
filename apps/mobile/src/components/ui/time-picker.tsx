import type { DateRange } from '@/components/ui/calendar';
import { Icon } from '@/components/ui/icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { useRootContext as usePopoverRootContext } from '@rn-primitives/popover';
import { addMinutes, format, getHours, getMinutes, isAfter, startOfDay } from 'date-fns';
import { Clock } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView } from 'react-native';

const FIELD_CLASSES =
  'h-12 flex-row items-center gap-2.5 rounded-2xl border border-border bg-card px-3.5 shadow-sm shadow-black/5';
const ROW_HEIGHT = 44;

const minutesOfDay = (d: Date) => getHours(d) * 60 + getMinutes(d);
const sameSlot = (a?: Date, b?: Date) => (a && b ? minutesOfDay(a) === minutesOfDay(b) : false);

function useSlots(minTime?: Date, maxTime?: Date, interval = 30) {
  return React.useMemo(() => {
    const base = startOfDay(minTime ?? maxTime ?? new Date());
    const start = minTime ?? base; // default 00:00
    const end = maxTime ?? addMinutes(base, 23 * 60 + 30); // default 23:30
    const out: Date[] = [];
    for (let t = start; !isAfter(t, end); t = addMinutes(t, interval)) out.push(t);
    return out;
  }, [minTime, maxTime, interval]);
}

/** Next range given the current one and a tapped slot (mirrors the calendar). */
function nextRange(range: DateRange | undefined, slot: Date): DateRange {
  const { from, to } = range ?? {};
  if (!from || (from && to)) return { from: slot, to: undefined };
  if (minutesOfDay(slot) < minutesOfDay(from)) return { from: slot, to: from };
  return { from, to: slot };
}

type SlotListProps = {
  mode: 'single' | 'range';
  selected?: Date;
  range?: DateRange;
  slots: Date[];
  timeFormat: string;
  onPress: (slot: Date) => void;
};

/** The scrollable slot list — single highlight, or a connected range block. */
function SlotList({ mode, selected, range, slots, timeFormat, onPress }: SlotListProps) {
  const scrollRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    const target = mode === 'range' ? range?.from : selected;
    if (!target) return;
    const idx = slots.findIndex((s) => sameSlot(s, target));
    if (idx >= 0) scrollRef.current?.scrollTo({ y: Math.max(0, (idx - 2) * ROW_HEIGHT), animated: false });
    // Scroll once when the panel mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      style={{ maxHeight: ROW_HEIGHT * 6 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: mode === 'range' ? 0 : 4 }}>
      {slots.map((slot) => {
        const from = range?.from;
        const to = range?.to;
        const m = minutesOfDay(slot);
        const isFrom = mode === 'range' ? sameSlot(slot, from) : false;
        const isTo = mode === 'range' ? sameSlot(slot, to) : false;
        const isEndpoint = isFrom || isTo;
        const isBetween =
          mode === 'range' && from && to ? m > minutesOfDay(from) && m < minutesOfDay(to) : false;
        const isSelected = mode === 'single' ? sameSlot(slot, selected) : isEndpoint;

        return (
          <Pressable
            key={slot.toISOString()}
            onPress={() => onPress(slot)}
            style={{ height: ROW_HEIGHT }}
            className={cn(
              'justify-center px-3.5',
              mode === 'range' ? 'rounded-none' : 'rounded-xl',
              !isSelected && !isBetween && 'active:bg-muted',
              isBetween && 'bg-primary/10',
              isSelected && 'bg-primary',
              // Round the outer corners of the range block.
              isFrom && (to ? 'rounded-t-xl' : 'rounded-xl'),
              isTo && 'rounded-b-xl'
            )}>
            <Text
              className={cn(
                'text-[15px]',
                isSelected ? 'font-semibold text-primary-foreground' : 'text-foreground'
              )}>
              {format(slot, timeFormat)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function TimeField({
  label,
  placeholder,
  className,
  ...props
}: React.ComponentProps<typeof Pressable> & { label: string | null; placeholder: string }) {
  return (
    <Pressable className={cn(FIELD_CLASSES, 'active:opacity-90', className)} {...props}>
      <Icon as={Clock} size={18} className="text-muted-foreground" />
      <Text className={cn('flex-1 text-base', label ? 'text-foreground' : 'text-muted-foreground')}>
        {label ?? placeholder}
      </Text>
    </Pressable>
  );
}

type TimePickerProps = {
  value?: Date;
  onChange?: (time: Date) => void;
  placeholder?: string;
  timeFormat?: string;
  minTime?: Date;
  maxTime?: Date;
  interval?: number;
  className?: string;
};

/** Themed single time picker: a slot list in the glass popover. */
function TimePicker({
  value,
  onChange,
  placeholder = 'Pick a time',
  timeFormat = 'p',
  minTime,
  maxTime,
  interval,
  className,
}: TimePickerProps) {
  const slots = useSlots(minTime, maxTime, interval);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <TimeField label={value ? format(value, timeFormat) : null} placeholder={placeholder} className={className} />
      </PopoverTrigger>
      <PopoverContent align="start">
        <SingleTimePanel value={value} onChange={onChange} slots={slots} timeFormat={timeFormat} />
      </PopoverContent>
    </Popover>
  );
}

function SingleTimePanel({
  value,
  onChange,
  slots,
  timeFormat,
}: {
  value?: Date;
  onChange?: (time: Date) => void;
  slots: Date[];
  timeFormat: string;
}) {
  const { onOpenChange } = usePopoverRootContext();
  return (
    <SlotList
      mode="single"
      selected={value}
      slots={slots}
      timeFormat={timeFormat}
      onPress={(slot) => {
        onChange?.(slot);
        onOpenChange(false);
      }}
    />
  );
}

type TimeRangePickerProps = {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  placeholder?: string;
  timeFormat?: string;
  minTime?: Date;
  maxTime?: Date;
  interval?: number;
  className?: string;
};

/** Themed time range: tap start then end; in-between slots highlighted. */
function TimeRangePicker({
  value,
  onChange,
  placeholder = 'Pick a time range',
  timeFormat = 'p',
  minTime,
  maxTime,
  interval,
  className,
}: TimeRangePickerProps) {
  const slots = useSlots(minTime, maxTime, interval);
  const label = value?.from
    ? value.to
      ? `${format(value.from, timeFormat)} – ${format(value.to, timeFormat)}`
      : format(value.from, timeFormat)
    : null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <TimeField label={label} placeholder={placeholder} className={className} />
      </PopoverTrigger>
      <PopoverContent align="start">
        <RangeTimePanel value={value} onChange={onChange} slots={slots} timeFormat={timeFormat} />
      </PopoverContent>
    </Popover>
  );
}

function RangeTimePanel({
  value,
  onChange,
  slots,
  timeFormat,
}: {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  slots: Date[];
  timeFormat: string;
}) {
  const { onOpenChange } = usePopoverRootContext();
  return (
    <SlotList
      mode="range"
      range={value}
      slots={slots}
      timeFormat={timeFormat}
      onPress={(slot) => {
        const r = nextRange(value, slot);
        onChange?.(r);
        if (r.from && r.to) onOpenChange(false);
      }}
    />
  );
}

export { TimePicker, TimeRangePicker };
export type { TimePickerProps, TimeRangePickerProps };
