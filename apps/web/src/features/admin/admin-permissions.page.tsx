import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { ORGANIZATION_USER_ROLES, PERMISSIONS, hasPermission } from '@pkg/contracts';
import { Check } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminGate } from './components/admin-gate';

/**
 * Read-only on purpose: the permission table lives in code (@pkg/contracts)
 * and ships in this bundle, so this page renders it directly — no API call.
 * Editing would require permissions-in-DB, a deliberate future build.
 */
function AdminPermissionsView() {
  const { t } = useTranslation();

  // Group by domain prefix ("user:create" → "user") for scannable sections.
  const domains = [...new Set(PERMISSIONS.map((p) => p.split(':')[0]))];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t(k.admin.permissions)}</h2>
        <p className="text-sm text-muted-foreground">{t(k.admin.permissionsDescription)}</p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t(k.admin.permissions)}</TableHead>
              {ORGANIZATION_USER_ROLES.map((role) => (
                <TableHead key={role} className="text-center">
                  {role}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map((domain) => (
              <>
                <TableRow key={domain} className="bg-muted/40 hover:bg-muted/40">
                  <TableCell
                    colSpan={1 + ORGANIZATION_USER_ROLES.length}
                    className="py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase"
                  >
                    {domain}
                  </TableCell>
                </TableRow>
                {PERMISSIONS.filter((p) => p.startsWith(`${domain}:`)).map((permission) => (
                  <TableRow key={permission}>
                    <TableCell className="font-mono text-xs">{permission}</TableCell>
                    {ORGANIZATION_USER_ROLES.map((role) => (
                      <TableCell key={role} className="text-center">
                        {hasPermission(role, permission) && (
                          <Check className="mx-auto size-4 text-primary" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function AdminPermissionsPage() {
  return (
    <AdminGate>
      <AdminPermissionsView />
    </AdminGate>
  );
}
