/**
 * User management translation keys
 */
export const users = {
  // Labels
  user: 'users.user',
  users: 'users.users',
  name: 'users.name',
  fullName: 'users.fullName',
  phone: 'users.phone',
  role: 'users.role',
  profile: 'users.profile',
  emailPlaceholder: 'users.emailPlaceholder',

  // Roles
  roles: {
    admin: 'users.roles.admin',
    owner: 'users.roles.owner',
    member: 'users.roles.member',
  },

  // Actions
  createUser: 'users.createUser',
  creating: 'users.creating',
  addUser: 'users.addUser',
  editUser: 'users.editUser',
  deleteUser: 'users.deleteUser',
  deleting: 'users.deleting',
  disableUser: 'users.disableUser',
  enableUser: 'users.enableUser',
  disabled: 'users.disabled',
  save: 'users.save',
  saving: 'users.saving',

  // Page
  management: 'users.management',
  manageDescription: 'users.manageDescription',
  manageRolesDescription: 'users.manageRolesDescription',
  noUsersYet: 'users.noUsersYet',
  totalUsers: 'users.totalUsers',
  totalUsersCount: 'users.totalUsersCount',

  // Errors
  errors: {
    notFound: 'users.errors.notFound',
    notFoundInOrg: 'users.errors.notFoundInOrg',
    emailExists: 'users.errors.emailExists',
    onlyOwnersCanCreateOwners: 'users.errors.onlyOwnersCanCreateOwners',
    ownersCannotChangeOwnRole: 'users.errors.ownersCannotChangeOwnRole',
    onlyOwnersCanPromote: 'users.errors.onlyOwnersCanPromote',
    onlyOwnersCanChangeOwners: 'users.errors.onlyOwnersCanChangeOwners',
    cannotRemoveSelf: 'users.errors.cannotRemoveSelf',
    onlyOwnersCanRemoveOwners: 'users.errors.onlyOwnersCanRemoveOwners',
    cannotDisableSelf: 'users.errors.cannotDisableSelf',
  },
} as const;
