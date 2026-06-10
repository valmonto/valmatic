/**
 * Public surface of the jobs feature. Other layers import from here
 * (`@/features/jobs`) and never reach into internal files directly.
 */
export { jobsRoutes } from './routes';
export { jobsResource } from './api';
export { useCreateExampleJob, useCreateExampleJobsBulk } from './hooks/use-jobs';
