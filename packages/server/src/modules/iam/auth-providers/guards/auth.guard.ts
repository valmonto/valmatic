import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { LocalAuthGuard } from '../local/local-auth.guard';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private config: ConfigService,
    private reflector: Reflector,
    private local: LocalAuthGuard,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const provider = this.config.getOrThrow<string>('IAM_AUTH_PROVIDER');
    const guard = this.pickGuard(provider);
    return guard.canActivate(ctx);
  }

  private pickGuard(provider: string) {
    switch (provider) {
      case 'local':
        return this.local;
      default:
        throw new UnauthorizedException(`Unsupported provider ${provider}`);
    }
  }
}
