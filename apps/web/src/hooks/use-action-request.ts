import { useState } from 'react';
import { tryCatch } from '@pkg/utils';

type ActionRequestOpts = {
  minDuration?: number;
};

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
