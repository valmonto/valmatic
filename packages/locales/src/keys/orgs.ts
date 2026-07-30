/**
 * Organization management translation keys
 */
export const orgs = {
  // Labels
  organization: 'orgs.organization',
  organizations: 'orgs.organizations',

  // Errors
  errors: {
    notFound: 'orgs.errors.notFound',
    onlyOwnerCanUpdate: 'orgs.errors.onlyOwnerCanUpdate',
    cannotDeleteActiveOrg: 'orgs.errors.cannotDeleteActiveOrg',
    noAccess: 'orgs.errors.noAccess',
    noActiveOrg: 'orgs.errors.noActiveOrg',
    orgMismatch: 'orgs.errors.orgMismatch',
  },
} as const;
