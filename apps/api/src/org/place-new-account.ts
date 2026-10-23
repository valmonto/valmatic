import { InternalServerErrorException } from '@nestjs/common';
import {
  asc,
  organization,
  organizationUser,
  sql,
  type DatabaseClient,
  type OrganizationUser,
} from '@pkg/database';
import { k } from '@pkg/locales';

type Tx = Parameters<Parameters<DatabaseClient['db']['transaction']>[0]>[0];

/**
 * Where a brand-new account belongs, inside the transaction that creates it.
 *
 * - **Many organizations** (the `organizations` add-on, MULTI_ORG): the account
 *   founds its own, named `organizationName`, and is its OWNER.
 * - **One organization** (the default): the account joins it as a MEMBER. The
 *   very first account founds it instead and owns it. A lock makes the "is
 *   there one yet?" check and the insert one step, so two first sign-ups at
 *   the same moment cannot found two.
 */
export async function placeNewAccount(
  tx: Tx,
  userId: string,
  opts: { multiOrg: boolean; organizationName: string },
): Promise<OrganizationUser> {
  if (!opts.multiOrg) {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('valmatic:the-organization'))`);
    const [theOne] = await tx
      .select({ id: organization.id })
      .from(organization)
      .orderBy(asc(organization.createdAt), asc(organization.id))
      .limit(1);
    if (theOne) {
      const [membership] = await tx
        .insert(organizationUser)
        .values({ orgId: theOne.id, userId, role: 'MEMBER' })
        .returning();
      if (!membership) {
        throw new InternalServerErrorException(k.common.errors.failedToCreateOrgMembership);
      }
      return membership;
    }
  }

  const [org] = await tx
    .insert(organization)
    .values({ name: opts.organizationName, ownerId: userId })
    .returning();
  if (!org) throw new InternalServerErrorException(k.common.errors.failedToCreateOrg);
  const [membership] = await tx
    .insert(organizationUser)
    .values({ orgId: org.id, userId, role: 'OWNER' })
    .returning();
  if (!membership) {
    throw new InternalServerErrorException(k.common.errors.failedToCreateOrgMembership);
  }
  return membership;
}
