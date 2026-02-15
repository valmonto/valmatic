import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { CreateJobForm } from '@/components/features/jobs/create-job-form';

export default function JobsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t(k.jobs.jobs)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(k.jobs.description)}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <CreateJobForm />
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-medium">{t(k.jobs.aboutJobs)}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(k.jobs.aboutJobsDescription)}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>send-email:</strong> {t(k.jobs.sendEmailDesc)}
              </li>
              <li>
                <strong>generate-report:</strong> {t(k.jobs.generateReportDesc)}
              </li>
              <li>
                <strong>sync-data:</strong> {t(k.jobs.syncDataDesc)}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
