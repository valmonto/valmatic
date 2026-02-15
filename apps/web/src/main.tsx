import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { AppRouter } from './lib/router';
import { AuthProvider } from './context/auth-context';
import { ThemeProvider } from './components/theme-provider';
import i18n from './lib/i18n';

import './styles/index';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={<div />}>
        <ThemeProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </ThemeProvider>
      </Suspense>
    </I18nextProvider>
  </StrictMode>,
);
