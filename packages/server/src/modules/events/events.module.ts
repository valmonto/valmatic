import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Use wildcard listeners (e.g., 'user.*' matches 'user.created', 'user.updated')
      wildcard: true,
      // Delimiter for namespaced events
      delimiter: '.',
      // Show warning if a listener throws but doesn't stop other listeners
      ignoreErrors: false,
    }),
  ],
})
export class EventsModule {}
