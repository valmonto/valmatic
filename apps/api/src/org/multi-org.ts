/**
 * Present (as `true`) when the project keeps the `organizations` add-on: an
 * account may then belong to many organizations, and each sign-up founds its
 * own. Absent, the project has one organization that every account joins.
 *
 *   constructor(@Optional() @Inject(MULTI_ORG) private readonly multiOrg?: boolean) {}
 *
 * Core reads only this token; the add-on provides it (docs/addons.md).
 */
export const MULTI_ORG = Symbol('MULTI_ORG');
