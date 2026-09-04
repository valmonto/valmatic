import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type DateRange = { from?: Date; to?: Date };

type CalendarProps = {
  mode?: 'single' | 'range';
  /** Selected day (single mode). */
  selected?: Date;
  onSelect?: (date: Date) => void;
  /** Selected range (range mode). */
  range?: DateRange;
  onRangeChange?: (range: DateRange) => void;
  /** Controlled visible month. */
  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  /** Days before `minDate` / after `maxDate` are disabled. */
  minDate?: Date;
  maxDate?: Date;
  className?: string;
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const RANGE_FILL = 'bg-primary/10';

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Next range given the current one and a tapped day (react-day-picker semantics). */
function nextRange(range: DateRange | undefined, day: Date): DateRange {
  const { from, to } = range ?? {};
  if (!from || (from && to)) return { from: day, to: undefined };
  if (isBefore(day, from)) return { from: day, to: from };
  return { from, to: day };
}

/**
 * A themed month-grid calendar (weekday header, month nav, today/selected states)
 * built on `date-fns`. Supports single-day (`mode="single"`) and range
 * (`mode="range"`) selection. On-brand: uses theme tokens, correct in light/dark.
 */
function Calendar({
  mode = 'single',
  selected,
  onSelect,
  range,
  onRangeChange,
  month,
  defaultMonth,
  onMonthChange,
  minDate,
  maxDate,
  className,
}: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState(() =>
    startOfMonth(defaultMonth ?? selected ?? range?.from ?? new Date()),
  );
  const visibleMonth = month ? startOfMonth(month) : internalMonth;

  const setMonth = (next: Date) => {
    onMonthChange?.(next);
    if (!month) setInternalMonth(next);
  };

  const weeks = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 0 });
    return chunk(eachDayOfInterval({ start, end }), 7);
  }, [visibleMonth]);

  const isDisabled = (day: Date) =>
    (minDate ? isBefore(day, startOfDay(minDate)) : false) ||
    (maxDate ? isAfter(day, startOfDay(maxDate)) : false);

  const handlePress = (day: Date) => {
    if (mode === 'range') onRangeChange?.(nextRange(range, day));
    else onSelect?.(day);
  };

  return (
    <View className={cn('gap-3', className)}>
      {/* Month nav */}
      <View className="flex-row items-center justify-between">
        <NavButton
          onPress={() => setMonth(subMonths(visibleMonth, 1))}
          icon={ChevronLeft}
          label="Previous month"
        />
        <Text className="text-sm font-semibold text-foreground">
          {format(visibleMonth, 'MMMM yyyy')}
        </Text>
        <NavButton
          onPress={() => setMonth(addMonths(visibleMonth, 1))}
          icon={ChevronRight}
          label="Next month"
        />
      </View>

      {/* Weekday header */}
      <View className="flex-row">
        {WEEKDAYS.map((wd) => (
          <View key={wd} className="flex-1 items-center">
            <Text className="text-xs font-medium text-muted-foreground">{wd}</Text>
          </View>
        ))}
      </View>

      {/* Weeks */}
      <View className="gap-1">
        {weeks.map((week) => (
          <View key={week[0].toISOString()} className="flex-row">
            {week.map((day) => (
              <DayCell
                key={day.toISOString()}
                day={day}
                mode={mode}
                selected={selected}
                range={range}
                visibleMonth={visibleMonth}
                disabled={isDisabled(day)}
                onPress={handlePress}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function DayCell({
  day,
  mode,
  selected,
  range,
  visibleMonth,
  disabled,
  onPress,
}: {
  day: Date;
  mode: 'single' | 'range';
  selected?: Date;
  range?: DateRange;
  visibleMonth: Date;
  disabled: boolean;
  onPress: (day: Date) => void;
}) {
  const outside = !isSameMonth(day, visibleMonth);
  const today = isToday(day);

  const from = range?.from;
  const to = range?.to;
  const isFrom = mode === 'range' && from ? isSameDay(day, from) : false;
  const isTo = mode === 'range' && to ? isSameDay(day, to) : false;
  const isEndpoint = isFrom || isTo;
  const isBetween =
    mode === 'range' && from && to ? isAfter(day, from) && isBefore(day, to) : false;

  const isSelected = mode === 'single' ? (selected ? isSameDay(day, selected) : false) : isEndpoint;

  // Continuous range bar: full strip for middle days, half strips at the endpoints.
  const showFullStrip = isBetween;
  const showRightHalf = isFrom && !!to && !isSameDay(from!, to!);
  const showLeftHalf = isTo && !!from && !isSameDay(from!, to!);

  return (
    <View className="flex-1 items-center">
      {showFullStrip ? (
        <View
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          className={RANGE_FILL}
        />
      ) : null}
      {showRightHalf ? (
        <View
          style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', right: 0 }}
          className={RANGE_FILL}
        />
      ) : null}
      {showLeftHalf ? (
        <View
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: '50%' }}
          className={RANGE_FILL}
        />
      ) : null}
      <Pressable
        disabled={disabled}
        onPress={() => onPress(day)}
        className={cn(
          'size-9 items-center justify-center rounded-full border border-transparent',
          !isSelected && !isBetween && 'active:bg-muted',
          isSelected && 'bg-primary',
          !isSelected && today && 'border-primary',
          disabled && 'opacity-30',
        )}
      >
        <Text
          className={cn(
            'text-sm',
            isSelected
              ? 'font-semibold text-primary-foreground'
              : isBetween
                ? 'text-foreground'
                : outside
                  ? 'text-muted-foreground/50'
                  : today
                    ? 'font-semibold text-primary'
                    : 'text-foreground',
          )}
        >
          {format(day, 'd')}
        </Text>
      </Pressable>
    </View>
  );
}

function NavButton({
  onPress,
  icon,
  label,
}: {
  onPress: () => void;
  icon: typeof ChevronLeft;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="size-9 items-center justify-center rounded-full active:bg-muted"
    >
      <Icon as={icon} size={18} className="text-muted-foreground" />
    </Pressable>
  );
}

export { Calendar };
export type { CalendarProps, DateRange };
