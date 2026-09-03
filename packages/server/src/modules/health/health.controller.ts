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
   *
   * Build identity (`sha`, `shortSha`, `builtAt`) IS in the public body, on
   * purpose. The thin-body rule keeps *weakness* out of an unauthenticated
   * response — "postgres is down" tells an attacker where to push. A commit
   * SHA tells them which code runs, which any client can already infer from
   * bundle hashes, and for an open-source descendant is public history anyway.
   * Against that, the whole point of the field is to be readable when
   * everything else is broken: the deploy that claimed success and shipped
   * nothing was only diagnosable by probing the running service, and a probe
   * that needs a working login or a minted API key is not one you can trust in
   * that moment. `scripts/deployment-status.mjs` and the container healthcheck
   * both read this route credential-free for the same reason.
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
