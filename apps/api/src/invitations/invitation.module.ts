import { Module } from '@nestjs/common';
import { IamService } from '@pkg/server';
import { UserModule } from '../user/user.module';
import { NotificationModule } from '../notifications';
import { InvitationController } from './invitation.controller';
import { InvitationRepository } from './invitation.repository';
import { InvitationService } from './invitation.service';

@Module({
  imports: [UserModule, NotificationModule],
  controllers: [InvitationController],
  providers: [InvitationService, InvitationRepository, IamService],
  exports: [InvitationService],
})
export class InvitationModule {}
