import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { Env } from '../config';
import { SeedService } from './seed.service';

/**
 * Opt-in auto-seeding on application startup.
 *
 * When `SEED_ON_STARTUP=true`, runs the environment-appropriate seeder as the
 * Nest app finishes booting. Intended for development/staging containers so a
 * fresh database is immediately usable. Off by default — production should seed
 * explicitly via the `seed` CLI.
 */
@Injectable()
export class SeedBootstrapService implements OnApplicationBootstrap {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly seedService: SeedService,
    @InjectPinoLogger(SeedBootstrapService.name) private readonly logger: PinoLogger,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.config.get('SEED_ON_STARTUP', { infer: true })) return;

    this.logger.info('SEED_ON_STARTUP enabled — running seeder on startup');
    await this.seedService.run();
  }
}
