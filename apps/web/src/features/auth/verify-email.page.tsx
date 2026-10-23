import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useSWRConfig } from 'swr';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { Loader2 } from 'lucide-react';
import { AUTH_ME_KEY } from '@/shared/auth/auth-context';
import { AuthShell } from './components/auth-shell';
import { authApi } from './api';

type State = { kind: 'checking' } | { kind: 'done'; email: string } | { kind: 'invalid' };

/**
 * Opened from the "confirm your email" email. Public: the link may be opened
 * on another device, signed in to nothing.
 */
export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();
  const [state, setState] = useState<State>({ kind: 'checking' });

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    if (!token) {
      setState({ kind: 'invalid' });
      return;
    }
    window.history.replaceState(null, '', window.location.pathname);
    authApi
      .confirmEmail(token)
      .then((res) => {
        setState({ kind: 'done', email: res.email });
        // A signed-in tab stops showing the reminder.
        void mutate(AUTH_ME_KEY);
      })
      .catch(() => setState({ kind: 'invalid' }));
  }, [mutate]);

  return (
    <AuthShell title={t(k.auth.confirmEmailTitle)} description="">
      {state.kind === 'checking' ? (
        <div className="flex justify-center py-6">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {state.kind === 'done' ? (
            <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
              {t(k.auth.emailConfirmed, { email: state.email })}
            </p>
          ) : (
            <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {t(k.auth.errors.verifyLinkInvalid)}
            </p>
          )}
          <p className="text-center text-sm">
            <Link to="/" className="font-medium text-primary underline-offset-4 hover:underline">
              {t(k.common.actions.goHome)}
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  );
}
