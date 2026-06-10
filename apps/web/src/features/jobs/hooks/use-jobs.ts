import { useActionRequest } from '@/shared/hooks/use-action-request';
import { jobsApi } from '../api';

/**
 * Jobs is a write-only domain (enqueue actions, no cached reads), so there are
 * no SWR queries or org-scoped cache keys here — just action wrappers. Add
 * `useCachedRequest`-based hooks here if a job list/status view is introduced.
 */
export function useCreateExampleJob() {
  return useActionRequest(jobsApi.createExample);
}

export function useCreateExampleJobsBulk() {
  return useActionRequest(jobsApi.createExampleBulk);
}
