/**
 * The app's knowledge injected into the domain-blind attachments module:
 * one resolver per subject type answering "does this subject exist in this
 * org". The keys of this map ARE the set of valid subject types — an
 * unregistered type 400s, a false resolver 404s.
 */
export type SubjectResolver = (subjectId: string, orgId: string) => Promise<boolean>;

export type SubjectResolvers = Record<string, SubjectResolver>;

export const ATTACHMENT_SUBJECT_RESOLVERS = Symbol('ATTACHMENT_SUBJECT_RESOLVERS');
