import type {
  AcceptInvitationAsMemberRequest,
  AcceptInvitationAsMemberResponse,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  CreateInvitationRequest,
  CreateInvitationResponse,
  ListInvitationsRequest,
  ListInvitationsResponse,
  PreviewInvitationRequest,
  PreviewInvitationResponse,
  RevokeInvitationRequest,
  RevokeInvitationResponse,
} from '@pkg/contracts';
import { http, type HttpClient } from '@/shared/api/http';

/**
 * Factory kept exported so the global `api` aggregator can compose it.
 * Prefer the feature-local hooks (`hooks/use-invitations.ts`) over reaching here.
 *
 * `preview` and `accept` are the public, token-gated paths — the recipient may
 * have no account and no session yet. `create`/`list`/`revoke` are org-scoped
 * and need the `org:invite` permission; `acceptExisting` needs any session.
 */
export const invitationsResource = (client: HttpClient) => ({
  create: (dto: CreateInvitationRequest): Promise<CreateInvitationResponse> =>
    client.post('/api/invitations', dto),

  list: (_dto: ListInvitationsRequest): Promise<ListInvitationsResponse> =>
    client.get('/api/invitations'),

  revoke: (dto: RevokeInvitationRequest): Promise<RevokeInvitationResponse> =>
    client.delete(`/api/invitations/${dto.id}`),

  preview: (dto: PreviewInvitationRequest): Promise<PreviewInvitationResponse> =>
    client.post('/api/invitations/preview', dto),

  accept: (dto: AcceptInvitationRequest): Promise<AcceptInvitationResponse> =>
    client.post('/api/invitations/accept', dto),

  acceptExisting: (
    dto: AcceptInvitationAsMemberRequest,
  ): Promise<AcceptInvitationAsMemberResponse> =>
    client.post('/api/invitations/accept-existing', dto),
});

/** Bound instance the feature uses internally. */
export const invitationsApi = invitationsResource(http);
