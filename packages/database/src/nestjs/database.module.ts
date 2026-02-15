import { Module, Global, type DynamicModule } from '@nestjs/common';
import { createDatabaseClient, type DatabaseConfig } from '../client';

export const DATABASE_CLIENT = 'DATABASE_CLIENT';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DatabaseModuleOptions extends DatabaseConfig {}

@Global()
@Module({})
export class DatabaseModule {
  /**
   * Register the database module with static configuration.
   * The client will automatically close connections on NestJS shutdown.
   */
  static forRoot(options: DatabaseModuleOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: DATABASE_CLIENT,
          useFactory: () => createDatabaseClient(options),
        },
      ],
      exports: [DATABASE_CLIENT],
    };
  }

  /**
   * Register the database module with async configuration.
   * Useful for loading config from ConfigService.
   * The client will automatically close connections on NestJS shutdown.
   */
  static forRootAsync(options: {
    imports?: any[];
    inject?: any[];
    useFactory: (...args: any[]) => DatabaseModuleOptions | Promise<DatabaseModuleOptions>;
  }): DynamicModule {
    return {
      module: DatabaseModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: DATABASE_CLIENT,
          useFactory: async (...args: any[]) => {
            const config = await options.useFactory(...args);
            return createDatabaseClient(config);
          },
          inject: options.inject ?? [],
        },
      ],
      exports: [DATABASE_CLIENT],
    };
  }
}
