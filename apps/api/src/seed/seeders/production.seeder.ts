import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger, PinoLogger } from '@pkg/server';
import { DATABASE_CLIENT, type DatabaseClient } from '@pkg/database';
import type { Seeder } from '../seeder.interface';
import { findOrCreateOrg, upsertMembership, upsertUser } from '../seed.helpers';

/** Dev-only fallbacks. In production these env vars are required (see env.schema). */
const DEV_DEFAULT_EMAIL = 'owner@valmonto.com';
const DEV_DEFAULT_PASSWORD = 'ChangeMe123!';

export interface InitialSeed {
  email: string;
  password: string;
  name: string;
  orgName: string;
}

/**
 * Production seeder: the minimum needed for an initial login.
 *
 * Creates one owner user (org `OWNER` + system `ADMIN`) and one organization,
 * everything driven by `SEED_INITIAL_*` env vars. Fully idempotent.
 */
@Injectable()
export class ProductionSeeder implements Seeder {
  readonly name = 'production';

  constructor(
    @Inject(DATABASE_CLIENT) private readonly dbClient: DatabaseClient,
    private readonly config: ConfigService,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {}

  /** Resolve the initial-login config, applying dev fallbacks when unset. */
  resolveInitialSeed(): InitialSeed {
    return {
      email: this.config.get<string>('SEED_INITIAL_EMAIL') ?? DEV_DEFAULT_EMAIL,
      password: this.config.get<string>('SEED_INITIAL_PASSWORD') ?? DEV_DEFAULT_PASSWORD,
      name: this.config.get<string>('SEED_INITIAL_NAME', 'Initial Owner'),
      orgName: this.config.get<string>('SEED_INITIAL_ORG_NAME', 'Valmonto'),
    };
  }

  async run(): Promise<void> {
    const { db } = this.dbClient;
    const initial = this.resolveInitialSeed();

    const owner = await upsertUser(db, {
      email: initial.email,
      name: initial.name,
      password: initial.password,
      systemRole: 'ADMIN',
    });
    if (!owner) throw new Error('Failed to upsert initial owner user');

    const org = await findOrCreateOrg(db, initial.orgName, owner.id);
    if (!org) throw new Error('Failed to find or create initial organization');

    await upsertMembership(db, org.id, owner.id, 'OWNER');

    this.logger.info(
      { email: owner.email, org: org.name },
      'Seeded initial owner and organization',
    );
  }
}
