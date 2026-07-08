import { Button } from '@/components/ui/button';
import { Calendar, type DateRange } from '@/components/ui/calendar';
import { Icon } from '@/components/ui/icon';
import { Modal } from '@/components/ui/modal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useRootContext as usePopoverRootContext } from '@rn-primitives/popover';
import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react-native';
import * as React from 'react';
import { Platform, Pressable, View } from 'react-native';

// Native OS pickers take a concrete color, not a theme token — this is the only
// place a hard-coded accent is unavoidable. Keep it aligned with `--primary`.
const NATIVE_ACCENT = '#6366f1';

const FIELD_CLASSES =
  'h-12 flex-row items-center gap-2.5 rounded-2xl border border-border bg-card px-3.5 shadow-sm shadow-black/5';

type DateFieldProps = React.ComponentProps<typeof Pressable> & {
  value?: Date;
  placeholder?: string;
  /** `date-fns` format string for the displayed value. */
  dateFormat?: string;
};

/** The Input-style trigger: calendar icon + formatted date (or muted placeholder). */
const DateField = React.forwardRef<View, DateFieldProps>(function DateField(
  { value, placeholder = 'Pick a date', dateFormat = 'PPP', className, ...props },
  ref
) {
  return (
    <Pressable ref={ref} className={cn(FIELD_CLASSES, 'active:opacity-90', className)} {...props}>
      <Icon as={CalendarDays} size={18} className="text-muted-foreground" />
      <Text className={cn('flex-1 text-base', value ? 'text-foreground' : 'text-muted-foreground')}>
        {value ? format(value, dateFormat) : placeholder}
      </Text>
    </Pressable>
  );
});

type DatePickerProps = {
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  dateFormat?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
};

/**
 * Themed date picker: an on-brand field that opens the glass `Calendar` in a
 * Popover. Fully theme-token styled (matches the rest of the UI in light/dark).
 */
function DatePicker({
  value,
  onChange,
  placeholder,
  dateFormat = 'PPP',
  minDate,
  maxDate,
  className,
}: DatePickerProps) {
  // The RNR Popover is uncontrolled (owns its open state) — it's closed from
  // inside the content via the root context after a day is picked.
  return (
    <Popover>
      <PopoverTrigger asChild>
        <DateField value={value} placeholder={placeholder} dateFormat={dateFormat} className={className} />
      </PopoverTrigger>
      <PopoverContent align="start">
        <CalendarPanel
          value={value}
          onChange={onChange}
          minDate={minDate}
          maxDate={maxDate}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Rendered inside PopoverContent so it can close the popover on selection. */
function CalendarPanel({
  value,
  onChange,
  minDate,
  maxDate,
}: Pick<DatePickerProps, 'value' | 'onChange' | 'minDate' | 'maxDate'>) {
  const { onOpenChange } = usePopoverRootContext();
  return (
    <Calendar
      selected={value}
      defaultMonth={value}
      minDate={minDate}
      maxDate={maxDate}
      onSelect={(d) => {
        onChange?.(d);
        onOpenChange(false);
      }}
    />
  );
}

type RangeFieldProps = React.ComponentProps<typeof Pressable> & {
  range?: DateRange;
  placeholder?: string;
  dateFormat?: string;
};

/** Field trigger for a range: "Jun 3 – Jun 9" (or just the start while picking). */
const RangeField = React.forwardRef<View, RangeFieldProps>(function RangeField(
  { range, placeholder = 'Pick a range', dateFormat = 'MMM d', className, ...props },
  ref
) {
  const label = range?.from
    ? range.to
      ? `${format(range.from, dateFormat)} – ${format(range.to, dateFormat)}`
      : format(range.from, dateFormat)
    : null;
  return (
    <Pressable ref={ref} className={cn(FIELD_CLASSES, 'active:opacity-90', className)} {...props}>
      <Icon as={CalendarDays} size={18} className="text-muted-foreground" />
      <Text className={cn('flex-1 text-base', label ? 'text-foreground' : 'text-muted-foreground')}>
        {label ?? placeholder}
      </Text>
    </Pressable>
  );
});

type RangeDatePickerProps = {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  placeholder?: string;
  dateFormat?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
};

/** Themed range picker: two-tap selection in the glass Calendar, closes when complete. */
function RangeDatePicker({
  value,
  onChange,
  placeholder,
  dateFormat = 'MMM d',
  minDate,
  maxDate,
  className,
}: RangeDatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <RangeField range={value} placeholder={placeholder} dateFormat={dateFormat} className={className} />
      </PopoverTrigger>
      <PopoverContent align="start">
        <RangeCalendarPanel value={value} onChange={onChange} minDate={minDate} maxDate={maxDate} />
      </PopoverContent>
    </Popover>
  );
}

/** Inside PopoverContent so it can close the popover once a full range is picked. */
function RangeCalendarPanel({
  value,
  onChange,
  minDate,
  maxDate,
}: Pick<RangeDatePickerProps, 'value' | 'onChange' | 'minDate' | 'maxDate'>) {
  const { onOpenChange } = usePopoverRootContext();
  return (
    <Calendar
      mode="range"
      range={value}
      defaultMonth={value?.from}
      minDate={minDate}
      maxDate={maxDate}
      onRangeChange={(r) => {
        onChange?.(r);
        if (r.from && r.to) onOpenChange(false);
      }}
    />
  );
}

/**
 * Native date picker: the same field, but selection uses the OS picker
 * (Android dialog / iOS inline sheet). Familiar and accessible, at the cost of
 * matching the OS style rather than the app theme.
 */
function NativeDatePicker({
  value,
  onChange,
  placeholder,
  dateFormat = 'PPP',
  minDate,
  maxDate,
  className,
}: DatePickerProps) {
  const [visible, setVisible] = React.useState(false);
  const [temp, setTemp] = React.useState<Date>(value ?? new Date());

  const open = () => {
    setTemp(value ?? new Date());
    setVisible(true);
  };

  return (
    <>
      <DateField
        value={value}
        placeholder={placeholder}
        dateFormat={dateFormat}
        onPress={open}
        className={className}
      />

      {/* Android: the OS picker presents itself as a modal dialog on mount. */}
      {Platform.OS === 'android' && visible ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          accentColor={NATIVE_ACCENT}
          minimumDate={minDate}
          maximumDate={maxDate}
          onValueChange={(_e, d) => {
            setVisible(false);
            onChange?.(d);
          }}
          onDismiss={() => setVisible(false)}
        />
      ) : null}

      {/* iOS: the picker renders inline, so host it in a Modal with a Done action. */}
      {Platform.OS === 'ios' ? (
        <Modal
          open={visible}
          onOpenChange={setVisible}
          title="Select date"
          footer={
            <Button
              onPress={() => {
                onChange?.(temp);
                setVisible(false);
              }}>
              <Text>Done</Text>
            </Button>
          }>
          <View className="items-center">
            <DateTimePicker
              value={temp}
              mode="date"
              display="inline"
              accentColor={NATIVE_ACCENT}
              minimumDate={minDate}
              maximumDate={maxDate}
              onValueChange={(_e, d) => setTemp(d)}
            />
          </View>
        </Modal>
      ) : null}
    </>
  );
}

export { DatePicker, NativeDatePicker, RangeDatePicker };
export type { DatePickerProps, RangeDatePickerProps };
