import { Global, Module } from '@nestjs/common';
import { IamService } from './iam.service.js';
import { AuthProviderModule } from './auth-providers/auth.provider.module.js';
import { IamRedisModule } from './iam.redis.js';

@Global()
@Module({
  imports: [IamRedisModule, AuthProviderModule],
  controllers: [],
  providers: [IamService],
  exports: [],
})
export class IamModule {}
