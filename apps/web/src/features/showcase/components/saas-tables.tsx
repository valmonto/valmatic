import * as React from 'react';
import { ArrowDown, ArrowUp, ChevronRight, Mail, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

// --- Members: selection + bulk actions + avatars + row menu ---------------

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

const memberStatus: Record<MemberStatus, { label: string; variant: 'success' | 'info' | 'warning' }> =
  {
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

export function MembersTable() {
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

// --- Invoices: sortable amount + totals footer ----------------------------

const invoices = [
  { id: 'INV-1042', date: 'Jun 1, 2026', amount: 1200, status: 'paid' as const },
  { id: 'INV-1041', date: 'May 1, 2026', amount: 1200, status: 'paid' as const },
  { id: 'INV-1040', date: 'Apr 1, 2026', amount: 980, status: 'paid' as const },
  { id: 'INV-1039', date: 'Mar 1, 2026', amount: 1450, status: 'overdue' as const },
];

export function InvoicesTable() {
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
                {dir === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
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
              <TableCell className="text-right font-medium tabular-nums">{money(i.amount)}</TableCell>
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

// --- Expandable rows ------------------------------------------------------

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

export function ExpandableTable() {
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
                <TableCell className="text-right font-medium tabular-nums">{money(o.total)}</TableCell>
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

// --- Sticky header on a scrollable body -----------------------------------

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

export function StickyTable() {
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
