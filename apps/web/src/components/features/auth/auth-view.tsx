import { useState } from 'react';
import { Link, Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { PASSWORD_REGEX } from '@pkg/contracts';
import { api } from '@/api';
import { useAuth } from '@/context/auth-context';
import { useActionRequest } from '@/hooks/use-action-request';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hexagon, Loader2 } from 'lucide-react';

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

  const {
    execute: login,
    isLoading: isApiLoading,
    error,
  } = useActionRequest((dto: { email: string; password: string }) => api.auth.login(dto));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side password validation
    const pwdError = validatePassword(password);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    }

    setPasswordError(null);

    const { d: result } = await login({ email, password });
    if (result) {
      window.location.href = '/';
    }
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
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-1/2 right-0 h-[600px] w-[600px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Hexagon className="size-6" />
          </div>
          <span className="text-lg font-semibold tracking-tight">vboilerplate</span>
        </div>

        <Card className="hover:translate-y-0 hover:shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{t(k.auth.welcomeBack)}</CardTitle>
            <CardDescription>{t(k.auth.signInToAccount)}</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
