import { Module, type DynamicModule } from '@nestjs/common';
import { StorageService } from './storage.service.js';
import { STORAGE_OPTIONS } from './storage.tokens.js';
import type { StorageModuleAsyncOptions, StorageModuleOptions } from './storage.types.js';

@Module({})
export class StorageModule {
  static forRoot(options: StorageModuleOptions): DynamicModule {
    return {
      module: StorageModule,
      // Infrastructure, like the database client: configured once at the app
      // root, injectable everywhere without every feature importing it.
      global: true,
      providers: [{ provide: STORAGE_OPTIONS, useValue: options }, StorageService],
      exports: [StorageService],
    };
  }

  static forRootAsync(options: StorageModuleAsyncOptions): DynamicModule {
    return {
      module: StorageModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: STORAGE_OPTIONS,
          useFactory: async (...args: unknown[]) => options.useFactory(...args),
          inject: options.inject ?? [],
        },
        StorageService,
      ],
      exports: [StorageService],
    };
  }
}
