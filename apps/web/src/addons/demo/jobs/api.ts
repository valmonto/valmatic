import type {
  CreateExampleJobRequest,
  CreateExampleJobResponse,
  CreateExampleJobsBulkRequest,
  CreateExampleJobsBulkResponse,
} from '@pkg/contracts';
import { http, type HttpClient } from '@/shared/api/http';

/**
 * Factory kept exported so the global `api` aggregator can compose it.
 * Prefer the feature-local hooks (`use-jobs.ts`) over reaching for this directly.
 */
export const jobsResource = (client: HttpClient) => ({
  createExample: (dto: CreateExampleJobRequest): Promise<CreateExampleJobResponse> =>
    client.post('/api/jobs/example', dto),

  createExampleBulk: (dto: CreateExampleJobsBulkRequest): Promise<CreateExampleJobsBulkResponse> =>
    client.post('/api/jobs/example/bulk', dto),
});

/** Bound instance the feature uses internally. */
export const jobsApi = jobsResource(http);
