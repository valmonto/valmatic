import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { type RedisOptions } from 'ioredis';

export const IAM_REDIS = Symbol('IAM_REDIS');

@Global()
@Module({
  providers: [
    {
      provide: IAM_REDIS,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const options: RedisOptions = {
          host: configService.get<string>('IAM_REDIS_HOST', 'localhost'),
          port: configService.get<number>('IAM_REDIS_PORT', 6379),
          password: configService.get<string>('IAM_REDIS_PASSWORD'),
        };

        return new Redis(options);
      },
    },
  ],
  exports: [IAM_REDIS],
})
export class IamRedisModule {}
