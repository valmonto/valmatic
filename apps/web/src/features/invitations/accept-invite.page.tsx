import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { k } from '@pkg/locales';
import { PASSWORD_REGEX, type PreviewInvitationResponse } from '@pkg/contracts';
import { useAuth } from '@/shared/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  useAcceptAsMember,
  useAcceptInvitation,
  usePreviewInvitation,
} from './hooks/use-invitations';

/**
 * Public accept page reachable at `/invite/:token`. It lives OUTSIDE the
 * authenticated app shell, so a brand-new invitee with no account can open the
 * raw link and complete signup standalone. It branches at accept time on
 * account existence (from the preview) and session state:
 *
 *  - no account (`requiresSignup`) → set-password form → create account + join
 *  - account exists, logged in, email matches → "Join {org} as {role}?" confirm
 *  - account exists, not logged in → send to login (returns here), then confirm
 *  - account exists, logged in as someone else → refuse (email-bound)
 */
export default function AcceptInvitePage() {
  const { t } = useTranslation();
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { execute: runPreview } = usePreviewInvitation();
  const [preview, setPreview] = useState<PreviewInvitationResponse | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { e, d } = await runPreview({ token });
      if (cancelled) return;
      if (e || !d) setPreviewFailed(true);
      else setPreview(d);
    })();
    return () => {
      cancelled = true;
    };
    // runPreview is stable enough for a one-shot on token; re-run only if token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (previewFailed) {
    return (
      <Outcome title={t(k.invitations.accept.invited)} message={t(k.invitations.accept.invalid)} />
    );
  }

  if (!preview) {
    return (
      <Shell title={t(k.invitations.accept.invited)} description="">
        <div className="flex justify-center py-6">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  // Not live (revoked / accepted / expired) — a clean, specific message.
  if (preview.status !== 'pending') {
    const messageKey =
      preview.status === 'expired'
        ? k.invitations.errors.expired
        : preview.status === 'revoked'
          ? k.invitations.errors.revoked
          : k.invitations.errors.alreadyAccepted;
    return <Outcome title={t(k.invitations.accept.invited)} message={t(messageKey)} />;
  }

  // Brand-new invitee: set a password and join in one step.
  if (preview.requiresSignup) {
    return <SignupBranch token={token} preview={preview} />;
  }

  // Account exists but nobody is logged in — go log in, then come back here.
  if (!authLoading && !isAuthenticated) {
    return (
      <Outcome
        title={t(k.invitations.accept.invited)}
        message={t(k.invitations.accept.loginPrompt)}
      >
        <Button asChild className="w-full">
          <Link to={`/auth/login?next=/invite/${encodeURIComponent(token)}`}>
            {t(k.invitations.accept.loginButton)}
          </Link>
        </Button>
      </Outcome>
    );
  }

  // Logged in as a different account than the invite targets — refuse.
  if (user && user.email.toLowerCase() !== preview.email.toLowerCase()) {
    return (
      <Outcome
        title={t(k.invitations.accept.invited)}
        message={t(k.invitations.accept.wrongAccount, {
          email: preview.email,
          current: user.email,
        })}
      >
        <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
          {t(k.invitations.accept.back)}
        </Button>
      </Outcome>
    );
  }

  // Logged in, email matches — confirm join.
  return <ConfirmJoinBranch token={token} preview={preview} />;
}

/**
 * Centered card chrome for the standalone (no app-shell) accept page. Kept
 * local to the feature rather than importing the auth feature's shell — one
 * feature must not import another (see eslint boundaries).
 */
function Shell({
  title,
  description,
  children,
}: {
  title: string;
  description: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        {children ? <CardContent>{children}</CardContent> : null}
      </Card>
    </div>
  );
}

function Outcome({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <Shell title={title} description={message}>
      {children ? <div className="space-y-3">{children}</div> : null}
    </Shell>
  );
}

function SignupBranch({ token, preview }: { token: string; preview: PreviewInvitationResponse }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { execute: accept, isLoading, error } = useAcceptInvitation();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!PASSWORD_REGEX.test(password)) {
      setPwError(k.validation.passwordRequirements);
      return;
    }
    setPwError(null);
    const { e: err, d } = await accept({ token, name: name.trim(), password });
    if (!err && d) {
      toast.success(t(k.invitations.accept.acceptedToast, { org: d.orgName }));
      navigate('/');
    }
  };

  return (
    <Shell
      title={t(k.invitations.accept.createTitle)}
      description={t(k.invitations.accept.joinPrompt, {
        org: preview.orgName,
        role: preview.orgRole,
      })}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-destructive">{t(error.message)}</p>}
        <div className="space-y-2">
          <Label htmlFor="accept-email">{t(k.invitations.emailLabel)}</Label>
          <Input id="accept-email" value={preview.email} readOnly disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accept-name">{t(k.invitations.accept.nameLabel)}</Label>
          <Input
            id="accept-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accept-password">{t(k.invitations.accept.passwordLabel)}</Label>
          <Input
            id="accept-password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (pwError) setPwError(null);
            }}
            required
          />
          {pwError && <p className="text-sm text-destructive">{t(pwError)}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading || !name.trim()}>
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
          {t(k.invitations.accept.createButton)}
        </Button>
      </form>
    </Shell>
  );
}

function ConfirmJoinBranch({
  token,
  preview,
}: {
  token: string;
  preview: PreviewInvitationResponse;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { execute: acceptAsMember, isLoading, error } = useAcceptAsMember();

  const handleJoin = async () => {
    const { e: err, d } = await acceptAsMember({ token });
    if (!err && d) {
      toast.success(t(k.invitations.accept.acceptedToast, { org: d.orgName }));
      navigate('/');
    }
  };

  return (
    <Shell
      title={t(k.invitations.accept.invited)}
      description={t(k.invitations.accept.joinPrompt, {
        org: preview.orgName,
        role: preview.orgRole,
      })}
    >
      <div className="space-y-3">
        {error && <p className="text-sm text-destructive">{t(error.message)}</p>}
        <Button className="w-full" onClick={handleJoin} disabled={isLoading}>
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
          {t(k.invitations.accept.joinButton)}
        </Button>
        <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
          {t(k.invitations.accept.back)}
        </Button>
      </div>
    </Shell>
  );
}
