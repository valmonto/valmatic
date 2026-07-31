import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { AppRouter } from './lib/router';
import { AuthProvider } from '@/shared/auth/auth-context';
import { ThemeProvider } from '@/shared/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import i18n from '@/shared/lib/i18n';
import { initTelemetry } from '@/shared/telemetry/posthog';

import './styles/index';

// Sleeping unless VITE_PUBLIC_POSTHOG_KEY is set — see shared/telemetry.
initTelemetry();

// A deploy replaces the hashed chunks, so a tab loaded before it fails lazy
// route imports ("Failed to fetch dynamically imported module"). Vite emits
// vite:preloadError for exactly this; one reload picks up the new index.html.
// The timestamp guard stops a reload loop when the failure is real (offline,
// asset host down) — then the error surfaces normally instead.
window.addEventListener('vite:preloadError', (event) => {
  const KEY = 'chunk-reload-at';
  const last = Number(sessionStorage.getItem(KEY) ?? 0);
  if (Date.now() - last < 30_000) return;
  sessionStorage.setItem(KEY, String(Date.now()));
  event.preventDefault();
  window.location.reload();
});

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
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </Suspense>
    </I18nextProvider>
  </StrictMode>,
);
