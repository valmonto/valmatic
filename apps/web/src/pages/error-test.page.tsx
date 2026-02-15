import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bomb } from 'lucide-react';

function BrokenComponent(): React.ReactNode {
  throw new Error('This is a test error to verify the ErrorBoundary works!');
}

export default function ErrorTestPage() {
  const { t } = useTranslation();
  const [shouldCrash, setShouldCrash] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t(k.common.errorTest.title)}</h1>
        <p className="text-muted-foreground mt-1">{t(k.common.errorTest.description)}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            {t(k.common.errorTest.triggerError)}
          </CardTitle>
          <CardDescription>{t(k.common.errorTest.triggerErrorDescription)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setShouldCrash(true)}>
            <Bomb className="size-4 mr-2" />
            {t(k.common.errorTest.crashPage)}
          </Button>
        </CardContent>
      </Card>

      {shouldCrash && <BrokenComponent />}
    </div>
  );
}
