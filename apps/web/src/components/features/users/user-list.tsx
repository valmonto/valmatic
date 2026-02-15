import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldX } from 'lucide-react';
import { k } from '@pkg/locales';
import type { GetUserByIdResponse, ListUsersResponse } from '@pkg/contracts';
import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCachedRequest } from '@/hooks/use-cached-request';
import { useCan } from '@/hooks/use-permissions';
import { UserDetail } from './user-detail';
import { UserDetailSkeleton } from './user-detail-skeleton';
import { UserListSkeleton } from './user-list-skeleton';

export function UserList() {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canList = useCan('user:list');

  const { data, error, isLoading, mutate } = useCachedRequest<ListUsersResponse>({
    key: canList ? '/api/users' : null,
    fetcher: () => api.user.list({ skip: 0, limit: 20, search: '' }),
  });

  const { data: selected, isLoading: isLoadingUser } = useCachedRequest<GetUserByIdResponse>({
    key: selectedId && canList ? `/api/users/${selectedId}` : null,
    fetcher: () => api.user.get({ id: selectedId! }),
  });

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
        onUpdated={() => {
          setSelectedId(null);
          mutate();
        }}
        onDeleted={() => {
          setSelectedId(null);
          mutate();
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(k.users.users)}</CardTitle>
        <CardDescription>
          {t(k.users.totalUsersCount, { count: data.meta.total })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t(k.users.noUsersYet)}</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {data.data.map((user) => (
              <li
                key={user.id}
                className="group flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 pl-4">
                  <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {user.role}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => setSelectedId(user.id)}
                  >
                    {t(k.common.actions.view)}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
