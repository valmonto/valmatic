import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from './components/auth-shell';
import { useRequestPasswordReset } from './hooks/use-auth-actions';

/**
 * "I forgot my password": ask for the email. The answer is the same whether
 * or not the address has an account, so the page says only that a link is on
 * its way if it does.
 */
export default function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { execute, isLoading, error } = useRequestPasswordReset();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { e: err } = await execute({ email, locale: i18n.language });
    if (!err) setSent(true);
  }

  return (
    <AuthShell
      title={t(k.auth.forgotPasswordTitle)}
      description={t(k.auth.forgotPasswordDescription)}
    >
      {sent ? (
        <div className="space-y-4">
          <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            {t(k.auth.resetLinkSent)}
          </p>
          <BackToSignIn />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {t(error.message || k.common.somethingWentWrong)}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t(k.auth.email)}</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t(k.auth.sendingResetLink)}
              </>
            ) : (
              t(k.auth.sendResetLink)
            )}
          </Button>
          <BackToSignIn />
        </form>
      )}
    </AuthShell>
  );
}

export function BackToSignIn() {
  const { t } = useTranslation();
  return (
    <p className="text-center text-sm">
      <Link
        to="/auth/login"
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {t(k.auth.backToSignIn)}
      </Link>
    </p>
  );
}
