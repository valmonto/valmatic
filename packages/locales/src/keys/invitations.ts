/**
 * Organization-invitation translation keys.
 */
export const invitations = {
  // Errors (also returned by the API as message keys)
  errors: {
    notFound: 'invitations.errors.notFound',
    expired: 'invitations.errors.expired',
    revoked: 'invitations.errors.revoked',
    alreadyAccepted: 'invitations.errors.alreadyAccepted',
    alreadyMember: 'invitations.errors.alreadyMember',
    accountExists: 'invitations.errors.accountExists',
    emailMismatch: 'invitations.errors.emailMismatch',
  },

  // In-app notice raised when an already-registered user is invited
  notice: {
    title: 'invitations.notice.title',
    message: 'invitations.notice.message',
  },

  // Admin UI — create / list / revoke
  invite: 'invitations.invite',
  invitePeople: 'invitations.invitePeople',
  inviteDescription: 'invitations.inviteDescription',
  emailLabel: 'invitations.emailLabel',
  roleLabel: 'invitations.roleLabel',
  send: 'invitations.send',
  pending: 'invitations.pending',
  noPending: 'invitations.noPending',
  copyLink: 'invitations.copyLink',
  copied: 'invitations.copied',
  revoke: 'invitations.revoke',
  revokedToast: 'invitations.revokedToast',
  createdToast: 'invitations.createdToast',
  linkReady: 'invitations.linkReady',
  pendingBadge: 'invitations.pendingBadge',

  // Accept flow (public + authenticated)
  accept: {
    invited: 'invitations.accept.invited',
    joinPrompt: 'invitations.accept.joinPrompt',
    joinButton: 'invitations.accept.joinButton',
    createTitle: 'invitations.accept.createTitle',
    nameLabel: 'invitations.accept.nameLabel',
    passwordLabel: 'invitations.accept.passwordLabel',
    createButton: 'invitations.accept.createButton',
    loginPrompt: 'invitations.accept.loginPrompt',
    loginButton: 'invitations.accept.loginButton',
    wrongAccount: 'invitations.accept.wrongAccount',
    acceptedToast: 'invitations.accept.acceptedToast',
    invalid: 'invitations.accept.invalid',
    back: 'invitations.accept.back',
  },
} as const;
