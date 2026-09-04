import { Module } from '@nestjs/common';
import { QueuesModule as SharedQueuesModule } from '@pkg/server';
import { ExampleProcessor } from './example/example.processor.js';
import { ExampleListener } from './example/example.listener.js';
import { NotificationRepository } from './example/notification.repository.js';
import { AttachmentsSweepProcessor } from './attachments-sweep/attachments-sweep.processor.js';

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
    // Storage GC (docs/storage.md) — self-scheduling repeatable sweep
    AttachmentsSweepProcessor,
  ],
})
export class WorkerQueuesModule {}
