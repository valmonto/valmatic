import { http } from '@/shared/api/http';
import { authResource } from '@/features/auth';
import { userResource } from '@/features/users';
import { notificationsResource } from '@/features/notifications';
import { invitationsResource } from '@/features/invitations';

export const api = {
  user: userResource(http),
  auth: authResource(http),
  notifications: notificationsResource(http),
  invitations: invitationsResource(http),
};
