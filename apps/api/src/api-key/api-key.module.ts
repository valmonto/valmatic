import { Module } from '@nestjs/common';
import { AdminApiKeyController } from './admin-api-key.controller.js';
import { ApiKeyRepository } from './api-key.repository.js';
import { ApiKeyService } from './api-key.service.js';

@Module({
  controllers: [AdminApiKeyController],
  providers: [ApiKeyService, ApiKeyRepository],
  exports: [ApiKeyService],
})
export class ApiKeyModule {}
