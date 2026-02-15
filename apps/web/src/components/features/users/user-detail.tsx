import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import type { GetUserByIdResponse, UpdateUserByIdRequest } from '@pkg/contracts';
import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActionRequest } from '@/hooks/use-action-request';

interface Props {
  user: GetUserByIdResponse;
  onBack: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

export function UserDetail({ user, onBack, onUpdated, onDeleted }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);

  const {
    execute: updateUser,
    error: updateError,
    isLoading: isUpdating,
  } = useActionRequest(api.user.update);
  const {
    execute: deleteUser,
    error: deleteError,
    isLoading: isDeleting,
  } = useActionRequest(api.user.remove);

  const error = updateError?.message ?? deleteError?.message ?? null;

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const dto: UpdateUserByIdRequest = {
      id: user.id,
      name: (formData.get('name') as string) || undefined,
      phone: (formData.get('phone') as string) || undefined,
      role: (formData.get('role') as UpdateUserByIdRequest['role']) || undefined,
    };

    const { e: updateErr } = await updateUser(dto);
    if (!updateErr) onUpdated();
  }

  async function handleDelete() {
    const { e: removeErr } = await deleteUser({ id: user.id });
    if (!removeErr) onDeleted();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" onClick={onBack}>
            {t(k.common.actions.back)}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-6">
        {!editing ? (
          <>
            <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">{t(k.auth.email)}</dt>
              <dd className="font-medium">{user.email}</dd>
              <dt className="text-muted-foreground">{t(k.users.phone)}</dt>
              <dd className="font-medium">{user.phone ?? '—'}</dd>
              <dt className="text-muted-foreground">{t(k.users.role)}</dt>
              <dd>
                <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {user.role}
                </span>
              </dd>
              <dt className="text-muted-foreground">{t(k.common.status.created)}</dt>
              <dd className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</dd>
            </dl>
            <div className="flex gap-2 border-t border-border/50 pt-4">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                {t(k.common.actions.edit)}
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? t(k.users.deleting) : t(k.common.actions.delete)}
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">{t(k.users.name)}</Label>
              <Input id="edit-name" name="name" defaultValue={user.name} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-phone">{t(k.users.phone)}</Label>
              <Input id="edit-phone" name="phone" defaultValue={user.phone ?? ''} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-role">{t(k.users.role)}</Label>
              <select
                id="edit-role"
                name="role"
                defaultValue={user.role}
                className="h-9 rounded-xl border border-input bg-input/30 px-3 text-sm transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
              >
                <option value="MEMBER">{t(k.users.roles.member)}</option>
                <option value="ADMIN">{t(k.users.roles.admin)}</option>
                <option value="OWNER">{t(k.users.roles.owner)}</option>
              </select>
            </div>
            <div className="flex gap-2 border-t border-border/50 pt-4">
              <Button type="submit" size="sm" disabled={isUpdating}>
                {isUpdating ? t(k.users.saving) : t(k.common.actions.save)}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                {t(k.common.actions.cancel)}
              </Button>
            </div>
          </form>
        )}
        {error && <p className="text-xs text-destructive">{t(error)}</p>}
      </CardContent>
    </Card>
  );
}
