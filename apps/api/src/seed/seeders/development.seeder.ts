import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { z } from 'zod';
import { DATABASE_CLIENT, eq, user, type DatabaseClient } from '@pkg/database';
import { SystemRoleSchema, OrganizationUserRoleSchema } from '@pkg/contracts';
import type { Seeder } from '../seeder.interface';
import { findOrCreateOrg, upsertMembership, upsertUser } from '../seed.helpers';
import { ProductionSeeder } from './production.seeder';
import usersFixture from '../data/users.json';

const FixtureUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  /** Optional per-user password; falls back to the shared dev password. */
  password: z.string().min(8).optional(),
  systemRole: SystemRoleSchema.default('USER'),
  orgRole: OrganizationUserRoleSchema.default('MEMBER'),
});

const FixtureSchema = z.array(FixtureUserSchema);

/**
 * Development seeder: the production initial-login data, plus a set of demo
 * users loaded from `data/users.json`. Edit the JSON to change the dataset —
 * no code changes required. Idempotent.
 */
@Injectable()
export class DevelopmentSeeder implements Seeder {
  readonly name = 'development';

  constructor(
    @Inject(DATABASE_CLIENT) private readonly dbClient: DatabaseClient,
    private readonly productionSeeder: ProductionSeeder,
    @InjectPinoLogger(DevelopmentSeeder.name) private readonly logger: PinoLogger,
  ) {}

  async run(): Promise<void> {
    // Establish the initial owner + organization first.
    await this.productionSeeder.run();

    const { db } = this.dbClient;
    const {
      email: ownerEmail,
      password: sharedPassword,
      orgName,
    } = this.productionSeeder.resolveInitialSeed();

    const fixtures = FixtureSchema.parse(usersFixture);

    const [owner] = await db.select().from(user).where(eq(user.email, ownerEmail)).limit(1);
    if (!owner) throw new Error('Cannot seed demo users: initial owner is missing');

    // The org we attach demo users to is the seeded initial org.
    const org = await findOrCreateOrg(db, orgName, owner.id);
    if (!org) throw new Error('Cannot seed demo users: initial organization is missing');

    for (const fixture of fixtures) {
      const demoUser = await upsertUser(db, {
        email: fixture.email,
        name: fixture.name,
        password: fixture.password ?? sharedPassword,
        systemRole: fixture.systemRole,
      });
      if (!demoUser) {
        this.logger.error({ email: fixture.email }, 'Failed to upsert demo user');
        continue;
      }
      await upsertMembership(db, org.id, demoUser.id, fixture.orgRole);
    }

    this.logger.info({ count: fixtures.length }, 'Seeded demo users from fixtures');
  }
}
