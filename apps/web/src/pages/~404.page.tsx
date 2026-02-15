import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { k } from '@pkg/locales';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">{t(k.common.pageNotFound)}</p>
      <Link to="/" className="text-sm text-primary underline">
        {t(k.common.actions.goHome)}
      </Link>
    </div>
  );
}
