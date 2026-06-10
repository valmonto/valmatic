import { useState } from 'react';
import { Link, Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { PASSWORD_REGEX } from '@pkg/contracts';
import { useAuth } from '@/shared/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { AuthShell } from './auth-shell';
import { useLogin } from '../hooks/use-auth-actions';

// --- Password validation helper ---
const validatePassword = (password: string) => {
  if (!PASSWORD_REGEX.test(password)) {
    return k.validation.passwordRequirements;
  }
  return null;
};

export const AuthView = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { execute: login, isLoading: isApiLoading, error } = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side password validation
    const pwdError = validatePassword(password);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    }

    setPasswordError(null);

    // On success the hook revalidates `me`; the <Navigate> below handles redirect.
    await login({ email, password });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthShell title={t(k.auth.welcomeBack)} description={t(k.auth.signInToAccount)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {t(error.message || k.auth.errors.loginFailed)}
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

        <div className="space-y-2">
          <Label htmlFor="password">{t(k.auth.password)}</Label>
          <Input
            id="password"
            type="password"
            placeholder={t(k.auth.enterPassword)}
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
          />
          {passwordError && <p className="text-sm text-destructive">{t(passwordError)}</p>}
        </div>

        <Button type="submit" disabled={isApiLoading} className="w-full">
          {isApiLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t(k.auth.signingIn)}
            </>
          ) : (
            t(k.auth.signIn)
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t(k.auth.dontHaveAccount)}{' '}
          <Link
            to="/auth/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t(k.auth.createOne)}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};
