import useSWR, { type SWRConfiguration } from 'swr';

type UseCachedRequestOpts<T> = {
  /** SWR cache key; pass `null` to disable the request (e.g. while logged out). */
  key: string | null;
  fetcher: () => Promise<T>;
  minDuration?: number;
  config?: SWRConfiguration<T>;
};

/**
 * SWR wrapper for GET-style reads — mirrors the web app's `useCachedRequest`.
 * Returns cached data with loading/validating/error flags and a `mutate` to
 * refresh or optimistically update.
 */
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
