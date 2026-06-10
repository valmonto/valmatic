import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { k } from '@pkg/locales';
import { PageHeader } from '@/shared/components/page-header';
import { CreateUserForm } from './components/create-user-form';
import { UserList } from './components/user-list';

export default function UsersPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title={t(k.users.users)}
        description={t(k.users.manageDescription)}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* No refresh wiring needed — create/update/delete invalidate the SWR cache. */}
        <CreateUserForm />
        <UserList />
      </div>
    </div>
  );
}
