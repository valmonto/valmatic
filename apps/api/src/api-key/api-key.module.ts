import { Module } from '@nestjs/common';
import { AdminApiKeyController } from './admin-api-key.controller';
import { ApiKeyRepository } from './api-key.repository';
import { ApiKeyService } from './api-key.service';

@Module({
  controllers: [AdminApiKeyController],
  providers: [ApiKeyService, ApiKeyRepository],
  exports: [ApiKeyService],
})
export class ApiKeyModule {}
