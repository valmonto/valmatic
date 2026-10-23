import { Module } from '@nestjs/common';
import { OrgController } from './org.controller.js';
import { OrgService } from './org.service.js';
import { OrgRepository } from './org.repository.js';

@Module({
  controllers: [OrgController],
  providers: [OrgService, OrgRepository],
  // OrgRepository: the `organizations` add-on builds on it.
  exports: [OrgService, OrgRepository],
})
export class OrgModule {}
