import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { CreateUserForm } from '@/components/features/users/create-user-form';
import { UserList } from '@/components/features/users/user-list';
import { tryCatch } from '@pkg/utils';

// example trycatch
const asyncWorkTest = async () => {
  throw new Error('TEST!');
};

export default function UsersPage() {
  const { t } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    const doFetch = async () => {
      const { e: err, d: result } = await tryCatch(asyncWorkTest());
    };
    doFetch();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t(k.users.users)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(k.users.manageDescription)}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <CreateUserForm onCreated={refresh} />
        <UserList key={refreshKey} />
      </div>
    </div>
  );
}
