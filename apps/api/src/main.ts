import { ConfigService } from '@nestjs/config';
import { Logger } from '@pkg/server';

import { createApp } from './app.factory.js';

async function bootstrap(): Promise<void> {
  const app = await createApp();

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  app.get(Logger).log(`API server listening on port ${port}`);
}

void bootstrap();
