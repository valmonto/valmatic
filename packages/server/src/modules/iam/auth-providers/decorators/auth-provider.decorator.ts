import { Inject } from '@nestjs/common';
import { AUTH_PROVIDER } from '../auth-provider';

export const AuthProvider = () => Inject(AUTH_PROVIDER);
