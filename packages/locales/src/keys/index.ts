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
export { admin } from './admin';
export { attachments } from './attachments';
export { auth } from './auth';
export { users } from './users';
export { orgs } from './orgs';
export { jobs } from './jobs';
export { notifications } from './notifications';
export { mcp } from './mcp';
export { common } from './common';
export { validation } from './validation';

// Combined keys object for convenience
import { admin } from './admin';
import { attachments } from './attachments';
import { auth } from './auth';
import { users } from './users';
import { orgs } from './orgs';
import { jobs } from './jobs';
import { notifications } from './notifications';
import { mcp } from './mcp';
import { common } from './common';
import { validation } from './validation';

export const k = {
  admin,
  attachments,
  auth,
  users,
  orgs,
  jobs,
  notifications,
  mcp,
  common,
  validation,
} as const;
