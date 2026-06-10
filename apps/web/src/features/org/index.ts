/**
 * Public surface of the org feature. Other layers import from here
 * (`@/features/org`) and never reach into internal files directly.
 *
 * Note: org has no route of its own — the switcher lives in the app layout.
 */
export { orgResource } from './api';
export { OrgSwitcher } from './components/org-switcher';
export { useOrgs, useSwitchOrg, useCreateOrg, useDeleteOrg } from './hooks/use-orgs';
