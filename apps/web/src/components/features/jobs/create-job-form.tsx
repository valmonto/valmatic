import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { CreateExampleJobRequestSchema, type CreateExampleJobResponse } from '@pkg/contracts';
import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useActionRequest } from '@/hooks/use-action-request';
import { useAuth } from '@/context/auth-context';

type Props = { onCreated?: () => void };

export function CreateJobForm({ onCreated }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CreateExampleJobResponse | null>(null);

  const { execute: createJob, isLoading } = useActionRequest(api.jobs.createExample);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setResult(null);

    if (!user) {
      setErrors({ form: t(k.jobs.errors.mustBeLoggedIn) });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData);

    // Parse priority and delay as numbers if provided
    let parsedData = {};
    try {
      parsedData = rawData.data ? JSON.parse(rawData.data as string) : {};
    } catch {
      setErrors({ data: t(k.validation.invalidJson) });
      return;
    }

    const data = {
      userId: user.id, // Use current user's ID
      action: rawData.action,
      priority: rawData.priority ? Number(rawData.priority) : undefined,
      delay: rawData.delay ? Number(rawData.delay) : undefined,
      data: parsedData,
    };

    const parsed = CreateExampleJobRequestSchema.safeParse(data);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    const { e: createErr, d: job } = await createJob(parsed.data);
    if (createErr) {
      setErrors({ form: createErr.message });
    } else {
      setResult(job);
      onCreated?.();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(k.jobs.createJob)}</CardTitle>
        <CardDescription>{t(k.jobs.queueDescription)}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t(k.users.user)}</Label>
            <p className="text-sm text-muted-foreground">
              {user?.email ?? t(k.auth.notLoggedIn)}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="action">{t(k.common.status.action)}</Label>
            <select
              id="action"
              name="action"
              defaultValue="send-email"
              className="h-9 rounded-xl border border-input bg-input/30 px-3 text-sm transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
            >
              <option value="send-email">{t(k.jobs.sendEmail)}</option>
              <option value="generate-report">{t(k.jobs.generateReport)}</option>
              <option value="sync-data">{t(k.jobs.syncData)}</option>
            </select>
            {errors.action && <p className="text-xs text-destructive">{t(errors.action)}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="data">{t(k.jobs.dataJson)}</Label>
            <Input id="data" name="data" placeholder='{"email": "test@example.com"}' defaultValue="{}" />
            {errors.data && <p className="text-xs text-destructive">{t(errors.data)}</p>}
            <p className="text-xs text-muted-foreground">{t(k.jobs.dataJsonDesc)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="priority">{t(k.jobs.priority)}</Label>
              <Input id="priority" name="priority" type="number" min={1} max={10} placeholder="5" />
              {errors.priority && <p className="text-xs text-destructive">{t(errors.priority)}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="delay">{t(k.jobs.delay)}</Label>
              <Input id="delay" name="delay" type="number" min={0} placeholder="0" />
              {errors.delay && <p className="text-xs text-destructive">{t(errors.delay)}</p>}
            </div>
          </div>
          <Button type="submit" className="mt-2" disabled={isLoading || !user}>
            {isLoading ? t(k.jobs.queueing) : t(k.jobs.queueJob)}
          </Button>
          {errors.form && <p className="text-xs text-destructive">{t(errors.form)}</p>}
        </form>
        {result && (
          <div className="mt-4 rounded-xl bg-muted p-4">
            <p className="text-sm font-medium text-green-600">{t(k.jobs.queuedSuccess)}</p>
            <pre className="mt-2 overflow-x-auto text-xs font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
