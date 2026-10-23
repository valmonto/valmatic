import { Module } from '@nestjs/common';
import { QueuesModule as SharedQueuesModule } from '@pkg/server';
import { AttachmentsSweepProcessor } from './attachments-sweep/attachments-sweep.processor.js';

/**
 * Worker queues module.
 * Imports shared queue configuration and registers processors.
 *
 * Add new processors here as you create them; the demo add-on's example
 * queue shows one end to end (src/addons/demo).
 */
@Module({
  imports: [SharedQueuesModule],
  providers: [
    // Storage GC (docs/storage.md) — self-scheduling repeatable sweep
    AttachmentsSweepProcessor,
  ],
})
export class WorkerQueuesModule {}
