import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { PASSWORD_REGEX } from '@pkg/contracts';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from './components/auth-shell';
import { authApi } from './api';
import { useConfirmPasswordReset } from './hooks/use-auth-actions';
import { BackToSignIn } from './forgot-password.page';

/** The token from the link: it rides in the fragment, never sent to a server by the browser. */
function tokenFromHash(): string | null {
  return new URLSearchParams(window.location.hash.slice(1)).get('token');
}

type LinkState = 'checking' | 'valid' | 'invalid';

/**
 * Opened from the "choose a new password" email. Checks the link first, so
 * an expired one says so before anybody types a password.
 */
export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [token] = useState(tokenFromHash);
  const [linkState, setLinkState] = useState<LinkState>(token ? 'checking' : 'invalid');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const { execute, isLoading, error } = useConfirmPasswordReset();

  useEffect(() => {
    if (!token) return;
    // The token is out of the address bar once read, so it is not left in
    // history or a screenshot.
    window.history.replaceState(null, '', window.location.pathname);
    authApi
      .checkPasswordReset(token)
      .then((res) => setLinkState(res.valid ? 'valid' : 'invalid'))
      .catch(() => setLinkState('invalid'));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!PASSWORD_REGEX.test(password)) return setFormError(k.validation.passwordRequirements);
    if (password !== confirm) return setFormError(k.auth.errors.passwordsDoNotMatch);
    setFormError(null);
    const { e: err } = await execute({ token: token!, newPassword: password });
    if (!err) setDone(true);
  }

  const title = t(k.auth.chooseNewPassword);
  if (linkState === 'checking') {
    return (
      <AuthShell title={title} description="">
        <div className="flex justify-center py-6">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AuthShell>
    );
  }
  if (linkState === 'invalid') {
    return (
      <AuthShell title={title} description="">
        <div className="space-y-4">
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {t(k.auth.errors.resetLinkInvalid)}
          </p>
          <p className="text-center text-sm">
            <Link
              to="/auth/forgot-password"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t(k.auth.forgotPasswordTitle)}
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }
  if (done) {
    return (
      <AuthShell title={title} description="">
        <div className="space-y-4">
          <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            {t(k.auth.passwordChanged)}
          </p>
          <BackToSignIn />
        </div>
      </AuthShell>
    );
  }

  const message = formError ?? error?.message ?? null;
  return (
    <AuthShell title={title} description={t(k.auth.passwordRequirements)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {t(message)}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="new-password">{t(k.auth.newPassword)}</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">{t(k.auth.confirmPassword)}</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t(k.auth.settingNewPassword)}
            </>
          ) : (
            t(k.auth.chooseNewPassword)
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
