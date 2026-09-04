import { Module } from '@nestjs/common';
import { OrgController } from './org.controller.js';
import { AdminOrgController } from './admin-org.controller.js';
import { OrgService } from './org.service.js';
import { OrgRepository } from './org.repository.js';
import { IamService } from '@pkg/server';

@Module({
  controllers: [OrgController, AdminOrgController],
  providers: [OrgService, OrgRepository, IamService],
  exports: [OrgService],
})
export class OrgModule {}
