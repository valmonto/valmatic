import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import type {
  AcceptInvitationAsMemberRequest,
  AcceptInvitationRequest,
  CreateInvitationRequest,
  ListInvitationsResponse,
  PreviewInvitationRequest,
  RevokeInvitationRequest,
} from '@pkg/contracts';
import { useAuth } from '@/shared/auth/auth-context';
import { AUTH_ME_KEY } from '@/shared/auth/auth-context';
import { useCachedRequest } from '@/shared/hooks/use-cached-request';
import { useActionRequest } from '@/shared/hooks/use-action-request';
import { invitationsApi } from '../api';

/**
 * Pending invitations are per-tenant, so the key is org-scoped (`org:${orgId}/...`)
 * — switching orgs re-keys automatically, matching the notifications convention.
 * Only fetched for a user who can actually invite; others get `null` (SWR skips).
 */
function invitationsKey(orgId: string): string {
  return `org:${orgId}/invitations`;
}

/**
 * The pending-invite list for the active org. Gated on the `org:invite`
 * permission: a member without it never issues the request (key is null).
 */
export function useInvitations() {
  const { user } = useAuth();
  const canInvite = Boolean(user?.permissions.includes('org:invite'));
  const key = user && canInvite ? invitationsKey(user.orgId) : null;

  const query = useCachedRequest<ListInvitationsResponse>({
    key,
    fetcher: () => invitationsApi.list({}),
  });

  return { ...query, canInvite };
}

function useInvalidateInvitations() {
  const { mutate } = useSWRConfig();
  const { user } = useAuth();
  return useCallback(() => {
    if (user) return mutate(invitationsKey(user.orgId));
  }, [mutate, user]);
}

export function useCreateInvitation() {
  const invalidate = useInvalidateInvitations();
  const req = useActionRequest((dto: CreateInvitationRequest) => invitationsApi.create(dto));
  const execute = async (dto: CreateInvitationRequest) => {
    const res = await req.execute(dto);
    if (!res.e) await invalidate();
    return res;
  };
  return { ...req, execute };
}

export function useRevokeInvitation() {
  const invalidate = useInvalidateInvitations();
  const req = useActionRequest((dto: RevokeInvitationRequest) => invitationsApi.revoke(dto));
  const execute = async (dto: RevokeInvitationRequest) => {
    const res = await req.execute(dto);
    if (!res.e) await invalidate();
    return res;
  };
  return { ...req, execute };
}

/** Unauthenticated preview by token — used by the public accept page. */
export function usePreviewInvitation() {
  return useActionRequest((dto: PreviewInvitationRequest) => invitationsApi.preview(dto));
}

/**
 * New-invitee accept (set password → account + membership → auto-login). On
 * success the session cookie is set, so revalidating `me` flips `isAuthenticated`.
 */
export function useAcceptInvitation() {
  const { mutate } = useSWRConfig();
  const req = useActionRequest((dto: AcceptInvitationRequest) => invitationsApi.accept(dto));
  const execute = async (dto: AcceptInvitationRequest) => {
    const res = await req.execute(dto);
    if (!res.e) await mutate(AUTH_ME_KEY);
    return res;
  };
  return { ...req, execute };
}

/**
 * Existing-account accept (authenticated). The new membership changes what the
 * org list contains, so reset every cache — same as switching orgs.
 */
export function useAcceptAsMember() {
  const { mutate } = useSWRConfig();
  const req = useActionRequest((dto: AcceptInvitationAsMemberRequest) =>
    invitationsApi.acceptExisting(dto),
  );
  const execute = async (dto: AcceptInvitationAsMemberRequest) => {
    const res = await req.execute(dto);
    if (!res.e) await mutate(() => true, undefined, { revalidate: true });
    return res;
  };
  return { ...req, execute };
}
