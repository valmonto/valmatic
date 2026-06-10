import { NestFactory } from '@nestjs/core';
import { Logger, withFrameworkLogFilter } from '@pkg/server';
import { SeedCliModule } from './seed-cli.module';
import { SeedService } from './seed.service';

/**
 * Standalone seed entrypoint. Boots a minimal Nest application context,
 * runs the environment-appropriate seeder, then exits.
 *
 * Usage:
 *   node dist/seed/seed.cli            # picks strategy from NODE_ENV
 *   SEED_STRATEGY=production node ...   # force a strategy
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(SeedCliModule, { bufferLogs: true });
  app.useLogger(withFrameworkLogFilter(app.get(Logger)));
  app.enableShutdownHooks();

  try {
    await app.get(SeedService).run();
  } finally {
    await app.close();
  }
}

bootstrap()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
