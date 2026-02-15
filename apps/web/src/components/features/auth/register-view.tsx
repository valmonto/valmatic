import { useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { api } from '@/api';
import { useAuth } from '@/context/auth-context';
import { useActionRequest } from '@/hooks/use-action-request';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hexagon, Loader2, Eye, EyeOff } from 'lucide-react';
import { PASSWORD_REGEX, type RegisterRequest } from '@pkg/contracts';

// --- Password validation helper ---
const validatePassword = (password: string) => {
  if (!PASSWORD_REGEX.test(password)) {
    return k.validation.passwordRequirements;
  }
  return null;
};

// --- Password strength ---
const getPasswordStrength = (password: string, t: (key: string) => string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: t(k.auth.weak), color: 'text-red-500' };
  if (score === 3 || score === 4) return { label: t(k.auth.medium), color: 'text-yellow-600' };
  return { label: t(k.auth.strong), color: 'text-green-600' };
};

// --- Password requirements ---
const passwordRequirements = [
  { test: /.{8,}/, key: k.auth.atLeast8Chars },
  { test: /[A-Z]/, key: k.auth.oneUppercase },
  { test: /[a-z]/, key: k.auth.oneLowercase },
  { test: /\d/, key: k.auth.oneNumber },
  { test: /[^A-Za-z0-9]/, key: k.auth.oneSpecialChar },
];

export const RegisterView = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  // Memoize password strength to avoid recalculating on unrelated re-renders
  const passwordStrength = useMemo(() => getPasswordStrength(password, t), [password, t]);

  // Memoize requirements check results
  const requirementsStatus = useMemo(
    () => passwordRequirements.map((req) => ({ ...req, passed: req.test.test(password) })),
    [password],
  );

  const {
    execute: register,
    isLoading: isApiLoading,
    error,
  } = useActionRequest((dto: RegisterRequest) => api.auth.register(dto));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pwdError = validatePassword(password);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    }

    setPasswordError(null);

    const { d: result } = await register({ name, email, password, organizationName });
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
            <CardTitle className="text-xl">{t(k.auth.createAccount)}</CardTitle>
            <CardDescription>{t(k.auth.getStartedWithWorkspace)}</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {t(error.message || k.auth.errors.unableToCreateAccount)}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t(k.users.name)}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationName">{t(k.orgs.organization)}</Label>
                  <Input
                    id="organizationName"
                    type="text"
                    placeholder="Acme Inc."
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                  />
                </div>
              </div>

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

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">{t(k.auth.password)}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t(k.auth.minCharacters)}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    onKeyDown={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                    onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>

                {capsLockOn && (
                  <p className="text-sm text-yellow-600">{t(k.auth.capsLockWarning)}</p>
                )}

                {/* Password strength */}
                {password && (
                  <p className={`text-sm ${passwordStrength.color}`}>
                    {t(k.auth.strength)}: {passwordStrength.label}
                  </p>
                )}

                {/* Real-time requirements */}
                <div className="space-y-1 text-sm">
                  {requirementsStatus.map((req) => (
                    <div
                      key={req.key}
                      className={req.passed ? 'text-green-600' : 'text-muted-foreground'}
                    >
                      {req.passed ? '\u2714' : '\u2716'} {t(req.key)}
                    </div>
                  ))}
                </div>

                {passwordError && <p className="text-sm text-destructive">{t(passwordError)}</p>}
              </div>

              <Button type="submit" disabled={isApiLoading} className="w-full">
                {isApiLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> {t(k.auth.creatingAccount)}
                  </>
                ) : (
                  t(k.auth.createAccount)
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t(k.auth.alreadyHaveAccount)}{' '}
                <Link
                  to="/auth/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t(k.auth.signIn)}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
