/**
 * Public surface of the users feature. Other layers import from here
 * (`@/features/users`) and never reach into internal files directly —
 * the ESLint boundaries rule enforces this.
 */
export { userRoutes } from './routes';
export { userResource } from './api';
export { useUsers, useUser, useCreateUser, useUpdateUser, useDeleteUser } from './hooks/use-users';
