import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldX } from 'lucide-react';
import { k } from '@pkg/locales';
import type { Permission } from '@pkg/contracts';
import { useCan, useCanAny, useCanAll } from '@/hooks/use-permissions';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/card';

type RequirePermissionProps = {
  /** Single permission to check */
  permission?: Permission;
  /** Check if user has ANY of these permissions */
  any?: Permission[];
  /** Check if user has ALL of these permissions */
  all?: Permission[];
  /** Content to render if permission check passes */
  children: ReactNode;
  /** Custom fallback to render instead of default denied card */
  fallback?: ReactNode;
  /** If true, renders nothing when denied instead of showing denied card */
  hideOnDenied?: boolean;
};

/**
 * Protects content that requires specific permissions.
 * Shows a "permission denied" card when check fails (unless hideOnDenied is true).
 *
 * Use this for page-level or section-level protection where users should
 * be informed that content exists but they don't have access.
 *
 * @example
 * // Page-level protection
 * <RequirePermission permission="user:list">
 *   <UsersPage />
 * </RequirePermission>
 *
 * @example
 * // Hide section completely
 * <RequirePermission permission="settings:update" hideOnDenied>
 *   <AdminSettings />
 * </RequirePermission>
 */
export function RequirePermission({
  permission,
  any,
  all,
  children,
  fallback,
  hideOnDenied = false,
}: RequirePermissionProps) {
  const { t } = useTranslation();
  const { isLoading } = useAuth();
  const canSingle = useCan(permission ?? ('org:list' as Permission));
  const canAny = useCanAny(any ?? []);
  const canAll = useCanAll(all ?? []);

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  let allowed = false;
  if (permission) {
    allowed = canSingle;
  } else if (any && any.length > 0) {
    allowed = canAny;
  } else if (all && all.length > 0) {
    allowed = canAll;
  }

  if (!allowed) {
    if (hideOnDenied) return null;
    if (fallback) return <>{fallback}</>;

    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ShieldX className="mb-4 h-12 w-12 text-destructive/60" />
          <h2 className="text-lg font-semibold text-destructive">
            {t(k.auth.errors.insufficientPermissions)}
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t(k.auth.errors.roleAuthorizationRequired)}
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
