import { Global, Module } from '@nestjs/common';
import { IamService } from './iam.service';
import { AuthProviderModule } from './auth-providers/auth.provider.module';
import { IamRedisModule } from './iam.redis';

@Global()
@Module({
  imports: [IamRedisModule, AuthProviderModule],
  controllers: [],
  providers: [IamService],
  exports: [],
})
export class IamModule {}
