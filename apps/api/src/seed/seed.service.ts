import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { Env } from '../config';
import type { Seeder } from './seeder.interface';
import { ProductionSeeder } from './seeders/production.seeder';
import { DevelopmentSeeder } from './seeders/development.seeder';

/**
 * Picks and runs the appropriate seeder for the current environment.
 *
 * - `production` → {@link ProductionSeeder} (initial login only)
 * - everything else (`development`, `test`) → {@link DevelopmentSeeder}
 *
 * Override the choice explicitly with `SEED_STRATEGY=production|development`.
 */
@Injectable()
export class SeedService {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly productionSeeder: ProductionSeeder,
    private readonly developmentSeeder: DevelopmentSeeder,
    @InjectPinoLogger(SeedService.name) private readonly logger: PinoLogger,
  ) {}

  private select(): Seeder {
    const override = process.env.SEED_STRATEGY;
    if (override === 'production') return this.productionSeeder;
    if (override === 'development') return this.developmentSeeder;

    const nodeEnv = this.config.get('NODE_ENV', { infer: true });
    return nodeEnv === 'production' ? this.productionSeeder : this.developmentSeeder;
  }

  async run(): Promise<void> {
    const seeder = this.select();
    this.logger.info({ seeder: seeder.name }, 'Running seeder');
    await seeder.run();
    this.logger.info({ seeder: seeder.name }, 'Seeding complete');
  }
}
