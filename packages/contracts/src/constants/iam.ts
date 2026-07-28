/**
 * Identity and access constants — password rules and the role enums.
 *
 * Grouped by domain rather than by kind, matching `schemas/`: as other areas
 * grow they get their own file here (`jobs.ts`, `notifications.ts`) instead of
 * this one accumulating everything.
 */

/** Lowercase, uppercase, number, special character, min 8 characters. */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_ERROR_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';

/**
 * Role enums. The schemas build their `z.enum` from these and the frontend
 * iterates them to render pickers, so they live here rather than beside the
 * schema that consumes them.
 */
export const ORGANIZATION_USER_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const;

export const SYSTEM_ROLES = ['USER', 'MODERATOR', 'ADMIN'] as const;
