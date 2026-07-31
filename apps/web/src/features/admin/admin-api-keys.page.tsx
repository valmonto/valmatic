import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { MCP_SCOPES, type ApiKey, type McpScope } from '@pkg/contracts';
import { Check, Copy, KeyRound, Loader2, Plus, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/shared/lib/utils';
import { PageHeader } from '@/shared/components/page-header';
import { WideModal } from '@/components/overlays/wide-modal';
import { AdminGate } from './components/admin-gate';
import {
  useAdminApiKeys,
  useAdminCreateApiKey,
  useAdminRevokeApiKey,
} from './hooks/use-admin-api-keys';

/**
 * The one moment the plaintext exists client-side. Shown once, copied, gone —
 * closing this dialog is irreversible by design (the server keeps only a hash).
 */
function KeyRevealDialog({ plaintext, onClose }: { plaintext: string; onClose: () => void }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(plaintext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(k.admin.apiKeys.keyCreatedTitle)}</DialogTitle>
          <DialogDescription>{t(k.admin.apiKeys.keyCreatedWarning)}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 rounded-md bg-muted px-3 py-2 font-mono text-xs break-all select-all">
            {plaintext}
          </code>
          <Button variant="outline" size="sm" onClick={() => void copy()}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {t(copied ? k.admin.apiKeys.copied : k.admin.apiKeys.copy)}
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>{t(k.admin.apiKeys.done)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateKeyDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (plaintext: string) => void;
}) {
  const { t } = useTranslation();
  const create = useAdminCreateApiKey();
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<McpScope[]>([]);

  const toggleScope = (scope: McpScope) =>
    setScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]));

  const submit = async () => {
    const res = await create.execute({ name: name.trim(), scopes });
    if (!res.e && res.d) {
      onOpenChange(false);
      setName('');
      setScopes([]);
      onCreated(res.d.key);
    }
  };

  // Groups derive from the scope naming convention (domain:action), so a new
  // domain groups itself with zero UI changes.
  const scopeGroups = [...new Set(MCP_SCOPES.map((scope) => scope.split(':')[0]!))].map(
    (domain) =>
      [domain, MCP_SCOPES.filter((scope) => scope.startsWith(`${domain}:`))] as const,
  );

  // Scope descriptions are looked up defensively: a scope added to
  // MCP_SCOPES before its description key still renders (just undescribed).
  const scopeDesc = (scope: McpScope): string | null => {
    const key = (k.admin.apiKeys.scopeDesc as Record<string, string>)[scope];
    return key ? t(key) : null;
  };

  return (
    <WideModal
      open={open}
      onOpenChange={onOpenChange}
      icon={<KeyRound />}
      title={t(k.admin.apiKeys.createKey)}
      description={t(k.admin.apiKeys.scopesHint)}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isLoading}>
            {t(k.common.actions.cancel)}
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={create.isLoading || !name.trim() || scopes.length === 0}
          >
            {t(k.common.actions.create)}
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        <div className="grid max-w-md gap-2">
          <Label htmlFor="key-name">{t(k.admin.apiKeys.name)}</Label>
          <Input
            id="key-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t(k.admin.apiKeys.namePlaceholder)}
            maxLength={64}
          />
        </div>
        <div className="grid gap-2">
          <Label>{t(k.admin.apiKeys.scopes)}</Label>
          {/* Domain groups tile the width; each group card holds its scopes.
              More domains -> more tiles; more scopes in a domain -> the tile
              grows down. Group check-all goes indeterminate on partial. */}
          <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {scopeGroups.map(([domain, domainScopes]) => {
              const selectedCount = domainScopes.filter((scope) => scopes.includes(scope)).length;
              const groupState: boolean | 'indeterminate' =
                selectedCount === 0
                  ? false
                  : selectedCount === domainScopes.length
                    ? true
                    : 'indeterminate';
              return (
                <div key={domain} className="rounded-lg border bg-card/50 p-3">
                  <label className="mb-2 flex items-center gap-2">
                    <Checkbox
                      checked={groupState}
                      onCheckedChange={(checked) =>
                        setScopes((prev) =>
                          checked === true
                            ? [...new Set([...prev, ...domainScopes])]
                            : prev.filter((scope) => !domainScopes.includes(scope)),
                        )
                      }
                    />
                    <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {domain}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                      {selectedCount}/{domainScopes.length}
                    </span>
                  </label>
                  <div className="grid gap-2">
                    {domainScopes.map((scope) => {
                      const selected = scopes.includes(scope);
                      return (
                        <button
                          key={scope}
                          type="button"
                          onClick={() => toggleScope(scope)}
                          aria-pressed={selected}
                          className={cn(
                            'flex items-start gap-3 rounded-md border p-3 text-left transition-colors',
                            selected
                              ? 'border-primary/50 bg-primary/5'
                              : 'border-border hover:bg-muted/50',
                          )}
                        >
                          <Checkbox checked={selected} className="pointer-events-none mt-0.5" />
                          <span className="min-w-0">
                            <code className="font-mono text-xs font-medium">{scope}</code>
                            {scopeDesc(scope) && (
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {scopeDesc(scope)}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {create.error && <p className="text-sm text-destructive">{t(create.error.message)}</p>}
      </div>
    </WideModal>
  );
}

function AdminApiKeysView() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useAdminApiKeys();
  const revoke = useAdminRevokeApiKey();

  const [createOpen, setCreateOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' });

  const handleRevoke = async () => {
    if (!keyToRevoke) return;
    const { e } = await revoke.execute({ id: keyToRevoke.id });
    if (!e) setKeyToRevoke(null);
  };

  if (isLoading) {
    return <Loader2 className="mx-auto mt-12 size-6 animate-spin text-muted-foreground" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={KeyRound}
        title={t(k.admin.apiKeys.title)}
        description={t(k.admin.apiKeys.description)}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-1" />
            {t(k.admin.apiKeys.createKey)}
          </Button>
        }
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t(k.admin.apiKeys.name)}</TableHead>
              <TableHead>{t(k.admin.apiKeys.prefix)}</TableHead>
              <TableHead>{t(k.admin.apiKeys.scopes)}</TableHead>
              <TableHead>{t(k.admin.apiKeys.lastUsed)}</TableHead>
              <TableHead>{t(k.admin.created)}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.data.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {t(k.admin.apiKeys.noKeys)}
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((apiKey) => (
              <TableRow key={apiKey.id}>
                <TableCell className="font-medium">{apiKey.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {apiKey.prefix}…
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {apiKey.scopes.map((scope) => (
                      <code
                        key={scope}
                        className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px]"
                      >
                        {scope}
                      </code>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {apiKey.lastUsedAt ? fmtDate(apiKey.lastUsedAt) : t(k.admin.apiKeys.never)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {fmtDate(apiKey.createdAt)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setKeyToRevoke(apiKey)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreateKeyDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={setRevealedKey} />
      {revealedKey && (
        <KeyRevealDialog plaintext={revealedKey} onClose={() => setRevealedKey(null)} />
      )}

      <AlertDialog
        open={keyToRevoke !== null}
        onOpenChange={(open) => !open && setKeyToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(k.admin.apiKeys.revokeTitle)}</AlertDialogTitle>
            <AlertDialogDescription>
              {keyToRevoke?.name} — {t(k.admin.apiKeys.revokeDescription)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoke.isLoading}>
              {t(k.common.actions.cancel)}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleRevoke()} disabled={revoke.isLoading}>
              {t(k.admin.apiKeys.revoke)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminApiKeysPage() {
  return (
    <AdminGate>
      <AdminApiKeysView />
    </AdminGate>
  );
}
