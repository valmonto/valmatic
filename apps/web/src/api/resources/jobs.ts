import type {
  CreateExampleJobRequest,
  CreateExampleJobResponse,
  CreateExampleJobsBulkRequest,
  CreateExampleJobsBulkResponse,
} from '@pkg/contracts';
import type { HttpClient } from '../http';

export const jobsResource = (http: HttpClient) => ({
  createExample: (dto: CreateExampleJobRequest): Promise<CreateExampleJobResponse> =>
    http.post('/api/jobs/example', dto),

  createExampleBulk: (dto: CreateExampleJobsBulkRequest): Promise<CreateExampleJobsBulkResponse> =>
    http.post('/api/jobs/example/bulk', dto),
});
