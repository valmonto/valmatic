import { type Permission } from '@pkg/contracts';
import { k } from '@pkg/locales';
import { ShieldX } from 'lucide-react-native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAuthStore } from '@/shared/auth/auth-store';
import { usePermissions } from '@/shared/hooks/use-permissions';

type RequirePermissionProps = {
  /** Single permission to check. */
  permission?: Permission;
  /** Passes if the user has ANY of these. */
  any?: Permission[];
  /** Passes if the user has ALL of these. */
  all?: Permission[];
  /** Rendered when the check passes. */
  children: React.ReactNode;
  /** Rendered instead of the default denied card. */
  fallback?: React.ReactNode;
  /** Render nothing when denied, rather than explaining why. */
  hideOnDenied?: boolean;
};

/**
 * Screen- or section-level permission gate.
 *
 * Mirrors the web component of the same name, including its prop names, so a
 * screen moved between the two apps behaves identically. Use `<Can>` to hide a
 * single control; use this where the user should be told the content exists but
 * is not theirs.
 *
 * Not a security boundary — the API enforces. This decides what to draw.
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
  const loading = useAuthStore((s) => s.status === 'loading');
  const granted = usePermissions();

  const allowed = React.useMemo(() => {
    if (all) return all.length > 0 && all.every((p) => granted.includes(p));
    if (any) return any.length > 0 && any.some((p) => granted.includes(p));
    if (permission) return granted.includes(permission);
    return false;
  }, [granted, permission, any, all]);

  // Deciding before the session resolves would flash a denial at a user who is
  // in fact allowed.
  if (loading) {
    return (
      <View className="min-h-[200px] items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (allowed) return <>{children}</>;
  if (hideOnDenied) return null;
  if (fallback) return <>{fallback}</>;

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <View className="items-center justify-center px-6 py-12">
        <Icon as={ShieldX} size={48} className="mb-4 text-destructive/60" />
        <Text variant="h4" className="text-destructive">
          {t(k.auth.errors.insufficientPermissions)}
        </Text>
        <Text variant="muted" className="mt-2 max-w-md text-center">
          {t(k.auth.errors.roleAuthorizationRequired)}
        </Text>
      </View>
    </Card>
  );
}
