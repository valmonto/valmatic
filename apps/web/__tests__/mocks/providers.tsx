import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { SWRConfig } from 'swr';

import i18n from './i18n';

interface WrapperProps {
  children: ReactNode;
  initialEntries?: string[];
}

function TestProviders({ children, initialEntries = ['/'] }: WrapperProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </SWRConfig>
    </I18nextProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

function customRender(ui: ReactElement, options: CustomRenderOptions = {}): RenderResult {
  const { initialEntries, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders initialEntries={initialEntries}>{children}</TestProviders>
    ),
    ...renderOptions,
  });
}

export * from '@testing-library/react';
export { customRender as render };
