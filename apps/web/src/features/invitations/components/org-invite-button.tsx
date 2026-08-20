import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInvitations } from '../hooks/use-invitations';
import { InvitePeopleDialog } from './invite-people-dialog';

/**
 * Header indicator + entry point for invitations, rendered beside the org
 * switcher. It carries the pending-invite "+N" count for the active org and
 * opens the invite dialog. Renders nothing for users who cannot invite
 * (`org:invite`), so the request is never even issued for them.
 *
 * It lives in the invitations feature (not the org feature) because the
 * architecture forbids one feature importing another — the app layout, which
 * sits outside `features/`, composes the two side by side.
 */
export function OrgInviteButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data, canInvite } = useInvitations();

  if (!canInvite) return null;

  const pending = data?.data.length ?? 0;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="relative gap-2"
        onClick={() => setOpen(true)}
        aria-label={t(k.invitations.invitePeople)}
      >
        <UserPlus className="size-4 shrink-0" />
        {pending > 0 && (
          <Badge variant="secondary" className="px-1.5" aria-label={`${pending} pending`}>
            +{pending}
          </Badge>
        )}
      </Button>
      <InvitePeopleDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
