import useSWR, { type SWRConfiguration } from 'swr';

type UseCachedRequestOpts<T> = {
  key: string | null;
  fetcher: () => Promise<T>;
  minDuration?: number;
  config?: SWRConfiguration<T>;
};

export const useCachedRequest = <T>({
  key,
  fetcher,
  minDuration = 300,
  config,
}: UseCachedRequestOpts<T>) => {
  const delayedFetcher = () =>
    Promise.all([fetcher(), new Promise((r) => setTimeout(r, minDuration))]).then(([data]) => data);

  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(key, delayedFetcher, config);

  return { data: data ?? null, error: error as Error | null, isLoading, isValidating, mutate };
};
