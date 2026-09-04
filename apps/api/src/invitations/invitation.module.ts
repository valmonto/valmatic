import { Module } from '@nestjs/common';
import { IamService } from '@pkg/server';
import { UserModule } from '../user/user.module.js';
import { NotificationModule } from '../notifications/index.js';
import { InvitationController } from './invitation.controller.js';
import { InvitationRepository } from './invitation.repository.js';
import { InvitationService } from './invitation.service.js';

@Module({
  imports: [UserModule, NotificationModule],
  controllers: [InvitationController],
  providers: [InvitationService, InvitationRepository, IamService],
  exports: [InvitationService],
})
export class InvitationModule {}
