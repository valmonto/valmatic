import { Inject } from '@nestjs/common';
import { AUTH_PROVIDER } from '../auth-provider.js';

export const AuthProvider = (): ReturnType<typeof Inject> => Inject(AUTH_PROVIDER);
