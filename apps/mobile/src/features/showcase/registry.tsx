import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Activity, Archive, ArrowRight, Bell, Bold, CalendarDays, Check, ChevronRight, CircleAlert, CircleCheck, CreditCard, DollarSign, Download, Eye, Flag, Heart, Info, Italic, Link2, Lock, Mail, Plus, RotateCcw, Search, Star, Trash2, TriangleAlert, Underline, Users } from 'lucide-react-native';
import { cn } from '@/shared/lib/utils';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel } from '@/components/ui/carousel';
import { CommandPalette } from '@/components/ui/command';
import { DataList } from '@/components/ui/data-list';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { List, ListItem, type ListItemProps } from '@/components/ui/list';
import { RowMenu } from '@/components/ui/row-menu';
import { BarChart } from '@/components/ui/bar-chart';
import { Fab } from '@/components/ui/fab';
import { NumberInput } from '@/components/ui/number-input';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Rating } from '@/components/ui/rating';
import { Sparkline } from '@/components/ui/sparkline';
import { StatTile } from '@/components/ui/stat-tile';
import { Stepper } from '@/components/ui/stepper';
import { Timeline } from '@/components/ui/timeline';
import { SwipeableRow } from '@/components/ui/swipeable-row';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Combobox } from '@/components/ui/combobox';
import { DatePicker, NativeDatePicker, RangeDatePicker } from '@/components/ui/date-picker';
import { TimePicker, TimeRangePicker } from '@/components/ui/time-picker';
import type { DateRange } from '@/components/ui/calendar';
import {
  ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel,
  ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut,
  ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OTPInput } from '@/components/ui/otp-input';
import {
  Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut,
  MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger,
} from '@/components/ui/menubar';
import { Modal, ModalClose } from '@/components/ui/modal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { Toggle, ToggleIcon } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupIcon, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { restartApp } from '@/shared/lib/restart';

const AccordionDemo = () => (
  <Accordion type="single" collapsible defaultValue="a" className="w-full">
    <AccordionItem value="a">
      <AccordionTrigger><Text className="font-medium text-foreground">Is it accessible?</Text></AccordionTrigger>
      <AccordionContent><Text className="text-muted-foreground">Yes — it follows WAI-ARIA patterns for full keyboard and screen-reader support.</Text></AccordionContent>
    </AccordionItem>
    <AccordionItem value="b">
      <AccordionTrigger><Text className="font-medium text-foreground">Is it themed?</Text></AccordionTrigger>
      <AccordionContent><Text className="text-muted-foreground">Yes — it uses your design tokens, so it adapts to any palette and to dark mode.</Text></AccordionContent>
    </AccordionItem>
    <AccordionItem value="c" className="border-b-0">
      <AccordionTrigger><Text className="font-medium text-foreground">Is it animated?</Text></AccordionTrigger>
      <AccordionContent><Text className="text-muted-foreground">Yes — expanding and collapsing is smoothly animated with Reanimated.</Text></AccordionContent>
    </AccordionItem>
  </Accordion>
);

const AlertDemo = () => (
  <View className="w-full gap-3">
    <Alert icon={Info}><AlertTitle>Heads up!</AlertTitle><AlertDescription>You can add components to your app.</AlertDescription></Alert>
    <Alert icon={Info} variant="info"><AlertTitle>New update available</AlertTitle><AlertDescription>Version 2.1 is ready to install.</AlertDescription></Alert>
    <Alert icon={CircleCheck} variant="success"><AlertTitle>Changes saved</AlertTitle><AlertDescription>Your profile has been updated.</AlertDescription></Alert>
    <Alert icon={TriangleAlert} variant="warning"><AlertTitle>Storage almost full</AlertTitle><AlertDescription>You&apos;ve used 90% of your quota.</AlertDescription></Alert>
    <Alert icon={CircleAlert} variant="destructive"><AlertTitle>Payment failed</AlertTitle><AlertDescription>Please verify your billing information and try again.</AlertDescription></Alert>
  </View>
);

const AlertDialogDemo = () => (
  <AlertDialog>
    <AlertDialogTrigger asChild><Button variant="outline"><Text>Show dialog</Text></Button></AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone. This will permanently delete your account.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel><Text>Cancel</Text></AlertDialogCancel>
        <AlertDialogAction><Text>Continue</Text></AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const AspectRatioDemo = () => {
  // Pick one random image per mount so it doesn't reload on every render.
  const seed = useMemo(() => Math.floor(Math.random() * 1000), []);
  return (
    <View className="w-full items-center">
      <View className="w-full max-w-sm">
        <AspectRatio ratio={16 / 9}>
          <View className="flex-1 overflow-hidden rounded-xl bg-muted">
            <Image
              source={{ uri: `https://picsum.photos/seed/${seed}/800/450` }}
              style={{ flex: 1 }}
              contentFit="cover"
              transition={250}
            />
          </View>
        </AspectRatio>
        <Text variant="muted" className="mt-2 text-center text-xs">16 : 9</Text>
      </View>
    </View>
  );
};

const AvatarDemo = () => (
  <View className="flex-row items-center gap-5">
    {/* circle (photo, with initials fallback) */}
    <Avatar alt="Circle" className="size-10">
      <AvatarImage source={{ uri: 'https://i.pravatar.cc/128?img=12' }} />
      <AvatarFallback><Text className="text-xs font-medium">CN</Text></AvatarFallback>
    </Avatar>
    {/* rounded square */}
    <Avatar alt="Rounded" className="size-10 rounded-2xl">
      <AvatarImage source={{ uri: 'https://i.pravatar.cc/128?img=32' }} />
      <AvatarFallback className="rounded-2xl"><Text className="text-xs font-medium">AM</Text></AvatarFallback>
    </Avatar>
    {/* overlapping stack with a count chip. A bg-background ring wrapper gives
        clean separation (border-background falls back to white on native). */}
    <View className="flex-row">
      <View className="rounded-full bg-background p-0.5">
        <Avatar alt="1" className="size-10">
          <AvatarImage source={{ uri: 'https://i.pravatar.cc/128?img=5' }} />
          <AvatarFallback><Text className="text-xs font-medium">AL</Text></AvatarFallback>
        </Avatar>
      </View>
      <View className="-ml-3 rounded-full bg-background p-0.5">
        <Avatar alt="2" className="size-10">
          <AvatarImage source={{ uri: 'https://i.pravatar.cc/128?img=8' }} />
          <AvatarFallback><Text className="text-xs font-medium">GH</Text></AvatarFallback>
        </Avatar>
      </View>
      <View className="-ml-3 rounded-full bg-background p-0.5">
        <Avatar alt="more" className="size-10">
          <AvatarFallback className="bg-primary/10">
            <Text className="text-xs font-semibold text-primary">+3</Text>
          </AvatarFallback>
        </Avatar>
      </View>
    </View>
  </View>
);

const BadgeDemo = () => {
  const seed = useMemo(() => Math.floor(Math.random() * 1000), []);
  return (
    <View className="w-full gap-5">
      <ButtonGroup label="Variants">
        <Badge><Text>Default</Text></Badge>
        <Badge variant="secondary"><Text>Secondary</Text></Badge>
        <Badge variant="outline"><Text>Outline</Text></Badge>
        <Badge variant="destructive"><Text>Destructive</Text></Badge>
      </ButtonGroup>
      <ButtonGroup label="Status (soft tonal)">
        <Badge variant="success"><Icon as={Check} size={12} /><Text>Active</Text></Badge>
        <Badge variant="warning"><Text>Pending</Text></Badge>
        <Badge variant="info"><Text>Beta</Text></Badge>
        <Badge variant="secondary"><Text>v1.4.0</Text></Badge>
      </ButtonGroup>
      <View className="w-full gap-2">
        <Text className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          On media (glass frost)
        </Text>
        <View className="w-full overflow-hidden rounded-2xl">
          <Image
            source={{ uri: `https://picsum.photos/seed/${seed}/800/400` }}
            style={{ width: '100%', height: 130 }}
            contentFit="cover"
            transition={250}
          />
          <View className="absolute left-3 top-3 flex-row flex-wrap gap-2">
            <Badge variant="success"><Icon as={Check} size={12} /><Text>Active</Text></Badge>
            <Badge variant="info"><Text>Beta</Text></Badge>
            <Badge variant="secondary"><Text>Draft</Text></Badge>
          </View>
        </View>
      </View>
    </View>
  );
};

const ButtonGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <View className="w-full gap-2">
    <Text className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</Text>
    <View className="flex-row flex-wrap items-center gap-2">{children}</View>
  </View>
);

const ButtonDemo = () => (
  <View className="w-full gap-5">
    <ButtonGroup label="Variants">
      <Button><Text>Primary</Text></Button>
      <Button variant="secondary"><Text>Secondary</Text></Button>
      <Button variant="outline"><Text>Outline</Text></Button>
      <Button variant="ghost"><Text>Ghost</Text></Button>
      <Button variant="destructive"><Text>Destructive</Text></Button>
      <Button variant="link"><Text>Link</Text></Button>
    </ButtonGroup>
    <ButtonGroup label="Sizes">
      <Button size="sm"><Text>Small</Text></Button>
      <Button><Text>Default</Text></Button>
      <Button size="lg"><Text>Large</Text></Button>
      <Button size="icon"><Icon as={Plus} size={18} /></Button>
      <Button size="icon-sm" variant="outline"><Icon as={Bell} size={16} /></Button>
    </ButtonGroup>
    <ButtonGroup label="With icons & states">
      <Button><Icon as={Download} size={16} /><Text>Download</Text></Button>
      <Button variant="outline"><Text>Continue</Text><Icon as={ArrowRight} size={16} /></Button>
      <Button variant="destructive"><Icon as={Trash2} size={16} /><Text>Delete</Text></Button>
      <Button loading><Text>Loading</Text></Button>
    </ButtonGroup>
  </View>
);

const LIST_DATA: ListItemProps[] = [
  { icon: Mail, iconTone: 'primary', title: 'Inbox', description: '12 new messages', value: '12' },
  { icon: Star, iconTone: 'muted', title: 'Starred', description: 'Your favorites' },
  { icon: Download, iconTone: 'success', title: 'Downloads', description: '4 files ready' },
];

const ListDemo = () => {
  const [wifi, setWifi] = useState(true);
  return (
    <View className="w-full gap-4">
      {/* Data-driven: render a list from an array */}
      <List>
        {LIST_DATA.map((d) => (
          <ListItem
            key={d.title}
            icon={d.icon}
            iconTone={d.iconTone}
            title={d.title}
            description={d.description}
            value={d.value}
            showChevron
            onPress={() => toast.info(d.title)}
          />
        ))}
      </List>

      {/* Mixed rows: chevron, a Switch, and a destructive action */}
      <List>
        <ListItem icon={Bell} title="Notifications" description="Push, email, SMS" showChevron onPress={() => {}} />
        <ListItem icon={Lock} iconTone="muted" title="Wi-Fi sync" trailing={<Switch checked={wifi} onCheckedChange={setWifi} />} />
        <ListItem icon={Trash2} destructive title="Delete account" onPress={() => {}} />
      </List>
    </View>
  );
};

type Person = { name: string; role: string; status: 'Active' | 'Away'; joined: string };
const PEOPLE: Person[] = [
  { name: 'Ada Lovelace', role: 'Engineering', status: 'Active', joined: 'Mar 2024' },
  { name: 'Alan Turing', role: 'Research', status: 'Away', joined: 'Jan 2023' },
  { name: 'Grace Hopper', role: 'Design', status: 'Active', joined: 'Sep 2024' },
];

const StatusBadge = ({ status }: { status: Person['status'] }) =>
  status === 'Active' ? (
    <Badge variant="success"><Icon as={Check} size={12} /><Text>Active</Text></Badge>
  ) : (
    <Badge variant="secondary"><Text>Away</Text></Badge>
  );

const DataTableDemo = () => (
  <DataTable<Person>
    data={PEOPLE}
    titleKey="name"
    onRowPress={(p) => toast.info(p.name)}
    keyExtractor={(p) => p.name}
    columns={[
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'status', label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
      { key: 'joined', label: 'Joined' },
    ]}
  />
);

const TimelineDemo = () => (
  <Timeline
    items={[
      { icon: CircleCheck, tone: 'success', title: 'Payment received', description: '$48.00 from Ada Lovelace', time: '2:14 PM' },
      { icon: Users, tone: 'primary', title: 'New teammate joined', description: 'Grace accepted the invite', time: '11:02 AM' },
      { icon: Mail, tone: 'muted', title: 'Invoice sent', description: '#INV-2043 to Acme Co.', time: '9:30 AM' },
      { icon: CreditCard, tone: 'muted', title: 'Subscription renewed', time: 'Yesterday' },
    ]}
  />
);

const FilterChipsDemo = () => {
  const [status, setStatus] = useState('all');
  const [tags, setTags] = useState<string[]>(['design']);
  return (
    <View className="w-full gap-4">
      <View className="gap-2">
        <Text className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status (single)</Text>
        <FilterChips
          value={status}
          onChange={setStatus}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Active', value: 'active', count: 12 },
            { label: 'Archived', value: 'archived', count: 4 },
            { label: 'Draft', value: 'draft' },
          ]}
        />
      </View>
      <View className="gap-2">
        <Text className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Tags (multi)</Text>
        <FilterChips
          multiple
          value={tags}
          onChange={setTags}
          options={[
            { label: 'Design', value: 'design' },
            { label: 'Engineering', value: 'engineering' },
            { label: 'Marketing', value: 'marketing' },
            { label: 'Sales', value: 'sales' },
          ]}
        />
      </View>
    </View>
  );
};

const StepperDemo = () => {
  const steps = ['Account', 'Profile', 'Payment', 'Review'];
  const [current, setCurrent] = useState(1);
  return (
    <View className="w-full gap-5">
      <Stepper steps={steps} current={current} />
      <View className="flex-row justify-between">
        <Button variant="outline" size="sm" disabled={current === 0} onPress={() => setCurrent((c) => Math.max(0, c - 1))}>
          <Text>Back</Text>
        </Button>
        <Button size="sm" disabled={current === steps.length - 1} onPress={() => setCurrent((c) => Math.min(steps.length - 1, c + 1))}>
          <Text>Next</Text>
        </Button>
      </View>
    </View>
  );
};

const ProgressRingDemo = () => (
  <View className="w-full flex-row items-center justify-around">
    <ProgressRing value={72} />
    <ProgressRing value={40} size={80} strokeWidth={7}>
      <Text className="text-base font-semibold text-foreground">3/5</Text>
      <Text variant="muted" className="text-[11px]">tasks</Text>
    </ProgressRing>
  </View>
);

const SparklineDemo = () => (
  <View className="w-full gap-3">
    <View className="flex-row gap-3">
      <View className="flex-1 gap-2 rounded-2xl border border-border bg-card p-4">
        <Text variant="muted" className="text-sm">Sessions</Text>
        <Text className="text-2xl font-semibold tabular-nums text-foreground">8,204</Text>
        <Sparkline data={[4, 6, 5, 8, 7, 10, 9, 12]} fill />
      </View>
      <View className="flex-1 gap-2 rounded-2xl border border-border bg-card p-4">
        <Text variant="muted" className="text-sm">Errors</Text>
        <Text className="text-2xl font-semibold tabular-nums text-foreground">37</Text>
        <Sparkline data={[9, 7, 8, 5, 6, 4, 3, 2]} color="#ef4444" fill />
      </View>
    </View>
  </View>
);

const BarChartDemo = () => (
  <BarChart
    showValues
    data={[
      { label: 'Mon', value: 12 },
      { label: 'Tue', value: 19 },
      { label: 'Wed', value: 8 },
      { label: 'Thu', value: 22 },
      { label: 'Fri', value: 17 },
      { label: 'Sat', value: 25 },
      { label: 'Sun', value: 14 },
    ]}
  />
);

const RatingDemo = () => {
  const [rating, setRating] = useState(3);
  return (
    <View className="w-full gap-4">
      <View className="gap-1.5">
        <Text className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Interactive</Text>
        <Rating value={rating} onChange={setRating} size={28} />
      </View>
      <View className="gap-1.5">
        <Text className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Read-only</Text>
        <Rating value={4} readOnly size={18} />
      </View>
    </View>
  );
};

const NumberInputDemo = () => {
  const [qty, setQty] = useState(1);
  return (
    <View className="w-full flex-row items-center justify-between">
      <Text className="text-[15px] text-foreground">Quantity</Text>
      <NumberInput value={qty} onChange={setQty} min={1} max={10} />
    </View>
  );
};

const FabDemo = () => (
  <View className="relative h-52 w-full overflow-hidden rounded-2xl border border-border bg-muted/40">
    <Text variant="muted" className="p-4 text-sm">Screen content…</Text>
    <Fab icon={Plus} className="bottom-4 right-4" />
    <Fab icon={Plus} label="New" className="bottom-4 left-4 right-auto" />
  </View>
);

const StatTileDemo = () => (
  <View className="w-full gap-3">
    <View className="flex-row gap-3">
      <StatTile className="flex-1" icon={DollarSign} label="Revenue" value="$48.2k" delta="12.5%" deltaDirection="up" caption="vs last mo" />
      <StatTile className="flex-1" icon={Users} label="Active users" value="2,340" delta="3.1%" deltaDirection="up" caption="vs last mo" />
    </View>
    <View className="flex-row gap-3">
      <StatTile className="flex-1" icon={Activity} label="Churn" value="1.8%" delta="0.4%" deltaDirection="down" deltaTone="positive" caption="improved" />
      <StatTile className="flex-1" icon={CreditCard} label="MRR" value="$12.9k" delta="2.2%" deltaDirection="down" caption="vs last mo" />
    </View>
  </View>
);

const DataListDemo = () => (
  <View className="w-full overflow-hidden rounded-2xl border border-border bg-card px-4">
    <DataList
      rows={[
        { label: 'Name', value: 'Ada Lovelace' },
        { label: 'Role', value: 'Engineering' },
        { label: 'Status', value: <StatusBadge status="Active" /> },
        { label: 'Email', value: 'ada@example.com' },
        { label: 'Joined', value: 'Mar 2024' },
      ]}
    />
  </View>
);

// Prioritized rows grouped by section — the pattern real data/finance apps use
// as the mobile alternative to a web table (identity + key metric + status).
const RECORD_GROUPS: { title: string; total: string; items: ListItemProps[] }[] = [
  {
    title: 'Today',
    total: '−$142.50',
    items: [
      { icon: Download, iconTone: 'muted', title: 'Apple Store', description: '2:14 PM · Shopping', value: '−$129.00', caption: 'Completed' },
      { icon: Star, iconTone: 'muted', title: 'Spotify', description: '8:03 AM · Subscription', value: '−$13.50', caption: 'Completed' },
    ],
  },
  {
    title: 'Yesterday',
    total: '+$4,184.01',
    items: [
      { icon: Users, iconTone: 'success', title: 'Payroll', description: '9:00 AM · Income', value: '+$4,200.00', valueClassName: 'text-green-600 dark:text-green-500', caption: 'Deposited' },
      { icon: Bell, iconTone: 'muted', title: 'Netflix', description: '6:41 PM · Subscription', value: '−$15.99', caption: 'Pending' },
    ],
  },
];

const RecordListDemo = () => (
  <View className="w-full gap-4">
    <Text variant="muted" className="text-xs">Swipe a row, or tap ⋮ for actions</Text>
    {RECORD_GROUPS.map((g) => (
      <View key={g.title} className="gap-1.5">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-[13px] font-medium text-muted-foreground">{g.title}</Text>
          <Text className="text-[13px] text-muted-foreground">{g.total}</Text>
        </View>
        <List>
          {g.items.map((it, i) => (
            <SwipeableRow
              key={i}
              leftActions={[{ icon: Star, label: 'Star', tone: 'primary', onPress: () => toast.success('Starred') }]}
              rightActions={[
                { icon: Check, label: 'Archive', tone: 'success', onPress: () => toast('Archived') },
                { icon: Trash2, label: 'Delete', tone: 'destructive', onPress: () => toast.error('Deleted') },
              ]}>
              <ListItem
                {...it}
                onPress={() => toast.info(it.title)}
                menu={
                  <RowMenu
                    actions={[
                      { label: 'View details', icon: Eye, onPress: () => toast.info(it.title) },
                      { label: 'Add to favorites', icon: Star, onPress: () => toast.success('Starred') },
                      { label: 'Archive', icon: Archive, onPress: () => toast('Archived') },
                      { label: 'Delete', icon: Trash2, destructive: true, separated: true, onPress: () => toast.error('Deleted') },
                    ]}
                  />
                }
              />
            </SwipeableRow>
          ))}
        </List>
      </View>
    ))}
  </View>
);

const EmptyStateDemo = () => (
  <View className="w-full overflow-hidden rounded-2xl border border-border bg-card">
    <EmptyState
      icon={Mail}
      title="No messages yet"
      description="When you receive messages, they'll show up right here."
      action={<Button size="sm" variant="outline"><Text>Refresh</Text></Button>}
    />
  </View>
);

const CommandDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <View className="w-full">
      <Button variant="outline" onPress={() => setOpen(true)}>
        <Icon as={Search} size={16} className="text-muted-foreground" />
        <Text>Search commands…</Text>
      </Button>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        groups={[
          {
            heading: 'Suggestions',
            items: [
              { icon: CalendarDays, label: 'Open calendar', onSelect: () => toast.info('Calendar') },
              { icon: Mail, label: 'Search email', keywords: ['inbox', 'mail'], onSelect: () => toast.info('Email') },
              { icon: Users, label: 'Invite teammate', onSelect: () => toast.success('Invite sent') },
            ],
          },
          {
            heading: 'Settings',
            items: [
              { icon: Lock, label: 'Privacy & security', shortcut: '⌘P', onSelect: () => toast.info('Privacy') },
              { icon: Bell, label: 'Notifications', shortcut: '⌘N', onSelect: () => toast.info('Notifications') },
            ],
          },
        ]}
      />
    </View>
  );
};

const CAROUSEL_SLIDES = [
  { icon: Star, title: 'Featured', subtitle: 'Hand-picked for you' },
  { icon: Bell, title: 'Notifications', subtitle: 'Stay in the loop' },
  { icon: Download, title: 'Offline mode', subtitle: 'Take it anywhere' },
  { icon: Users, title: 'Collaborate', subtitle: 'Invite your team' },
];

const CarouselDemo = () => (
  <Carousel
    data={CAROUSEL_SLIDES}
    renderItem={(slide) => (
      <View className="h-44 justify-between overflow-hidden rounded-2xl border border-border bg-card p-4">
        <View className="size-11 items-center justify-center rounded-full bg-primary/10">
          <Icon as={slide.icon} size={22} className="text-primary" />
        </View>
        <View className="gap-0.5">
          <Text className="text-lg font-semibold text-foreground">{slide.title}</Text>
          <Text variant="muted" className="text-sm">{slide.subtitle}</Text>
        </View>
      </View>
    )}
  />
);

const CardDemo = () => {
  const seed = useMemo(() => Math.floor(Math.random() * 1000), []);
  return (
    <View className="w-full gap-5">
      {/* Default Card — glass by default (subtle frost on the plain canvas). */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create project</CardTitle>
          <CardDescription>Deploy your new project in one click.</CardDescription>
        </CardHeader>
        <CardContent className="gap-2">
          <Label>Project name</Label>
          <Input placeholder="acme-web" autoCapitalize="none" />
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" size="sm"><Text>Cancel</Text></Button>
          <Button size="sm"><Text>Deploy</Text></Button>
        </CardFooter>
      </Card>

      {/* Same Card over a photo — the frosting reads clearly against media. */}
      <View className="w-full overflow-hidden rounded-3xl">
        <Image
          source={{ uri: `https://picsum.photos/seed/${seed}/800/600` }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={250}
        />
        <View className="p-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Frosted over media</CardTitle>
              <CardDescription>The card blurs whatever sits behind it.</CardDescription>
            </CardHeader>
            <CardContent>
              <Text variant="muted">Same Card component — glass by default.</Text>
            </CardContent>
          </Card>
        </View>
      </View>
    </View>
  );
};

const CheckboxDemo = () => {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  return (
    <View className="w-full gap-3.5">
      <View className="flex-row items-center gap-2.5">
        <Checkbox checked={a} onCheckedChange={setA} />
        <Label onPress={() => setA(!a)}>Email me updates</Label>
      </View>
      <View className="flex-row items-center gap-2.5">
        <Checkbox checked={b} onCheckedChange={setB} />
        <Label onPress={() => setB(!b)}>Subscribe to newsletter</Label>
      </View>
      <View className="flex-row items-center gap-2.5">
        <Checkbox checked={false} onCheckedChange={() => {}} disabled />
        <Label className="text-muted-foreground">Disabled</Label>
      </View>
    </View>
  );
};

const CollapsibleDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full gap-2">
      <CollapsibleTrigger asChild><Button variant="outline"><Text>{open ? 'Hide' : 'Show'} details</Text></Button></CollapsibleTrigger>
      <CollapsibleContent className="gap-2">
        <View className="rounded-lg border border-border p-3"><Text variant="muted">@radix-ui/primitives</Text></View>
        <View className="rounded-lg border border-border p-3"><Text variant="muted">@stitches/react</Text></View>
      </CollapsibleContent>
    </Collapsible>
  );
};

const COMBOBOX_FRAMEWORKS = [
  { label: 'Next.js', value: 'next' },
  { label: 'SvelteKit', value: 'sveltekit' },
  { label: 'Nuxt.js', value: 'nuxt' },
  { label: 'Remix', value: 'remix' },
  { label: 'Astro', value: 'astro' },
  { label: 'Expo', value: 'expo' },
  { label: 'SolidStart', value: 'solid' },
];

const ComboboxDemo = () => {
  const [value, setValue] = useState('');
  return (
    <View className="w-full">
      <Combobox
        options={COMBOBOX_FRAMEWORKS}
        value={value}
        onChange={setValue}
        placeholder="Select framework…"
        searchPlaceholder="Search framework…"
      />
    </View>
  );
};

const DatePickerDemo = () => {
  const [themed, setThemed] = useState<Date | undefined>(new Date());
  const [range, setRange] = useState<DateRange>({});
  const [native, setNative] = useState<Date | undefined>();
  return (
    <View className="w-full gap-4">
      <View className="gap-1.5">
        <Text className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Themed (calendar)</Text>
        <DatePicker value={themed} onChange={setThemed} />
      </View>
      <View className="gap-1.5">
        <Text className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Range</Text>
        <RangeDatePicker value={range} onChange={setRange} />
      </View>
      <View className="gap-1.5">
        <Text className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Native (OS picker)</Text>
        <NativeDatePicker value={native} onChange={setNative} placeholder="Select a date" />
      </View>
    </View>
  );
};

const TimePickerDemo = () => {
  const [time, setTime] = useState<Date | undefined>();
  const [range, setRange] = useState<DateRange>({});
  return (
    <View className="w-full gap-4">
      <View className="gap-1.5">
        <Text className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Single</Text>
        <TimePicker value={time} onChange={setTime} />
      </View>
      <View className="gap-1.5">
        <Text className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Range</Text>
        <TimeRangePicker value={range} onChange={setRange} />
      </View>
    </View>
  );
};

const ContextMenuDemo = () => {
  const [bookmarks, setBookmarks] = useState(true);
  const [urls, setUrls] = useState(false);
  const [person, setPerson] = useState('pedro');
  return (
    <ContextMenu>
      {/* No asChild: the Trigger must render a Pressable to detect long-press
          (a plain View ignores onLongPress). */}
      <ContextMenuTrigger className="w-full items-center justify-center rounded-xl border border-dashed border-border py-14 active:bg-muted/30">
        <Text variant="muted">Long-press here</Text>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem><Text>Back</Text><ContextMenuShortcut>⌘[</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuItem disabled><Text>Forward</Text><ContextMenuShortcut>⌘]</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuItem><Text>Reload</Text><ContextMenuShortcut>⌘R</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger><Text>More Tools</Text></ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem><Text>Save Page As…</Text></ContextMenuItem>
            <ContextMenuItem><Text>Developer Tools</Text></ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked={bookmarks} onCheckedChange={setBookmarks}><Text>Show Bookmarks</Text></ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem checked={urls} onCheckedChange={setUrls}><Text>Show Full URLs</Text></ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuLabel><Text>People</Text></ContextMenuLabel>
        <ContextMenuRadioGroup value={person} onValueChange={setPerson}>
          <ContextMenuRadioItem value="pedro"><Text>Pedro Duarte</Text></ContextMenuRadioItem>
          <ContextMenuRadioItem value="colm"><Text>Colm Tuite</Text></ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
};

const RELEASES = [
  { v: 'v1.6.0', tag: 'Latest', date: 'Jun 12, 2026' },
  { v: 'v1.5.0', tag: 'Feature', date: 'Jun 9, 2026' },
  { v: 'v1.4.1', tag: 'Patch', date: 'Jun 6, 2026' },
  { v: 'v1.4.0', tag: 'Feature', date: 'Jun 4, 2026' },
  { v: 'v1.3.0', tag: 'Fixes', date: 'Jun 3, 2026' },
  { v: 'v1.2.0', tag: 'Fixes', date: 'Jun 2, 2026' },
  { v: 'v1.1.0', tag: 'Stability', date: 'Jun 1, 2026' },
  { v: 'v1.0.2', tag: 'Patch', date: 'May 28, 2026' },
  { v: 'v1.0.1', tag: 'Patch', date: 'May 24, 2026' },
  { v: 'v1.0.0', tag: 'Launch', date: 'May 20, 2026' },
];

const ModalDemo = () => (
  <View className="w-full flex-row flex-wrap gap-2">
    {/* Default — centered card, pinned header/footer, scrolling body. */}
    <Modal
      variant="default"
      icon={Info}
      title="Edit profile"
      description="Header and footer stay pinned while the body scrolls."
      trigger={<Button variant="outline"><Text>Default</Text></Button>}
      footer={
        <>
          <ModalClose asChild><Button variant="outline" size="sm"><Text>Cancel</Text></Button></ModalClose>
          <ModalClose asChild><Button size="sm"><Text>Save</Text></Button></ModalClose>
        </>
      }>
      <View className="gap-4">
        <View className="gap-2"><Label>Name</Label><Input icon={Info} placeholder="Ada Lovelace" /></View>
        <View className="gap-2"><Label>Username</Label><Input placeholder="@ada" autoCapitalize="none" /></View>
        <View className="gap-2"><Label>Bio</Label><Textarea placeholder="Tell us about yourself…" /></View>
        <Text variant="muted" className="text-sm">
          Add enough content and this middle section scrolls on its own, with the title above and
          the action buttons below staying put.
        </Text>
      </View>
    </Modal>

    {/* Fullscreen — bottom sheet that slides up; long scrolling list. */}
    <Modal
      variant="fullscreen"
      icon={Star}
      title="Release notes"
      description="Showing the last 12 releases."
      trigger={<Button><Text>Fullscreen</Text></Button>}
      footer={<ModalClose asChild><Button size="sm" className="flex-1"><Text>Mark all as read</Text></Button></ModalClose>}>
      <View className="gap-6">
        {RELEASES.map((r) => (
          <View key={r.v} className="gap-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold text-foreground">{r.v}</Text>
                <Badge variant="warning"><Text>{r.tag}</Text></Badge>
              </View>
              <Text variant="muted" className="text-xs">{r.date}</Text>
            </View>
            <Text variant="muted" className="text-sm leading-relaxed">
              A focused release improving everyday workflows across the app, with refinements to
              overlays, tables and billing.
            </Text>
            {['Improved load times across the app.', 'Fixed a layout shift when opening overlays.', 'Resolved an edge case in billing totals.'].map((line) => (
              <View key={line} className="flex-row items-start gap-2">
                <Icon as={Check} size={14} className="mt-0.5 text-emerald-500" />
                <Text className="flex-1 text-sm text-foreground">{line}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </Modal>
  </View>
);

const DropdownMenuDemo = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="outline"><Text>Open menu</Text></Button></DropdownMenuTrigger>
    <DropdownMenuContent className="w-60">
      <DropdownMenuLabel><Text>My Account</Text></DropdownMenuLabel>
      <DropdownMenuGroup>
        <DropdownMenuItem><Text>Profile</Text><DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut></DropdownMenuItem>
        <DropdownMenuItem><Text>Billing</Text><DropdownMenuShortcut>⌘B</DropdownMenuShortcut></DropdownMenuItem>
        <DropdownMenuItem><Text>Settings</Text><DropdownMenuShortcut>⌘S</DropdownMenuShortcut></DropdownMenuItem>
        <DropdownMenuItem><Text>Keyboard shortcuts</Text><DropdownMenuShortcut>⌘K</DropdownMenuShortcut></DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuLabel><Text>Team</Text></DropdownMenuLabel>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger><Text>Invite users</Text></DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem><Text>Email</Text></DropdownMenuItem>
          <DropdownMenuItem><Text>Message</Text></DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuItem><Text>New Team</Text><DropdownMenuShortcut>⌘+T</DropdownMenuShortcut></DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem><Text>GitHub</Text></DropdownMenuItem>
      <DropdownMenuItem><Text>Support</Text></DropdownMenuItem>
      <DropdownMenuItem disabled><Text>API</Text></DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem><Text>Log out</Text><DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut></DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const HoverCardDemo = () => (
  <HoverCard>
    <HoverCardTrigger asChild><Button variant="link"><Text>@expo</Text></Button></HoverCardTrigger>
    <HoverCardContent className="w-72">
      <View className="flex-row gap-3">
        <Avatar alt="expo" className="size-11">
          <AvatarImage source={{ uri: 'https://avatars.githubusercontent.com/u/12504344?s=200' }} />
          <AvatarFallback><Text className="text-xs font-medium">EX</Text></AvatarFallback>
        </Avatar>
        <View className="flex-1 gap-1">
          <Text className="text-sm font-semibold text-foreground">@expo</Text>
          <Text variant="muted" className="text-sm leading-snug">
            Framework and tools for creating native apps with React.
          </Text>
          <View className="mt-1 flex-row items-center gap-1.5">
            <Icon as={CalendarDays} size={13} className="text-muted-foreground" />
            <Text variant="muted" className="text-xs">Joined December 2021</Text>
          </View>
        </View>
      </View>
    </HoverCardContent>
  </HoverCard>
);

const IconDemo = () => (
  <View className="flex-row gap-5">
    <Icon as={Star} size={28} className="text-primary" />
    <Icon as={Heart} size={28} className="text-red-500" />
    <Icon as={Bell} size={28} className="text-amber-500" />
    <Icon as={Check} size={28} className="text-emerald-500" />
  </View>
);

const InputDemo = () => (
  <View className="w-full gap-4">
    <View className="gap-2">
      <Label>Email</Label>
      <Input icon={Mail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
    </View>
    <View className="gap-2">
      <Label>Password</Label>
      <Input icon={Lock} placeholder="••••••••" secureTextEntry />
    </View>
    <View className="gap-2">
      <Label>Disabled</Label>
      <Input icon={Mail} placeholder="Unavailable" editable={false} />
    </View>
    <View className="gap-2">
      <Label>Invalid</Label>
      <Input icon={Mail} invalid defaultValue="not-an-email" autoCapitalize="none" />
      <Text className="text-xs text-destructive">Enter a valid email address.</Text>
    </View>
  </View>
);

const LabelDemo = () => (
  <View className="w-full gap-2"><Label>Your full name</Label><Input placeholder="Ada Lovelace" /></View>
);

const OTPInputDemo = () => {
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  return (
    <View className="w-full gap-4">
      <View className="gap-2">
        <Text className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">6-digit code</Text>
        <OTPInput value={code} onChange={setCode} />
        <Text variant="muted" className="text-xs">{code.length === 6 ? 'Verified ✓' : `${code.length}/6 entered`}</Text>
      </View>
      <View className="gap-2">
        <Text className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">PIN (masked)</Text>
        <OTPInput length={4} masked value={pin} onChange={setPin} />
      </View>
    </View>
  );
};

const MenubarDemo = () => {
  const [value, setValue] = useState<string | undefined>(undefined);
  return (
    <Menubar value={value} onValueChange={setValue}>
      <MenubarMenu value="file">
        <MenubarTrigger><Text>File</Text></MenubarTrigger>
        <MenubarContent>
          <MenubarItem><Text>New Tab</Text><MenubarShortcut>⌘T</MenubarShortcut></MenubarItem>
          <MenubarItem><Text>New Window</Text><MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
          <MenubarItem disabled><Text>New Incognito Window</Text></MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger><Text>Share</Text></MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem><Text>Email link</Text></MenubarItem>
              <MenubarItem><Text>Messages</Text></MenubarItem>
              <MenubarItem><Text>Notes</Text></MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem><Text>Print…</Text><MenubarShortcut>⌘P</MenubarShortcut></MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="edit">
        <MenubarTrigger><Text>Edit</Text></MenubarTrigger>
        <MenubarContent>
          <MenubarItem><Text>Undo</Text><MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
          <MenubarItem><Text>Redo</Text><MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
          <MenubarSeparator />
          <MenubarItem><Text>Cut</Text></MenubarItem>
          <MenubarItem><Text>Copy</Text></MenubarItem>
          <MenubarItem><Text>Paste</Text></MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="view">
        <MenubarTrigger><Text>View</Text></MenubarTrigger>
        <MenubarContent>
          <MenubarItem><Text>Reload</Text><MenubarShortcut>⌘R</MenubarShortcut></MenubarItem>
          <MenubarItem><Text>Toggle Fullscreen</Text></MenubarItem>
          <MenubarItem><Text>Hide Sidebar</Text></MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="profiles">
        <MenubarTrigger><Text>Profiles</Text></MenubarTrigger>
        <MenubarContent>
          <MenubarItem><Text>Andy</Text></MenubarItem>
          <MenubarItem><Text>Benoit</Text></MenubarItem>
          <MenubarItem><Text>Luis</Text></MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};

const PopoverDemo = () => (
  <Popover>
    <PopoverTrigger asChild><Button variant="outline"><Text>Open popover</Text></Button></PopoverTrigger>
    <PopoverContent>
      <View className="gap-1">
        <Text className="font-semibold text-foreground">Dimensions</Text>
        <Text variant="muted" className="text-sm">Set the dimensions for the layer.</Text>
      </View>
      <View className="mt-3 gap-2.5">
        {[
          ['Width', '100%'],
          ['Max. width', '300px'],
          ['Height', '25px'],
          ['Max. height', 'none'],
        ].map(([label, val]) => (
          <View key={label} className="flex-row items-center gap-3">
            <Label className="w-24">{label}</Label>
            <Input className="flex-1" defaultValue={val} />
          </View>
        ))}
      </View>
    </PopoverContent>
  </Popover>
);

const ProgressDemo = () => (
  <View className="w-full gap-2"><Progress value={66} /><Text variant="muted" className="text-xs">66%</Text></View>
);

const RadioGroupDemo = () => {
  const [value, setValue] = useState('comfortable');
  return (
    <RadioGroup value={value} onValueChange={setValue} className="w-full flex-row flex-wrap gap-x-6 gap-y-3">
      {[
        ['compact', 'Compact'],
        ['comfortable', 'Comfortable'],
        ['spacious', 'Spacious'],
      ].map(([val, label]) => (
        <View key={val} className="shrink-0 flex-row items-center gap-2.5">
          <RadioGroupItem value={val} />
          <Label onPress={() => setValue(val)} className="pr-1">{label}</Label>
        </View>
      ))}
    </RadioGroup>
  );
};

const SelectDemo = () => {
  const insets = useSafeAreaInsets();
  return (
    <Select>
      <SelectTrigger className="w-full"><SelectValue placeholder="Select a fruit" /></SelectTrigger>
      <SelectContent insets={insets}>
        <SelectItem label="Apple" value="apple">Apple</SelectItem>
        <SelectItem label="Banana" value="banana">Banana</SelectItem>
        <SelectItem label="Orange" value="orange">Orange</SelectItem>
      </SelectContent>
    </Select>
  );
};

const SheetDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <View className="w-full">
      <Button variant="outline" onPress={() => setOpen(true)}><Text>Open bottom sheet</Text></Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Share"
        description="Anyone with the link can view this project."
        footer={<Button className="flex-1" onPress={() => setOpen(false)}><Text>Done</Text></Button>}>
        <View className="gap-0.5">
          {[
            { icon: Link2, label: 'Copy link' },
            { icon: Star, label: 'Add to favorites' },
            { icon: Users, label: 'Manage access' },
            { icon: Flag, label: 'Report', destructive: true },
          ].map(({ icon, label, destructive }) => (
            <Pressable
              key={label}
              onPress={() => setOpen(false)}
              className="flex-row items-center gap-3 rounded-xl px-2 py-2.5 active:bg-muted">
              <View className={cn('size-9 items-center justify-center rounded-full', destructive ? 'bg-destructive/10' : 'bg-primary/10')}>
                <Icon as={icon} size={18} className={destructive ? 'text-destructive' : 'text-primary'} />
              </View>
              <Text className={cn('flex-1 text-[15px]', destructive ? 'text-destructive' : 'text-foreground')}>{label}</Text>
              <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
            </Pressable>
          ))}
        </View>
      </Sheet>
    </View>
  );
};

const SeparatorDemo = () => (
  <View className="w-full gap-3">
    <Text className="text-sm font-medium">Radix Primitives</Text>
    <Separator />
    <View className="h-8 flex-row items-center gap-3">
      <Text variant="muted" className="text-sm">Blog</Text>
      <Separator orientation="vertical" />
      <Text variant="muted" className="text-sm">Docs</Text>
      <Separator orientation="vertical" />
      <Text variant="muted" className="text-sm">Source</Text>
    </View>
  </View>
);

const SkeletonDemo = () => (
  <View className="w-full flex-row items-center gap-3">
    <Skeleton className="h-12 w-12 rounded-full" />
    <View className="flex-1 gap-2"><Skeleton className="h-4 w-full rounded" /><Skeleton className="h-4 w-2/3 rounded" /></View>
  </View>
);

const SliderDemo = () => {
  const [volume, setVolume] = useState(60);
  const [brightness, setBrightness] = useState(30);
  return (
    <View className="w-full gap-6">
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-foreground">Volume</Text>
          <Text variant="muted" className="text-sm tabular-nums">{volume}%</Text>
        </View>
        <Slider value={volume} onValueChange={setVolume} />
      </View>
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-foreground">Brightness (step 10)</Text>
          <Text variant="muted" className="text-sm tabular-nums">{brightness}%</Text>
        </View>
        <Slider value={brightness} onValueChange={setBrightness} step={10} />
      </View>
    </View>
  );
};

const SpinnerDemo = () => (
  <View className="w-full gap-5">
    <View className="flex-row items-center justify-around">
      <Spinner size={16} />
      <Spinner size={24} className="text-foreground" />
      <Spinner size={32} className="text-primary" />
    </View>
    <Button loading className="w-full"><Text>Saving…</Text></Button>
  </View>
);

const SwitchDemo = () => {
  const [notifications, setNotifications] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [compact, setCompact] = useState(true);
  return (
    <View className="w-full gap-3.5">
      <View className="flex-row items-center gap-3">
        <Switch checked={notifications} onCheckedChange={setNotifications} />
        <Label onPress={() => setNotifications(!notifications)}>Notifications</Label>
      </View>
      <View className="flex-row items-center gap-3">
        <Switch checked={autoUpdate} onCheckedChange={setAutoUpdate} />
        <Label onPress={() => setAutoUpdate(!autoUpdate)}>Auto-update</Label>
      </View>
      <View className="flex-row items-center gap-3">
        <Switch checked={compact} onCheckedChange={setCompact} />
        <Label onPress={() => setCompact(!compact)}>Compact</Label>
      </View>
    </View>
  );
};

const TabsDemo = () => {
  const [tab, setTab] = useState('account');
  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full gap-3">
      <TabsList className="flex-row">
        <TabsTrigger value="account" className="flex-1"><Text>Account</Text></TabsTrigger>
        <TabsTrigger value="password" className="flex-1"><Text>Password</Text></TabsTrigger>
      </TabsList>
      <TabsContent value="account"><Text variant="muted">Make changes to your account here.</Text></TabsContent>
      <TabsContent value="password"><Text variant="muted">Change your password here.</Text></TabsContent>
    </Tabs>
  );
};

const TextDemo = () => (
  <View className="w-full gap-2">
    <Text variant="h3">The King&apos;s Speech</Text>
    <Text variant="large">Large — a lead-in line.</Text>
    <Text variant="p">A regular paragraph with comfortable line height for reading.</Text>
    <Text variant="muted">Muted supporting text.</Text>
    <Text variant="code">npm install</Text>
  </View>
);

const TextareaDemo = () => (
  <View className="w-full gap-2">
    <Label>Message</Label>
    <Textarea placeholder="Type your message here…" maxLength={280} />
  </View>
);

const ToastDemo = () => (
  <View className="w-full flex-row flex-wrap gap-2">
    <Button size="sm" variant="outline" onPress={() => toast.success('Changes saved', { description: 'Your profile is up to date.' })}><Text>Success</Text></Button>
    <Button size="sm" variant="outline" onPress={() => toast.error('Something went wrong', { description: 'Please try again.' })}><Text>Error</Text></Button>
    <Button size="sm" variant="outline" onPress={() => toast.warning('Low storage')}><Text>Warning</Text></Button>
    <Button size="sm" variant="outline" onPress={() => toast.info('Update available')}><Text>Info</Text></Button>
    <Button size="sm" variant="outline" onPress={() => toast('Event created', { action: { label: 'Undo', onClick: () => toast('Reverted') } })}><Text>Action</Text></Button>
    <Button size="sm" variant="outline" onPress={() => toast.promise(new Promise((res) => setTimeout(res, 1800)), { loading: 'Uploading…', success: () => 'Uploaded!', error: 'Upload failed' })}><Text>Promise</Text></Button>
  </View>
);

const ToggleDemo = () => {
  const [pressed, setPressed] = useState(false);
  return (
    <Toggle pressed={pressed} onPressedChange={setPressed}>
      <ToggleIcon as={Bold} />
    </Toggle>
  );
};

const ToggleGroupDemo = () => {
  const [value, setValue] = useState<string[]>(['bold']);
  return (
    <ToggleGroup type="multiple" value={value} onValueChange={setValue}>
      <ToggleGroupItem value="bold"><ToggleGroupIcon as={Bold} /></ToggleGroupItem>
      <ToggleGroupItem value="italic"><ToggleGroupIcon as={Italic} /></ToggleGroupItem>
      <ToggleGroupItem value="underline"><ToggleGroupIcon as={Underline} /></ToggleGroupItem>
    </ToggleGroup>
  );
};

const TooltipDemo = () => (
  <Tooltip>
    <TooltipTrigger asChild><Button variant="outline"><Text>Press me</Text></Button></TooltipTrigger>
    <TooltipContent><Text className="text-xs">Add to library</Text></TooltipContent>
  </Tooltip>
);

const RestartDemo = () => (
  <View className="w-full gap-3">
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="flex-row gap-2">
          <Icon as={RotateCcw} size={16} className="text-foreground" />
          <Text>Restart app</Text>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restart the app?</AlertDialogTitle>
          <AlertDialogDescription>
            This reloads the JS runtime from scratch. Unsaved in-memory state will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel><Text>Cancel</Text></AlertDialogCancel>
          <AlertDialogAction onPress={() => restartApp()}><Text>Restart</Text></AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <Text variant="muted" className="text-xs">
      Uses expo-updates in production, and Metro&apos;s reload in development.
    </Text>
  </View>
);

export interface ShowcaseEntry {
  id: string;
  title: string;
  Demo: ComponentType;
}

export const showcaseEntries: ShowcaseEntry[] = [
  { id: 'accordion', title: 'Accordion', Demo: AccordionDemo },
  { id: 'alert', title: 'Alert', Demo: AlertDemo },
  { id: 'alert-dialog', title: 'Alert Dialog', Demo: AlertDialogDemo },
  { id: 'aspect-ratio', title: 'Aspect Ratio', Demo: AspectRatioDemo },
  { id: 'avatar', title: 'Avatar', Demo: AvatarDemo },
  { id: 'badge', title: 'Badge', Demo: BadgeDemo },
  { id: 'button', title: 'Button', Demo: ButtonDemo },
  { id: 'card', title: 'Card', Demo: CardDemo },
  { id: 'carousel', title: 'Carousel', Demo: CarouselDemo },
  { id: 'checkbox', title: 'Checkbox', Demo: CheckboxDemo },
  { id: 'collapsible', title: 'Collapsible', Demo: CollapsibleDemo },
  { id: 'combobox', title: 'Combobox', Demo: ComboboxDemo },
  { id: 'command', title: 'Command Palette', Demo: CommandDemo },
  { id: 'context-menu', title: 'Context Menu', Demo: ContextMenuDemo },
  { id: 'date-picker', title: 'Date Picker', Demo: DatePickerDemo },
  { id: 'time-picker', title: 'Time Picker', Demo: TimePickerDemo },
  { id: 'modal', title: 'Modal', Demo: ModalDemo },
  { id: 'dropdown-menu', title: 'Dropdown Menu', Demo: DropdownMenuDemo },
  { id: 'hover-card', title: 'Hover Card', Demo: HoverCardDemo },
  { id: 'icon', title: 'Icon', Demo: IconDemo },
  { id: 'input', title: 'Input', Demo: InputDemo },
  { id: 'label', title: 'Label', Demo: LabelDemo },
  { id: 'list', title: 'List', Demo: ListDemo },
  { id: 'record-list', title: 'Record List', Demo: RecordListDemo },
  { id: 'data-table', title: 'Data Table', Demo: DataTableDemo },
  { id: 'data-list', title: 'Data List', Demo: DataListDemo },
  { id: 'stat-tile', title: 'Stat Tile', Demo: StatTileDemo },
  { id: 'stepper', title: 'Stepper', Demo: StepperDemo },
  { id: 'filter-chips', title: 'Filter Chips', Demo: FilterChipsDemo },
  { id: 'timeline', title: 'Timeline', Demo: TimelineDemo },
  { id: 'progress-ring', title: 'Progress Ring', Demo: ProgressRingDemo },
  { id: 'sparkline', title: 'Sparkline', Demo: SparklineDemo },
  { id: 'bar-chart', title: 'Bar Chart', Demo: BarChartDemo },
  { id: 'rating', title: 'Rating', Demo: RatingDemo },
  { id: 'number-input', title: 'Number Input', Demo: NumberInputDemo },
  { id: 'fab', title: 'FAB', Demo: FabDemo },
  { id: 'empty-state', title: 'Empty State', Demo: EmptyStateDemo },
  { id: 'menubar', title: 'Menubar', Demo: MenubarDemo },
  { id: 'otp-input', title: 'OTP Input', Demo: OTPInputDemo },
  { id: 'popover', title: 'Popover', Demo: PopoverDemo },
  { id: 'progress', title: 'Progress', Demo: ProgressDemo },
  { id: 'radio-group', title: 'Radio Group', Demo: RadioGroupDemo },
  { id: 'select', title: 'Select', Demo: SelectDemo },
  { id: 'separator', title: 'Separator', Demo: SeparatorDemo },
  { id: 'sheet', title: 'Bottom Sheet', Demo: SheetDemo },
  { id: 'skeleton', title: 'Skeleton', Demo: SkeletonDemo },
  { id: 'slider', title: 'Slider', Demo: SliderDemo },
  { id: 'spinner', title: 'Spinner', Demo: SpinnerDemo },
  { id: 'switch', title: 'Switch', Demo: SwitchDemo },
  { id: 'tabs', title: 'Tabs', Demo: TabsDemo },
  { id: 'text', title: 'Text', Demo: TextDemo },
  { id: 'textarea', title: 'Textarea', Demo: TextareaDemo },
  { id: 'toast', title: 'Toast', Demo: ToastDemo },
  { id: 'toggle', title: 'Toggle', Demo: ToggleDemo },
  { id: 'toggle-group', title: 'Toggle Group', Demo: ToggleGroupDemo },
  { id: 'tooltip', title: 'Tooltip', Demo: TooltipDemo },
  { id: 'restart', title: 'Restart', Demo: RestartDemo },
];
