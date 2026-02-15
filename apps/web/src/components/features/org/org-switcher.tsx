import { useState, useCallback } from 'react';
import { api } from '@/api';
import { useCachedRequest } from '@/hooks/use-cached-request';
import { useActionRequest } from '@/hooks/use-action-request';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';
import {
  Building2,
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react';
import type { ListOrgsResponse, Organization } from '@pkg/contracts';

export function OrgSwitcher() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [newOrgName, setNewOrgName] = useState('');

  const fetcher = useCallback(() => api.org.list({}), []);
  const { data, isLoading, mutate } = useCachedRequest<ListOrgsResponse>({
    key: '/api/orgs',
    fetcher,
  });

  const { execute: switchOrg, isLoading: isSwitching } = useActionRequest(api.org.switch);
  const { execute: createOrg, isLoading: isCreating, error: createError } = useActionRequest(api.org.create);
  const { execute: deleteOrg, isLoading: isDeleting } = useActionRequest(api.org.remove);

  const currentOrg = data?.data.find((org) => org.id === data.currentOrgId);
  const otherOrgs = data?.data.filter((org) => org.id !== data.currentOrgId) ?? [];

  const handleSwitch = async (orgId: string) => {
    const { e } = await switchOrg({ orgId });
    if (!e) {
      // Reload the page to refresh all data with new org context
      window.location.reload();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    const { e: err, d: newOrg } = await createOrg({ name: newOrgName.trim() });
    if (!err && newOrg) {
      setNewOrgName('');
      setIsCreateOpen(false);
      mutate();
      // Switch to the new org
      await handleSwitch(newOrg.id);
    }
  };

  const handleDelete = async () => {
    if (!orgToDelete) return;

    const { e } = await deleteOrg({ id: orgToDelete.id });
    if (!e) {
      setOrgToDelete(null);
      setIsDeleteOpen(false);
      mutate();
    }
  };

  const openDeleteDialog = (org: Organization) => {
    setOrgToDelete(org);
    setIsDeleteOpen(true);
  };

  if (isLoading || !data) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Loader2 className="size-4 animate-spin" />
        <span className="hidden sm:inline">Loading...</span>
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 min-w-[140px] justify-between"
            disabled={isSwitching}
          >
            <div className="flex items-center gap-2 truncate">
              <Building2 className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{currentOrg?.name ?? 'Select org'}</span>
            </div>
            {isSwitching ? (
              <Loader2 className="size-4 shrink-0 animate-spin" />
            ) : (
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[220px]">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Organizations
          </DropdownMenuLabel>

          {/* Current org */}
          {currentOrg && (
            <DropdownMenuItem disabled className="gap-2">
              <Check className="size-4" />
              <span className="truncate flex-1">{currentOrg.name}</span>
              <span className="text-xs text-muted-foreground">{currentOrg.role}</span>
            </DropdownMenuItem>
          )}

          {/* Other orgs */}
          {otherOrgs.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {otherOrgs.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  className="gap-2 group"
                  onSelect={(e) => {
                    e.preventDefault();
                  }}
                >
                  <button
                    className="flex items-center gap-2 flex-1 min-w-0"
                    onClick={() => handleSwitch(org.id)}
                  >
                    <div className="size-4" />
                    <span className="truncate flex-1 text-left">{org.name}</span>
                    <span className="text-xs text-muted-foreground">{org.role}</span>
                  </button>
                  {org.role === 'OWNER' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(org);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </button>
                  )}
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuSeparator />

          {/* Create new org */}
          <DropdownMenuItem onSelect={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="size-4" />
            <span>Create organization</span>
          </DropdownMenuItem>

          {/* Current org settings (if owner) */}
          {currentOrg?.role === 'OWNER' && (
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onSelect={() => openDeleteDialog(currentOrg)}
              disabled={data.data.length <= 1}
            >
              <Trash2 className="size-4" />
              <span>Delete current org</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create org dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
            <DialogDescription>
              Create a new organization. You'll be the owner.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization name</Label>
                <Input
                  id="org-name"
                  placeholder="Acme Inc."
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  autoFocus
                />
              </div>
              {createError && (
                <p className="text-sm text-destructive">{createError.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !newOrgName.trim()}>
                {isCreating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete org confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{orgToDelete?.name}</strong> and remove all
              members. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
