import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { CreateUserRequestSchema, type CreateUserResponse, ORGANIZATION_USER_ROLES, type OrganizationUserRole } from '@pkg/contracts';
import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useActionRequest } from '@/hooks/use-action-request';

type Props = { onCreated: () => void };

export function CreateUserForm({ onCreated }: Props) {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CreateUserResponse | null>(null);

  const { execute: createUser, isLoading } = useActionRequest(api.user.create);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    const parsed = CreateUserRequestSchema.safeParse(data);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    const { e: createErr, d: user } = await createUser(parsed.data);
    if (createErr) {
      setErrors({ form: createErr.message });
    } else {
      setResult(user);
      onCreated();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(k.users.createUser)}</CardTitle>
        <CardDescription>{t(k.users.addUser)}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t(k.auth.email)}</Label>
            <Input id="email" name="email" type="email" placeholder={t(k.users.emailPlaceholder)} />
            {errors.email && <p className="text-xs text-destructive">{t(errors.email)}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{t(k.users.name)}</Label>
            <Input id="name" name="name" placeholder={t(k.users.fullName)} />
            {errors.name && <p className="text-xs text-destructive">{t(errors.name)}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t(k.auth.password)}</Label>
            <Input id="password" name="password" type="password" placeholder={t(k.auth.minCharacters)} />
            {errors.password && <p className="text-xs text-destructive">{t(errors.password)}</p>}
            <p className="text-xs text-muted-foreground">
              {t(k.auth.passwordRequirements)}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">{t(k.users.phone)}</Label>
            <Input id="phone" name="phone" placeholder="+1 (555) 000-0000" />
            {errors.phone && <p className="text-xs text-destructive">{t(errors.phone)}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">{t(k.users.role)}</Label>
            <select
              id="role"
              name="role"
              defaultValue={'MEMBER' satisfies OrganizationUserRole}
              className="h-9 rounded-xl border border-input bg-input/30 px-3 text-sm transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
            >
              {ORGANIZATION_USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {t(k.users.roles[role.toLowerCase() as keyof typeof k.users.roles])}
                </option>
              ))}
            </select>
            {errors.role && <p className="text-xs text-destructive">{t(errors.role)}</p>}
          </div>
          <Button type="submit" className="mt-2" disabled={isLoading}>
            {isLoading ? t(k.users.creating) : t(k.common.actions.create)}
          </Button>
          {errors.form && <p className="text-xs text-destructive">{t(errors.form)}</p>}
        </form>
        {result && (
          <pre className="mt-4 overflow-x-auto rounded-xl bg-muted p-4 text-xs font-mono">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
