export const ORG_ACCESS = Symbol('ORG_ACCESS');

export interface IOrgAccessProvider {
  verifyAccess(opts: { userId: string; orgId: string }): Promise<{ role: string } | null>;
}
