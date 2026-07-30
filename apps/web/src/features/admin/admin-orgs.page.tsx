import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import type { AdminOrg } from '@pkg/contracts';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/shared/auth/auth-context';
import { AdminGate } from './components/admin-gate';
import { useAdminDeleteOrg, useAdminOrgs } from './hooks/use-admin-orgs';

function AdminOrgsView() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, isLoading } = useAdminOrgs();
  const { execute: deleteOrg, isLoading: isDeleting, error } = useAdminDeleteOrg();
  const [orgToDelete, setOrgToDelete] = useState<AdminOrg | null>(null);

  const handleDelete = async () => {
    if (!orgToDelete) return;
    const { e } = await deleteOrg({ id: orgToDelete.id });
    if (!e) setOrgToDelete(null);
  };

  if (isLoading) {
    return <Loader2 className="mx-auto mt-12 size-6 animate-spin text-muted-foreground" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t(k.admin.organizations)}</h2>
        <p className="text-sm text-muted-foreground">
          {data?.meta.total ?? 0} {t(k.admin.organizations).toLowerCase()}
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t(k.orgs.organization)}</TableHead>
              <TableHead>{t(k.admin.members)}</TableHead>
              <TableHead>{t(k.admin.created)}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  {t(k.admin.noOrgs)}
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((org) => {
              const isActiveOrg = org.id === user?.orgId;
              return (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell className="text-muted-foreground">{org.memberCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {/* The API refuses deleting the admin's active org — the
                        disabled button mirrors that rule instead of offering a
                        doomed click. */}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isActiveOrg}
                      title={isActiveOrg ? t(k.admin.activeOrgHint) : undefined}
                      onClick={() => setOrgToDelete(org)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {error && <p className="text-sm text-destructive">{error.message}</p>}

      <AlertDialog open={!!orgToDelete} onOpenChange={(open) => !open && setOrgToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(k.admin.deleteOrgTitle)}</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{orgToDelete?.name}</strong> — {t(k.admin.deleteOrgDescription)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t(k.common.actions.cancel)}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t(k.common.actions.delete)
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminOrgsPage() {
  return (
    <AdminGate>
      <AdminOrgsView />
    </AdminGate>
  );
}
