import { useState } from 'react';
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
import { Building2, Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';

import { useCreateOrg, useOrgs, useSwitchOrg } from '../hooks/use-orgs';

export function OrgSwitcher() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  const { data, isLoading } = useOrgs();
  const { execute: switchOrg, isLoading: isSwitching } = useSwitchOrg();
  const { execute: createOrg, isLoading: isCreating, error: createError } = useCreateOrg();

  const currentOrg = data?.data.find((org) => org.id === data.currentOrgId);
  const otherOrgs = data?.data.filter((org) => org.id !== data.currentOrgId) ?? [];

  const handleSwitch = async (orgId: string) => {
    // Cache reset (auth/me + org-scoped data) happens inside useSwitchOrg —
    // no page reload, SPA state is preserved.
    await switchOrg({ orgId });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    const { e: err, d: newOrg } = await createOrg({ name: newOrgName.trim() });
    if (!err && newOrg) {
      setNewOrgName('');
      setIsCreateOpen(false);
      // Switch to the new org
      await handleSwitch(newOrg.id);
    }
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
            // shrink overrides the Button base's shrink-0: in the phone-width
            // header this trigger is the one flexible item — it truncates the
            // org name instead of pushing the icon cluster off-screen. The
            // min-w-16 floor keeps the org icon + chevron visible even when
            // truncation eats the whole name.
            className="gap-2 min-w-16 shrink justify-between sm:min-w-[140px]"
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

          {/* No delete here: removing an organization is a platform-admin
              operation (/admin/orgs), not something an OWNER can self-serve. */}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create org dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
            <DialogDescription>Create a new organization. You'll be the owner.</DialogDescription>
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
              {createError && <p className="text-sm text-destructive">{createError.message}</p>}
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
    </>
  );
}
