import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { k } from '@pkg/locales';
import {
  ORGANIZATION_USER_ROLES,
  type CreateInvitationResponse,
  type OrganizationUserRole,
} from '@pkg/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, Copy, Loader2, Trash2 } from 'lucide-react';
import { useCreateInvitation, useInvitations, useRevokeInvitation } from '../hooks/use-invitations';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Create + manage pending invitations for the active org. Since no email
 * transport exists (GAPS.md), the created link is shown here to copy and hand
 * over out-of-band — the same URL a future email adapter would send.
 */
export function InvitePeopleDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrganizationUserRole>('MEMBER');
  const [created, setCreated] = useState<CreateInvitationResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useInvitations();
  const { execute: createInvite, isLoading: isCreating, error: createError } = useCreateInvitation();
  const { execute: revokeInvite } = useRevokeInvitation();

  const pending = data?.data ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const { e: err, d } = await createInvite({ email: email.trim(), orgRole: role });
    if (!err && d) {
      setCreated(d);
      setEmail('');
      setCopied(false);
      toast.success(t(k.invitations.createdToast));
    }
  };

  const handleCopy = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(created.acceptUrl);
    setCopied(true);
    toast.success(t(k.invitations.copied));
  };

  const handleRevoke = async (id: string) => {
    const { e: err } = await revokeInvite({ id });
    if (!err) {
      toast.success(t(k.invitations.revokedToast));
      if (created?.id === id) setCreated(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t(k.invitations.invitePeople)}</DialogTitle>
          <DialogDescription>{t(k.invitations.inviteDescription)}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">{t(k.invitations.emailLabel)}</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-role">{t(k.invitations.roleLabel)}</Label>
            <NativeSelect
              id="invite-role"
              className="w-full"
              value={role}
              onChange={(e) => setRole(e.target.value as OrganizationUserRole)}
            >
              {ORGANIZATION_USER_ROLES.map((r) => (
                <NativeSelectOption key={r} value={r}>
                  {r}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          {createError && <p className="text-sm text-destructive">{t(createError.message)}</p>}
          <Button type="submit" disabled={isCreating || !email.trim()}>
            {isCreating ? <Loader2 className="size-4 animate-spin" /> : null}
            {t(k.invitations.send)}
          </Button>
        </form>

        {/* Copyable link for the just-created invite */}
        {created && (
          <div className="rounded-md border border-border bg-muted/40 p-3">
            <p className="mb-2 text-sm text-muted-foreground">
              {t(k.invitations.linkReady, { email: created.email })}
            </p>
            <div className="flex items-center gap-2">
              <Input readOnly value={created.acceptUrl} className="font-mono text-xs" />
              <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                <span className="hidden sm:inline">{t(k.invitations.copyLink)}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Pending invitations */}
        <div>
          <p className="mb-2 text-sm font-medium">{t(k.invitations.pending)}</p>
          {isLoading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t(k.invitations.noPending)}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pending.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
                >
                  <span className="flex-1 truncate text-sm">{invite.email}</span>
                  <Badge variant="secondary">{invite.orgRole}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t(k.invitations.revoke)}
                    onClick={() => handleRevoke(invite.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
