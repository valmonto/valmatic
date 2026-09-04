import { Injectable } from '@nestjs/common';
import { AuthProvider } from './auth-providers/decorators/auth-provider.decorator.js';
import { type IAuthProvider } from './auth-providers/auth-provider.js';

@Injectable()
export class IamService {
  constructor(@AuthProvider() public readonly auth: IAuthProvider) {}
}
