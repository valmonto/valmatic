import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis, type RedisOptions } from 'ioredis';
import { configWithFallback } from '../../config/index.js';

export const IAM_REDIS = Symbol('IAM_REDIS');

@Global()
@Module({
  providers: [
    {
      provide: IAM_REDIS,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Sessions use the shared Redis (REDIS_*) unless IAM_REDIS_* points at a
        // dedicated one. A platform deploy (Specbook) wires only REDIS_*, so
        // no extra setting is needed there.
        const options: RedisOptions = {
          host: configWithFallback(configService, 'IAM_REDIS_HOST', 'REDIS_HOST', 'localhost'),
          port: Number(configWithFallback(configService, 'IAM_REDIS_PORT', 'REDIS_PORT', 6379)),
          password: configWithFallback<string>(
            configService,
            'IAM_REDIS_PASSWORD',
            'REDIS_PASSWORD',
          ),
        };

        return new Redis(options);
      },
    },
  ],
  exports: [IAM_REDIS],
})
export class IamRedisModule {}
