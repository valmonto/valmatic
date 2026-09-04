/**
 * Public surface of the invitations feature. Other layers import from here
 * (`@/features/invitations`) and never reach into internal files directly.
 */
export { invitationRoutes } from './routes';
export { invitationsResource } from './api';
export { OrgInviteButton } from './components/org-invite-button';
export { useInvitations, useCreateInvitation, useRevokeInvitation } from './hooks/use-invitations';
