import { Module } from '@nestjs/common';
import { QueuesModule as SharedQueuesModule } from '@pkg/server';
import { ExampleProcessor } from './example/example.processor';
import { ExampleListener } from './example/example.listener';
import { NotificationRepository } from './example/notification.repository';

/**
 * Worker queues module.
 * Imports shared queue configuration and registers processors.
 *
 * Add new processors here as you create them.
 */
@Module({
  imports: [SharedQueuesModule],
  providers: [
    // Register all processors
    ExampleProcessor,
    // Register event listeners
    ExampleListener,
    // Repositories
    NotificationRepository,
  ],
})
export class WorkerQueuesModule {}
