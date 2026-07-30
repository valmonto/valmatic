import { SkipThrottle } from '@nestjs/throttler';
import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { PublicRoute } from '../iam';
import { HealthService, type HealthReport } from './health.service';

@SkipThrottle() // orchestration probes must never be limited
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /**
   * Answers "can this instance serve traffic?" — 200 when its dependencies
   * respond, 503 when they do not, so `docker compose --wait`, load balancers
   * and uptime checks all read the same signal.
   *
   * The body stays deliberately thin: which dependency failed is in the logs,
   * not in an unauthenticated response.
   */
  @PublicRoute()
  @Get()
  @HttpCode(HttpStatus.OK)
  async check(@Res({ passthrough: true }) reply: FastifyReply): Promise<HealthReport> {
    const report = await this.health.check();

    if (report.status !== 'ok') {
      reply.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return report;
  }
}
