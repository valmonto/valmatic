/**
 * Platform-admin surface translation keys (/admin — @SystemRoles territory).
 */
export const admin = {
  platform: 'admin.platform',
  organizations: 'admin.organizations',
  permissions: 'admin.permissions',
  members: 'admin.members',
  created: 'admin.created',
  deleteOrgTitle: 'admin.deleteOrgTitle',
  deleteOrgDescription: 'admin.deleteOrgDescription',
  activeOrgHint: 'admin.activeOrgHint',
  permissionsDescription: 'admin.permissionsDescription',
  noOrgs: 'admin.noOrgs',

  apiKeys: {
    title: 'admin.apiKeys.title',
    description: 'admin.apiKeys.description',
    createKey: 'admin.apiKeys.createKey',
    name: 'admin.apiKeys.name',
    namePlaceholder: 'admin.apiKeys.namePlaceholder',
    scopes: 'admin.apiKeys.scopes',
    scopesHint: 'admin.apiKeys.scopesHint',
    prefix: 'admin.apiKeys.prefix',
    lastUsed: 'admin.apiKeys.lastUsed',
    never: 'admin.apiKeys.never',
    revoke: 'admin.apiKeys.revoke',
    revokeTitle: 'admin.apiKeys.revokeTitle',
    revokeDescription: 'admin.apiKeys.revokeDescription',
    noKeys: 'admin.apiKeys.noKeys',
    keyCreatedTitle: 'admin.apiKeys.keyCreatedTitle',
    keyCreatedWarning: 'admin.apiKeys.keyCreatedWarning',
    copy: 'admin.apiKeys.copy',
    copied: 'admin.apiKeys.copied',
    done: 'admin.apiKeys.done',
  },
} as const;
