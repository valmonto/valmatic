import { Module } from '@nestjs/common';
import { OrgController } from './org.controller';
import { OrgService } from './org.service';
import { OrgRepository } from './org.repository';
import { IamService } from '@pkg/server';

@Module({
  controllers: [OrgController],
  providers: [OrgService, OrgRepository, IamService],
  exports: [OrgService],
})
export class OrgModule {}
