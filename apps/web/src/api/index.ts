import { http } from './http';
import { authResource } from './resources/auth';
import { userResource } from './resources/user';
import { orgResource } from './resources/org';
import { jobsResource } from './resources/jobs';
import { notificationsResource } from './resources/notifications';

export const api = {
  user: userResource(http),
  auth: authResource(http),
  org: orgResource(http),
  jobs: jobsResource(http),
  notifications: notificationsResource(http),
};
