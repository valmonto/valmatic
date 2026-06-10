import * as bcrypt from 'bcryptjs';
import { SECURITY_CONFIG } from '@pkg/server';
import {
  and,
  eq,
  type DatabaseClient,
  type Organization,
  type OrganizationUserRole,
  type SystemRole,
  type User,
  organization,
  organizationUser,
  user,
} from '@pkg/database';

const { BCRYPT_ROUNDS } = SECURITY_CONFIG;

type Db = DatabaseClient['db'];

export interface SeedUserSpec {
  email: string;
  name: string;
  /** Plaintext password. Only applied when the user is first created. */
  password: string;
  systemRole?: SystemRole;
}

/**
 * Upsert a user by email.
 *
 * The password is only set on initial creation — an existing user's
 * `passwordHash` is never overwritten, so re-seeding can't reset a password
 * someone has already changed.
 */
export async function upsertUser(db: Db, spec: SeedUserSpec): Promise<User | undefined> {
  const passwordHash = await bcrypt.hash(spec.password, BCRYPT_ROUNDS);

  const [row] = await db
    .insert(user)
    .values({
      email: spec.email,
      name: spec.name,
      passwordHash,
      systemRole: spec.systemRole ?? 'USER',
    })
    .onConflictDoUpdate({
      target: user.email,
      // Intentionally omit passwordHash here — never clobber an existing password.
      set: { name: spec.name, systemRole: spec.systemRole ?? 'USER' },
    })
    .returning();

  return row;
}

/**
 * Find an organization owned by `ownerId` with the given name, or create it.
 * `organization.name` has no unique constraint, so we look up by (name, owner)
 * rather than relying on `onConflict`.
 */
export async function findOrCreateOrg(
  db: Db,
  name: string,
  ownerId: string,
): Promise<Organization | undefined> {
  const existing = await db
    .select()
    .from(organization)
    .where(and(eq(organization.name, name), eq(organization.ownerId, ownerId)))
    .limit(1);

  if (existing[0]) return existing[0];

  const [created] = await db.insert(organization).values({ name, ownerId }).returning();
  return created;
}

/** Upsert an org membership, keeping the role in sync. */
export async function upsertMembership(
  db: Db,
  orgId: string,
  userId: string,
  role: OrganizationUserRole,
): Promise<void> {
  await db
    .insert(organizationUser)
    .values({ orgId, userId, role })
    .onConflictDoUpdate({
      target: [organizationUser.orgId, organizationUser.userId],
      set: { role },
    });
}
