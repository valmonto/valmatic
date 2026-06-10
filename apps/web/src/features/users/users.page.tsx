import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { CreateUserForm } from './components/create-user-form';
import { UserList } from './components/user-list';

export default function UsersPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t(k.users.users)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(k.users.manageDescription)}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* No refresh wiring needed — create/update/delete invalidate the SWR cache. */}
        <CreateUserForm />
        <UserList />
      </div>
    </div>
  );
}
