Read ./README.md before changing this workspace.

- Controllers do no work: @ZodRequest + @Permissions (or @SystemRoles), hand
  @ActiveUser and the DTO to the service. Rules in services, SQL in repositories.
- Identity comes from @ActiveUser — a request schema never carries userId/orgId.
- Param naming is load-bearing: :orgId = must equal the session org
  (ActiveOrgGuard enforces); :id = plain resource id. Pick deliberately.
- A new repository method takes orgId, joins on it, and gets a two-tenant
  integration test. The user module shipped a cross-tenant write without one.
- Declare static routes ('read-all', 'unread-count') before ':id' — Nest
  matches top-down.
- Errors throw k.* translation keys, never sentences.
- New endpoint = schema + permission in @pkg/contracts FIRST, then the route.
