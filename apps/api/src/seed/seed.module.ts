import { Module, type DynamicModule } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedBootstrapService } from './seed.bootstrap';
import { ProductionSeeder } from './seeders/production.seeder';
import { DevelopmentSeeder } from './seeders/development.seeder';

/**
 * Core seeding module. Provides the seeder services and relies on the globally
 * registered `ConfigModule`, `DatabaseModule` and `LoggerModule`.
 *
 * - Import `SeedModule` directly when infra is already set up (e.g. the CLI).
 * - Import `SeedModule.forApp()` in the HTTP app to additionally enable the
 *   opt-in `SEED_ON_STARTUP` auto-seed hook.
 */
@Module({
  providers: [SeedService, ProductionSeeder, DevelopmentSeeder],
  exports: [SeedService],
})
export class SeedModule {
  /** App variant: adds the auto-seed-on-startup bootstrap hook. */
  static forApp(): DynamicModule {
    return {
      module: SeedModule,
      providers: [SeedBootstrapService],
    };
  }
}
