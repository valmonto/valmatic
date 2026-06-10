import * as React from 'react';
import {
  ArrowRight,
  Bell,
  Bold,
  Check,
  ChevronRight,
  Copy,
  Download,
  Inbox,
  Italic,
  Loader2,
  LogOut,
  MoreHorizontal,
  Pencil,
  PanelRight,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Underline,
  User,
} from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { PageHeader } from '@/shared/components/page-header';
import { CompactModal, WideModal } from '@/components/overlays';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { ArrowDown, ArrowUp, CalendarDays, CreditCard, Mail, Search, Smile } from 'lucide-react';

const demoChartData = [
  { day: 'Mon', visitors: 186 },
  { day: 'Tue', visitors: 305 },
  { day: 'Wed', visitors: 237 },
  { day: 'Thu', visitors: 273 },
  { day: 'Fri', visitors: 409 },
  { day: 'Sat', visitors: 214 },
  { day: 'Sun', visitors: 182 },
];

const demoChartConfig = {
  visitors: { label: 'Visitors', color: 'var(--primary)' },
} satisfies ChartConfig;

const frameworks = ['Next.js', 'Remix', 'Astro', 'Vite', 'Nuxt', 'SvelteKit'];

/** One labelled block within a section. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground/70 uppercase">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
}

// --- SaaS table variations ---------------------------------------------------

type MemberStatus = 'active' | 'invited' | 'suspended';
const members: {
  id: string;
  name: string;
  email: string;
  role: string;
  status: MemberStatus;
  tint: string;
}[] = [
  {
    id: '1',
    name: 'Initial Owner',
    email: 'owner@valmonto.com',
    role: 'Owner',
    status: 'active',
    tint: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300',
  },
  {
    id: '2',
    name: 'Dev Admin',
    email: 'admin@valmonto.com',
    role: 'Admin',
    status: 'active',
    tint: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  },
  {
    id: '3',
    name: 'Jane Cooper',
    email: 'jane@valmonto.com',
    role: 'Member',
    status: 'invited',
    tint: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  },
  {
    id: '4',
    name: 'Marcus Lee',
    email: 'marcus@valmonto.com',
    role: 'Member',
    status: 'suspended',
    tint: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
  },
];

const memberStatus: Record<
  MemberStatus,
  { label: string; variant: 'success' | 'info' | 'warning' }
> = {
  active: { label: 'Active', variant: 'success' },
  invited: { label: 'Invited', variant: 'info' },
  suspended: { label: 'Suspended', variant: 'warning' },
};

const memberInitials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** Members table: row selection + bulk-action bar + avatars + per-row menu. */
function MembersTable() {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const allSelected = selected.size === members.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(members.map((m) => m.id)));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border/60">
      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-primary/[0.04] px-4 py-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <Mail /> Email
            </Button>
            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
              <Trash2 /> Remove
            </Button>
          </div>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={toggleAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m.id} data-state={selected.has(m.id) ? 'selected' : undefined}>
              <TableCell>
                <Checkbox
                  checked={selected.has(m.id)}
                  onCheckedChange={() => toggleOne(m.id)}
                  aria-label={`Select ${m.name}`}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback className={cn('text-xs font-semibold', m.tint)}>
                      {memberInitials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium leading-tight">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{m.role}</TableCell>
              <TableCell>
                <Badge variant={memberStatus[m.status].variant}>
                  {memberStatus[m.status].label}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem>
                      <Pencil /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail /> Resend invite
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      <Trash2 /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const invoices = [
  { id: 'INV-1042', date: 'Jun 1, 2026', amount: 1200, status: 'paid' as const },
  { id: 'INV-1041', date: 'May 1, 2026', amount: 1200, status: 'paid' as const },
  { id: 'INV-1040', date: 'Apr 1, 2026', amount: 980, status: 'paid' as const },
  { id: 'INV-1039', date: 'Mar 1, 2026', amount: 1450, status: 'overdue' as const },
];

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

/** Billing table: sortable amount column, right-aligned figures, totals footer. */
function InvoicesTable() {
  const [dir, setDir] = React.useState<'asc' | 'desc'>('desc');
  const sorted = React.useMemo(
    () => [...invoices].sort((a, b) => (dir === 'asc' ? a.amount - b.amount : b.amount - a.amount)),
    [dir],
  );
  const total = invoices.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">
              <button
                type="button"
                onClick={() => setDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                className="ml-auto inline-flex items-center gap-1 transition-colors hover:text-foreground"
              >
                Amount
                {dir === 'asc' ? (
                  <ArrowUp className="size-3.5" />
                ) : (
                  <ArrowDown className="size-3.5" />
                )}
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((i) => (
            <TableRow key={i.id}>
              <TableCell className="font-medium">{i.id}</TableCell>
              <TableCell className="text-muted-foreground">{i.date}</TableCell>
              <TableCell>
                <Badge variant={i.status === 'paid' ? 'success' : 'destructive'}>
                  {i.status === 'paid' ? 'Paid' : 'Overdue'}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {money(i.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="font-medium">
              Total
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">{money(total)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

const orders = [
  {
    id: 'ORD-7782',
    customer: 'Jane Cooper',
    total: 320,
    items: ['2 × Pro license', '1 × Onboarding session'],
    note: 'Ship to New York, NY · Net 30',
  },
  {
    id: 'ORD-7781',
    customer: 'Marcus Lee',
    total: 149,
    items: ['1 × Team seat (annual)'],
    note: 'Auto-renews Apr 2027',
  },
  {
    id: 'ORD-7780',
    customer: 'Initial Owner',
    total: 980,
    items: ['5 × Pro license', '1 × Priority support'],
    note: 'Invoice emailed to billing@valmonto.com',
  },
];

/** Expandable rows: click a row to reveal its detail panel. */
function ExpandableTable() {
  const [open, setOpen] = React.useState<Set<string>>(new Set(['ORD-7782']));
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <React.Fragment key={o.id}>
              <TableRow
                className="cursor-pointer"
                data-state={open.has(o.id) ? 'selected' : undefined}
                onClick={() => toggle(o.id)}
              >
                <TableCell>
                  <ChevronRight
                    className={cn(
                      'size-4 text-muted-foreground transition-transform',
                      open.has(o.id) && 'rotate-90',
                    )}
                  />
                </TableCell>
                <TableCell className="font-medium">{o.id}</TableCell>
                <TableCell className="text-muted-foreground">{o.customer}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {money(o.total)}
                </TableCell>
              </TableRow>
              {open.has(o.id) && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="bg-muted/30 whitespace-normal">
                    <div className="px-2 py-1">
                      <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Line items
                      </p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {o.items.map((it) => (
                          <li key={it}>{it}</li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs text-muted-foreground/80">{o.note}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const activityLog = Array.from({ length: 14 }, (_, i) => {
  const users = ['Initial Owner', 'Dev Admin', 'Jane Cooper', 'Marcus Lee'];
  const actions = [
    'signed in',
    'updated billing details',
    'invited a teammate',
    'exported a report',
    'changed their password',
    'archived a project',
  ];
  return {
    time: `12:${String(58 - i * 4).padStart(2, '0')}`,
    user: users[i % users.length],
    action: actions[i % actions.length],
  };
});

/** Sticky header on a scrollable body — for long logs/lists. */
function StickyTable() {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-border/60">
      <Table containerClassName="max-h-64 overflow-y-auto">
        <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background/90 [&_th]:backdrop-blur">
          <TableRow>
            <TableHead className="w-20">Time</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activityLog.map((a, i) => (
            <TableRow key={i}>
              <TableCell className="text-muted-foreground tabular-nums">{a.time}</TableCell>
              <TableCell className="font-medium">{a.user}</TableCell>
              <TableCell className="text-muted-foreground">{a.action}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function ComponentsPage() {
  const [progress, setProgress] = React.useState(60);
  const [notifications, setNotifications] = React.useState(true);
  const [otp, setOtp] = React.useState('');
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [futureDate, setFutureDate] = React.useState<Date | undefined>(undefined);
  const [range, setRange] = React.useState<DateRange | undefined>(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 5);
    return { from, to };
  });

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        icon={Sparkles}
        title="Components"
        description="A living gallery of the design system — primitives, controls, and feedback."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Buttons */}
        <Section title="Buttons" description="Variants, sizes, icons, and states.">
          <Row label="Variants">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </Row>
          <Row label="Sizes">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Add">
              <Plus />
            </Button>
            <Button size="icon-sm" variant="outline" aria-label="Notifications">
              <Bell />
            </Button>
          </Row>
          <Row label="With icons & states">
            <Button>
              <Download /> Download
            </Button>
            <Button variant="outline">
              Continue <ArrowRight />
            </Button>
            <Button variant="destructive">
              <Trash2 /> Delete
            </Button>
            <Button disabled>
              <Loader2 className="animate-spin" /> Loading
            </Button>
          </Row>
        </Section>

        {/* Badges */}
        <Section title="Badges" description="Counts, statuses, and tags.">
          <Row label="Variants">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </Row>
          <Row label="Status (soft tonal)">
            <Badge variant="success">
              <Check /> Active
            </Badge>
            <Badge variant="warning">Pending</Badge>
            <Badge variant="info">Beta</Badge>
            <Badge variant="secondary">v1.4.0</Badge>
          </Row>
        </Section>

        {/* Text inputs */}
        <Section title="Inputs" description="Text fields, textarea, and selects.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="demo-email">Email</Label>
              <Input id="demo-email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-role">Role</Label>
              <NativeSelect id="demo-role" className="w-full" defaultValue="member">
                <NativeSelectOption value="owner">Owner</NativeSelectOption>
                <NativeSelectOption value="admin">Admin</NativeSelectOption>
                <NativeSelectOption value="member">Member</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-disabled">Disabled</Label>
              <Input id="demo-disabled" placeholder="Unavailable" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-invalid">Invalid</Label>
              <Input id="demo-invalid" aria-invalid defaultValue="not-an-email" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-msg">Message</Label>
            <Textarea id="demo-msg" placeholder="Write something…" rows={3} />
          </div>
        </Section>

        {/* Selection controls */}
        <Section title="Selection" description="Checkboxes, radios, switches.">
          <Row label="Checkboxes">
            <label className="flex items-center gap-2.5 text-sm">
              <Checkbox defaultChecked /> Email me updates
            </label>
            <label className="flex items-center gap-2.5 text-sm">
              <Checkbox /> Subscribe to newsletter
            </label>
            <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Checkbox disabled /> Disabled
            </label>
          </Row>
          <Separator />
          <Row label="Radio group">
            <RadioGroup defaultValue="comfortable" className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2.5 text-sm">
                <RadioGroupItem value="compact" /> Compact
              </label>
              <label className="flex items-center gap-2.5 text-sm">
                <RadioGroupItem value="comfortable" /> Comfortable
              </label>
              <label className="flex items-center gap-2.5 text-sm">
                <RadioGroupItem value="spacious" /> Spacious
              </label>
            </RadioGroup>
          </Row>
          <Separator />
          <Row label="Switches">
            <label className="flex items-center gap-2.5 text-sm">
              <Switch defaultChecked /> Notifications
            </label>
            <label className="flex items-center gap-2.5 text-sm">
              <Switch /> Auto-update
            </label>
            <label className="flex items-center gap-2.5 text-sm">
              <Switch size="sm" defaultChecked /> Compact
            </label>
          </Row>
        </Section>

        {/* Sliders & progress */}
        <Section title="Sliders & progress" description="Ranges and loading indicators.">
          <Row label="Slider">
            <Slider
              defaultValue={[progress]}
              max={100}
              step={1}
              onValueChange={([v]) => setProgress(v ?? 0)}
              className="w-full max-w-sm"
            />
          </Row>
          <Row label={`Progress — ${progress}%`}>
            <Progress value={progress} className="w-full max-w-sm" />
          </Row>
        </Section>

        {/* Tabs */}
        <Section title="Tabs" description="Segmented and underline navigation.">
          <Row label="Segmented">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4 text-sm text-muted-foreground">
                A summary of everything happening across your workspace.
              </TabsContent>
              <TabsContent value="activity" className="mt-4 text-sm text-muted-foreground">
                The latest events, ordered most-recent first.
              </TabsContent>
              <TabsContent value="settings" className="mt-4 text-sm text-muted-foreground">
                Tune preferences for this workspace.
              </TabsContent>
            </Tabs>
          </Row>
          <Separator />
          <Row label="Underline (line)">
            <Tabs defaultValue="account" className="w-full">
              <TabsList variant="line">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
              </TabsList>
              <TabsContent value="account" className="mt-4 text-sm text-muted-foreground">
                Manage your account details and profile.
              </TabsContent>
              <TabsContent value="password" className="mt-4 text-sm text-muted-foreground">
                Change your password and security settings.
              </TabsContent>
              <TabsContent value="team" className="mt-4 text-sm text-muted-foreground">
                Invite teammates and manage roles.
              </TabsContent>
            </Tabs>
          </Row>
        </Section>

        {/* Feedback */}
        <Section title="Feedback" description="Alerts, avatars, tooltips, skeletons.">
          <Row label="Alert">
            <Alert className="w-full">
              <Sparkles className="size-4" />
              <AlertTitle>Heads up</AlertTitle>
              <AlertDescription>
                This is a gallery page — every control here is the real component.
              </AlertDescription>
            </Alert>
          </Row>
          <Row label="Avatars">
            <Avatar className="size-9">
              <AvatarFallback className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                IO
              </AvatarFallback>
            </Avatar>
            <Avatar className="size-9">
              <AvatarFallback className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                JD
              </AvatarFallback>
            </Avatar>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  Hover me
                </Button>
              </TooltipTrigger>
              <TooltipContent>A tooltip, with the same indigo accent.</TooltipContent>
            </Tooltip>
          </Row>
          <Row label="Skeleton">
            <div className="flex w-full items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </Row>
        </Section>

        {/* Overlays */}
        <Section
          title="Overlays"
          description="Dialogs, sheets, menus, and hovers — all dismiss-on-outside."
        >
          <Row label="Dialogs & sheets">
            {/* Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Rename workspace</DialogTitle>
                  <DialogDescription>
                    This name is visible to everyone in the workspace.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Label htmlFor="ws-name">Workspace name</Label>
                  <Input id="ws-name" defaultValue="Valmonto" />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button>Save changes</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Alert dialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action can’t be undone. All associated data will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <PanelRight /> Open sheet
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Edit profile</SheetTitle>
                  <SheetDescription>Update your details, then save.</SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 px-4">
                  <div className="space-y-2">
                    <Label htmlFor="sheet-name">Name</Label>
                    <Input id="sheet-name" defaultValue="Initial Owner" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sheet-email">Email</Label>
                    <Input id="sheet-email" type="email" defaultValue="owner@valmonto.com" />
                  </div>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button>Save</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </Row>

          <Separator />

          <Row label="Composed modals">
            {/* Compact modal */}
            <CompactModal
              trigger={<Button variant="outline">Compact modal</Button>}
              title="Rename workspace"
              description="This name is visible to everyone in the workspace."
              footer={
                <>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button>Save changes</Button>
                  </DialogClose>
                </>
              }
            >
              <div className="space-y-2 py-2">
                <Label htmlFor="compact-name">Workspace name</Label>
                <Input id="compact-name" defaultValue="Valmonto" />
              </div>
            </CompactModal>

            {/* Wide modal */}
            <WideModal
              trigger={<Button variant="outline">Wide modal</Button>}
              icon={<Pencil />}
              title="Edit project details"
              description="A larger surface for multi-column forms and richer content."
              footer={
                <>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button>Save project</Button>
                  </DialogClose>
                </>
              }
            >
              <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wide-name">Project name</Label>
                  <Input id="wide-name" defaultValue="Atlas" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wide-key">Project key</Label>
                  <Input id="wide-key" defaultValue="ATL" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wide-owner">Owner</Label>
                  <Input id="wide-owner" defaultValue="Initial Owner" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wide-email">Contact email</Label>
                  <Input id="wide-email" type="email" defaultValue="owner@valmonto.com" />
                </div>
              </div>
            </WideModal>

            {/* Wide modal — long, scrolling content */}
            <WideModal
              trigger={<Button variant="outline">Wide modal (scrolling)</Button>}
              icon={<Sparkles />}
              title="Release notes"
              description="The body scrolls while the header and footer stay pinned."
              footer={
                <>
                  <span className="mr-auto text-xs text-muted-foreground">
                    Showing the last 12 releases
                  </span>
                  <DialogClose asChild>
                    <Button variant="ghost">Close</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button>Mark all as read</Button>
                  </DialogClose>
                </>
              }
            >
              <div className="mx-auto max-w-2xl">
                <ol className="relative space-y-8 border-l border-border/60 pl-6">
                  {Array.from({ length: 12 }, (_, i) => {
                    const kinds = [
                      { tag: 'Features', variant: 'info' as const },
                      { tag: 'Performance', variant: 'success' as const },
                      { tag: 'Fixes', variant: 'warning' as const },
                      { tag: 'Stability', variant: 'secondary' as const },
                    ];
                    const kind = kinds[i % kinds.length]!;
                    return (
                      <li key={i} className="relative">
                        <span className="absolute top-1.5 -left-[1.69rem] size-2.5 rounded-full border-2 border-background bg-primary" />
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold tracking-tight">v1.{12 - i}.0</h3>
                          <Badge variant={kind.variant}>{kind.tag}</Badge>
                          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                            Jun {12 - i}, 2026
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          A focused release improving everyday workflows across the dashboard, with
                          refinements to overlays, tables, and billing.
                        </p>
                        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                          {[
                            'Improved load times across the dashboard.',
                            'Fixed a layout shift when opening overlays.',
                            'Resolved an edge case in billing table totals.',
                          ].map((line) => (
                            <li key={line} className="flex items-start gap-2">
                              <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </WideModal>
          </Row>

          <Separator />

          <Row label="Menus & popovers">
            {/* Dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Options <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuLabel>My account</DropdownMenuLabel>
                <DropdownMenuItem>
                  <User /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings /> Settings
                  <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuCheckboxItem
                  checked={notifications}
                  onCheckedChange={setNotifications}
                >
                  Notifications
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <LogOut /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Popover</Button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <PopoverHeader>
                  <PopoverTitle>Dimensions</PopoverTitle>
                  <PopoverDescription>Set the width and height in pixels.</PopoverDescription>
                </PopoverHeader>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pop-w">Width</Label>
                    <Input id="pop-w" defaultValue="320" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pop-h">Height</Label>
                    <Input id="pop-h" defaultValue="240" />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Hover card */}
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="link">@valmonto</Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-72">
                <div className="flex gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                      VM
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Valmonto</p>
                    <p className="text-sm text-muted-foreground">
                      The workspace powering this gallery. Hover cards are great for quick context.
                    </p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </Row>

          <Separator />

          <Row label="Context menu (right-click)">
            <ContextMenu>
              <ContextMenuTrigger className="flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                Right-click anywhere in this area
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem>
                  <Pencil /> Edit
                </ContextMenuItem>
                <ContextMenuItem>
                  <Copy /> Duplicate
                  <ContextMenuShortcut>⌘D</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem variant="destructive">
                  <Trash2 /> Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </Row>
        </Section>

        {/* Toasts & status */}
        <Section title="Toasts & status" description="Transient notifications and loaders.">
          <Row label="Toasts">
            <Button variant="outline" onClick={() => toast('Event created')}>
              Default
            </Button>
            <Button variant="outline" onClick={() => toast.success('Changes saved successfully')}>
              Success
            </Button>
            <Button variant="outline" onClick={() => toast.error('Something went wrong')}>
              Error
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast('Project archived', {
                  description: 'You can restore it within 30 days.',
                  action: { label: 'Undo', onClick: () => toast.success('Restored') },
                })
              }
            >
              With action
            </Button>
          </Row>
          <Separator />
          <Row label="Spinner & keys">
            <Spinner className="size-5 text-primary" />
            <span className="text-sm text-muted-foreground">Loading…</span>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
            <KbdGroup>
              <Kbd>⇧</Kbd>
              <Kbd>⌘</Kbd>
              <Kbd>P</Kbd>
            </KbdGroup>
          </Row>
        </Section>

        {/* More form controls */}
        <Section title="More inputs" description="Select, toggles, and one-time codes.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Fancy select</Label>
              <Select defaultValue="member">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Roles</SelectLabel>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Verification code</Label>
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
          <Separator />
          <Row label="Toggles">
            <Toggle aria-label="Bold">
              <Bold />
            </Toggle>
            <Toggle aria-label="Italic" defaultPressed>
              <Italic />
            </Toggle>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <ToggleGroup type="multiple" defaultValue={['bold']} variant="outline">
              <ToggleGroupItem value="bold" aria-label="Bold">
                <Bold />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Italic">
                <Italic />
              </ToggleGroupItem>
              <ToggleGroupItem value="underline" aria-label="Underline">
                <Underline />
              </ToggleGroupItem>
            </ToggleGroup>
          </Row>
        </Section>

        {/* Data display */}
        <Section title="Data display" description="Accordions, empty states, pagination.">
          <Row label="Accordion">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="a">
                <AccordionTrigger>What is this gallery?</AccordionTrigger>
                <AccordionContent>
                  A living reference of every design-system primitive, rendered with the real
                  components.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="b">
                <AccordionTrigger>Can I use these directly?</AccordionTrigger>
                <AccordionContent>
                  Yes — import them from <code>@/components/ui</code> and they’ll match this
                  styling.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Row>
          <Separator />
          <Row label="Empty state">
            <Empty className="w-full rounded-lg border border-dashed border-border py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Inbox className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No messages yet</EmptyTitle>
                <EmptyDescription>
                  When you receive messages, they’ll show up here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Row>
          <Separator />
          <Row label="Pagination">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    2
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </Row>
        </Section>

        {/* Search & command */}
        <Section title="Search & command" description="Comboboxes and the ⌘K palette.">
          <Row label="Combobox (searchable)">
            <Combobox items={frameworks}>
              <ComboboxInput placeholder="Search framework…" className="w-full sm:w-72" showClear />
              <ComboboxContent>
                <ComboboxEmpty>No framework found.</ComboboxEmpty>
                <ComboboxList>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Row>
          <Separator />
          <Row label="Command palette (inline)">
            <Command className="w-full rounded-lg border border-border/60 shadow-sm">
              <CommandInput placeholder="Type a command or search…" />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  <CommandItem>
                    <CalendarDays /> Calendar
                  </CommandItem>
                  <CommandItem>
                    <Smile /> Search emoji
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Settings">
                  <CommandItem>
                    <User /> Profile
                    <CommandShortcut>⌘P</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <CreditCard /> Billing
                    <CommandShortcut>⌘B</CommandShortcut>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </Row>
        </Section>

        {/* Date & chart */}
        <Section title="Date & data viz" description="Calendar and charts.">
          <Row label="Calendar (single)">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-lg border border-border/60"
            />
          </Row>
          <Separator />
          <Row label="Calendar (date range)">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={range}
              onSelect={setRange}
              className="rounded-lg border border-border/60"
            />
          </Row>
          <Separator />
          <Row label="Calendar (no past dates)">
            <Calendar
              mode="single"
              selected={futureDate}
              onSelect={setFutureDate}
              disabled={{ before: new Date() }}
              className="rounded-lg border border-border/60"
            />
          </Row>
          <Separator />
          <Row label="Area chart">
            <ChartContainer config={demoChartConfig} className="h-[200px] w-full">
              <AreaChart data={demoChartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="visitors"
                  type="natural"
                  stroke="var(--color-visitors)"
                  strokeWidth={2}
                  fill="url(#fillVisitors)"
                />
              </AreaChart>
            </ChartContainer>
          </Row>
        </Section>

        {/* Form composition */}
        <Section title="Form composition" description="Fields and input groups.">
          <Row label="Field (label, hint, error)">
            <div className="grid w-full gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="field-name">Display name</FieldLabel>
                <Input id="field-name" defaultValue="Valmonto" />
                <FieldDescription>This is shown across the workspace.</FieldDescription>
              </Field>
              <Field data-invalid>
                <FieldLabel htmlFor="field-email">Email</FieldLabel>
                <Input id="field-email" aria-invalid defaultValue="not-an-email" />
                <FieldError>Enter a valid email address.</FieldError>
              </Field>
            </div>
          </Row>
          <Separator />
          <Row label="Input groups (addons)">
            <div className="grid w-full gap-4 sm:grid-cols-2">
              <InputGroup>
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput placeholder="Search…" />
              </InputGroup>
              <InputGroup>
                <InputGroupAddon>
                  <Mail />
                </InputGroupAddon>
                <InputGroupInput placeholder="you" />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>@valmonto.com</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <InputGroup>
                <InputGroupInput placeholder="Amount" />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton size="sm">USD</InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </Row>
        </Section>

        {/* Carousel */}
        <Section title="Carousel" description="Swipe or use the arrows.">
          <Row label="Carousel">
            <div className="w-full px-10">
              <Carousel className="w-full">
                <CarouselContent>
                  {Array.from({ length: 5 }, (_, i) => (
                    <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                      <Card>
                        <CardContent className="flex aspect-square items-center justify-center py-0">
                          <span className="text-3xl font-semibold text-muted-foreground/60">
                            {i + 1}
                          </span>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </Row>
        </Section>

        {/* Tables — full width at the end */}
        <Section
          title="Tables"
          description="Common SaaS table patterns — simple, selectable, and billing."
          className="xl:col-span-2"
        >
          <Row label="Simple">
            <div className="w-full overflow-hidden rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: 'Initial Owner', role: 'Owner', status: 'success' as const },
                    { name: 'Dev Admin', role: 'Admin', status: 'success' as const },
                    { name: 'Dev Member', role: 'Member', status: 'warning' as const },
                  ].map((u) => (
                    <TableRow key={u.name}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.role}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={u.status}>
                          {u.status === 'success' ? 'Active' : 'Pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Row>
          <Separator />
          <Row label="Selectable + row actions (members)">
            <MembersTable />
          </Row>
          <Separator />
          <Row label="Sortable + totals (billing)">
            <InvoicesTable />
          </Row>
          <Separator />
          <Row label="Expandable rows (orders)">
            <ExpandableTable />
          </Row>
          <Separator />
          <Row label="Sticky header + scroll (activity)">
            <StickyTable />
          </Row>
        </Section>
      </div>
    </div>
  );
}
