import { useTranslation } from 'react-i18next';
import { ListTodo } from 'lucide-react';
import { k } from '@pkg/locales';
import { PageHeader } from '@/shared/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateJobForm } from './components/create-job-form';

export default function JobsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader icon={ListTodo} title={t(k.jobs.jobs)} description={t(k.jobs.description)} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CreateJobForm />
        <Card>
          <CardHeader>
            <CardTitle>{t(k.jobs.aboutJobs)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t(k.jobs.aboutJobsDescription)}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <strong className="font-medium text-foreground/80">send-email:</strong>{' '}
                {t(k.jobs.sendEmailDesc)}
              </li>
              <li>
                <strong className="font-medium text-foreground/80">generate-report:</strong>{' '}
                {t(k.jobs.generateReportDesc)}
              </li>
              <li>
                <strong className="font-medium text-foreground/80">sync-data:</strong>{' '}
                {t(k.jobs.syncDataDesc)}
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
