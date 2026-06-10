import { http } from '@/shared/api/http';
import { authResource } from '@/features/auth';
import { userResource } from '@/features/users';
import { orgResource } from '@/features/org';
import { jobsResource } from '@/features/jobs';
import { notificationsResource } from '@/features/notifications';

export const api = {
  user: userResource(http),
  auth: authResource(http),
  org: orgResource(http),
  jobs: jobsResource(http),
  notifications: notificationsResource(http),
};
