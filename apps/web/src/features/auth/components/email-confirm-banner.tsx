import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AUTH_ME_KEY, useAuth } from '@/shared/auth/auth-context';
import { authApi } from '../api';

/**
 * Shown while the signed-in user's address is unconfirmed: what it is, a way
 * to send the link again, and — only now, while nobody has proven it — a way
 * to correct a typo. It blocks nothing.
 */
export function EmailConfirmBanner() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { mutate } = useSWRConfig();
  const [note, setNote] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user || user.emailVerified) return null;

  async function resend() {
    setBusy(true);
    try {
      const { sent } = await authApi.resendEmailConfirmation(i18n.language);
      setNote(sent ? k.auth.confirmationSent : k.auth.confirmationNotSent);
    } catch {
      setNote(k.auth.confirmationNotSent);
    } finally {
      setBusy(false);
    }
  }

  async function change(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await authApi.changeUnverifiedEmail({ email, locale: i18n.language });
      setEditing(false);
      setNote(k.auth.confirmationSent);
      await mutate(AUTH_ME_KEY);
    } catch (error) {
      setNote((error as Error).message || k.auth.errors.unableToChangeEmail);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
      <p className="font-medium">{t(k.auth.confirmEmailTitle)}</p>
      <p className="mt-1 text-muted-foreground">
        {t(k.auth.confirmEmailBody, { email: user.email })}
      </p>
      {editing ? (
        <form onSubmit={change} className="mt-3 flex flex-wrap gap-2">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="max-w-xs"
          />
          <Button type="submit" size="sm" disabled={busy}>
            {t(k.common.actions.save)}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            {t(k.common.actions.cancel)}
          </Button>
        </form>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void resend()}>
            {t(k.auth.resendConfirmation)}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            {t(k.auth.changeEmail)}
          </Button>
        </div>
      )}
      {note && <p className="mt-2 text-xs text-muted-foreground">{t(note)}</p>}
    </div>
  );
}
