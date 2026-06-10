import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ShieldX } from 'lucide-react';
import type { OrganizationUserRole, OrgUser } from '@pkg/contracts';
import { k } from '@pkg/locales';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useUser, useUsers } from '../hooks/use-users';
import { UserDetail } from './user-detail';
import { UserDetailSkeleton } from './user-detail-skeleton';
import { UserListSkeleton } from './user-list-skeleton';

// Two-letter initials from a name (falls back to the email's first char).
function initials(name: string, email: string) {
  const [first, last] = name.trim().split(/\s+/);
  if (first) return (last ? `${first[0]}${last[0]}` : first.slice(0, 2)).toUpperCase();
  return (email[0] ?? 'U').toUpperCase();
}

// Deterministic avatar tint from the id so each person keeps a stable color.
const avatarTints = [
  'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300',
  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  'bg-rose-500/15 text-rose-600 dark:text-rose-300',
  'bg-sky-500/15 text-sky-600 dark:text-sky-300',
  'bg-violet-500/15 text-violet-600 dark:text-violet-300',
];
function tintFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return avatarTints[h % avatarTints.length];
}

// Role pills — owner stands out (indigo), the rest stay muted.
const roleStyles: Record<OrganizationUserRole, string> = {
  OWNER: 'bg-primary/10 text-primary ring-primary/20',
  ADMIN: 'bg-foreground/5 text-foreground/80 ring-border',
  MEMBER: 'bg-muted text-muted-foreground ring-transparent',
};

function UserRow({ user, onSelect }: { user: OrgUser; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted/60"
    >
      <Avatar
        className={cn('size-8 shrink-0 rounded-full text-xs font-semibold', tintFor(user.id))}
      >
        <AvatarFallback className={cn('rounded-full', tintFor(user.id))}>
          {initials(user.name, user.email)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
          roleStyles[user.role],
        )}
      >
        {user.role}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
    </button>
  );
}

export function UserList() {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { canList, data, error, isLoading } = useUsers();
  const { data: selected, isLoading: isLoadingUser } = useUser(selectedId);

  if (!canList) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ShieldX className="mb-4 h-12 w-12 text-destructive/60" />
          <h2 className="text-lg font-semibold text-destructive">
            {t(k.auth.errors.insufficientPermissions)}
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t(k.auth.errors.roleAuthorizationRequired)}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-destructive">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return <UserListSkeleton />;
  }

  if (selectedId && isLoadingUser) {
    return <UserDetailSkeleton />;
  }

  if (selected) {
    return (
      <UserDetail
        user={selected}
        onBack={() => setSelectedId(null)}
        onUpdated={() => setSelectedId(null)}
        onDeleted={() => setSelectedId(null)}
      />
    );
  }

  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between px-4 py-3.5">
        <h2 className="text-sm font-semibold">{t(k.users.users)}</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {data.meta.total}
        </span>
      </div>
      <div className="h-px bg-border/60" />
      <CardContent className="p-1.5">
        {data.data.length === 0 ? (
          <p className="px-2.5 py-6 text-sm text-muted-foreground">{t(k.users.noUsersYet)}</p>
        ) : (
          <ul>
            {data.data.map((user) => (
              <li key={user.id}>
                <UserRow user={user} onSelect={() => setSelectedId(user.id)} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
