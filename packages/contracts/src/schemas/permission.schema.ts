import { z } from 'zod';
import { PERMISSIONS } from '../permissions/list.js';

/**
 * Runtime schema for a permission string, built from the same const as the
 * `Permission` type — so the two cannot drift.
 *
 * It lives here rather than beside the const because `permissions/` is
 * deliberately free of Zod: it ships to the browser through the client entry,
 * and importing Zod there would pull the schema graph into the bundle.
 */
export const PermissionSchema = z.enum(PERMISSIONS);
