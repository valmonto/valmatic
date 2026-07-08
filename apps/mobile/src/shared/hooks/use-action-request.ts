import { tryCatch } from '@pkg/utils';
import { useState } from 'react';

type ActionRequestOpts = {
  minDuration?: number;
};

/**
 * Wrapper for POST/PATCH/DELETE-style mutations — mirrors the web app's
 * `useActionRequest`. `execute(input)` resolves to `{ e, d }` (error / data),
 * and exposes `isLoading` / `error` for the UI.
 */
export const useActionRequest = <TInput, TOutput>(
  action: (input: TInput) => Promise<TOutput>,
  opts?: ActionRequestOpts,
) => {
  const { minDuration = 300 } = opts ?? {};

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async (input: TInput) => {
    setIsLoading(true);
    setError(null);

    const [{ e, d }] = await Promise.all([
      tryCatch(action(input)),
      new Promise((r) => setTimeout(r, minDuration)),
    ]);

    setIsLoading(false);

    if (e) {
      setError(e);
      return { e, d: null } as const;
    }

    return { e: null, d } as const;
  };

  const reset = () => setError(null);

  return { execute, isLoading, error, reset };
};
