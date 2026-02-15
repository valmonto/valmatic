import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { api } from '@/api';
import { useActionRequest } from '@/hooks/use-action-request';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Eye, EyeOff, Loader2, LogOut, Shield, KeyRound } from 'lucide-react';
import { PASSWORD_REGEX, type ChangePasswordRequest } from '@pkg/contracts';

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

function ChangePasswordForm() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const {
    execute: changePassword,
    isLoading,
    error,
  } = useActionRequest((dto: ChangePasswordRequest) => api.auth.changePassword(dto));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordError(k.auth.errors.passwordsDoNotMatch);
      return;
    }

    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    }

    setPasswordError(null);

    const { d: result } = await changePassword({ currentPassword, newPassword });
    if (result !== null) {
      // Redirect to login after password change (all sessions cleared)
      window.location.href = '/auth/login';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/15">
            <KeyRound className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          {t(k.auth.changePassword)}
        </CardTitle>
        <CardDescription>
          {t(k.auth.settings.updatePasswordDescription)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {t(error.message) || t(k.auth.errors.failedToChangePassword)}
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t(k.auth.currentPassword)}</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t(k.auth.newPassword)}</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {/* Password strength */}
            {newPassword && (
              <p className={`text-sm ${getPasswordStrength(newPassword, t).color}`}>
                {t(k.auth.strength)}: {getPasswordStrength(newPassword, t).label}
              </p>
            )}

            {/* Real-time requirements */}
            <div className="space-y-1 text-sm">
              {passwordRequirements.map((req) => {
                const ok = req.test.test(newPassword);
                return (
                  <div
                    key={req.key}
                    className={`${ok ? 'text-green-600' : 'text-muted-foreground'}`}
                  >
                    {ok ? '\u2714' : '\u2716'} {t(req.key)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t(k.auth.confirmPassword)}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {passwordError && <p className="text-sm text-destructive">{t(passwordError)}</p>}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t(k.auth.changingPassword)}
              </>
            ) : (
              t(k.auth.changePassword)
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function LogoutAllDevicesCard() {
  const { t } = useTranslation();
  const {
    execute: logoutAll,
    isLoading,
    error,
  } = useActionRequest(() => api.auth.logoutAll({}));

  const handleLogoutAll = async () => {
    const { d: result } = await logoutAll({});
    if (result !== null) {
      // Redirect to login after logging out all devices
      window.location.href = '/auth/login';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/15">
            <LogOut className="size-4 text-red-600 dark:text-red-400" />
          </div>
          {t(k.auth.logOutAllDevices)}
        </CardTitle>
        <CardDescription>
          {t(k.auth.logOutAllDevicesDescription)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive mb-4">
            {t(error.message) || t(k.auth.errors.failedToLogOutAll)}
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> {t(k.auth.loggingOut)}
                </>
              ) : (
                t(k.auth.logOutAllDevices)
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t(k.auth.logOutAllDevicesConfirm)}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(k.auth.logOutAllDevicesWarning)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t(k.common.actions.cancel)}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleLogoutAll}>
                {t(k.auth.logOutAllDevices)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--primary)_0%,transparent_50%)] opacity-[0.08]" />
        <div className="relative">
          <h1 className="text-2xl font-semibold tracking-tight">{t(k.auth.settings.title)}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-lg">
            {t(k.auth.settings.description)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="security">
        <TabsList>
          <TabsTrigger value="security">
            <Shield className="size-4" />
            {t(k.auth.settings.security)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="mt-6 space-y-6">
          <ChangePasswordForm />
          <LogoutAllDevicesCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
