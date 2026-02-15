import { Module } from '@nestjs/common';
import { QueuesModule } from '@pkg/server';
import { JobsController } from './jobs.controller';

/**
 * Jobs module for API.
 * Provides endpoints to enqueue background jobs.
 */
@Module({
  imports: [QueuesModule],
  controllers: [JobsController],
})
export class JobsModule {}
