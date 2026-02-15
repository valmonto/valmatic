import { Controller, Get } from '@nestjs/common';
import { PublicRoute } from '../iam';

interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
}

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  @PublicRoute()
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}
