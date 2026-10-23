import { Module } from '@nestjs/common';
import { QueuesModule as SharedQueuesModule } from '@pkg/server';
import { ExampleProcessor } from './example/example.processor.js';
import { ExampleListener } from './example/example.listener.js';
import { NotificationRepository } from './example/notification.repository.js';

/**
 * The demo add-on's part of the worker: the example queue's processor, and a
 * listener that sends the user a notification when a job ends. The pattern
 * to copy for a real queue. A new project never keeps it (docs/addons.md).
 */
@Module({
  imports: [SharedQueuesModule],
  providers: [ExampleProcessor, ExampleListener, NotificationRepository],
})
export class DemoWorkerModule {}

export { DemoWorkerModule as addonModule };
