/**
 * Centralized translation keys
 *
 * Usage:
 *   import { k } from '@pkg/locales';
 *   t(k.auth.errors.invalidCredentials)
 *
 * Backend:
 *   throw new UnauthorizedException(k.auth.errors.invalidCredentials)
 */
export { admin } from './admin.js';
export { attachments } from './attachments.js';
export { auth } from './auth.js';
export { users } from './users.js';
export { orgs } from './orgs.js';
export { invitations } from './invitations.js';
export { jobs } from './jobs.js';
export { notifications } from './notifications.js';
export { mcp } from './mcp.js';
export { common } from './common.js';
export { validation } from './validation.js';

// Combined keys object for convenience
import { admin } from './admin.js';
import { attachments } from './attachments.js';
import { auth } from './auth.js';
import { users } from './users.js';
import { orgs } from './orgs.js';
import { invitations } from './invitations.js';
import { jobs } from './jobs.js';
import { notifications } from './notifications.js';
import { mcp } from './mcp.js';
import { common } from './common.js';
import { validation } from './validation.js';

export const k = {
  admin,
  attachments,
  auth,
  users,
  orgs,
  invitations,
  jobs,
  notifications,
  mcp,
  common,
  validation,
} as const;
