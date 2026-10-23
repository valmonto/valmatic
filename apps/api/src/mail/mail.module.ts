import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service.js';

/** Sending email. Global, like the other outward-facing services. */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
