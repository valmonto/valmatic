/**
 * Attachment value sets — single source for the Zod schemas, the database
 * CHECK constraints, and client-side pre-upload validation. Zod-free: ships
 * in frontend bundles.
 *
 * Subject types are deliberately NOT enumerated here: the attachments module
 * is domain-blind, and the set of valid subjects is defined by the resolvers
 * the app registers (`AttachmentsModule.forRoot`) — one source of truth, no
 * constants list to drift against it.
 */
export const ATTACHMENT_KINDS = ['image', 'video', 'audio', 'file'] as const;

export const ATTACHMENT_STATUSES = ['pending', 'uploaded'] as const;

/**
 * Per-kind upload ceilings, enforced twice: client-side before uploading and
 * server-side at confirm time against the object's real HEAD size — the
 * declared size is a claim, the ceiling is the law.
 */
export const ATTACHMENT_MAX_BYTES: Readonly<Record<(typeof ATTACHMENT_KINDS)[number], number>> = {
  image: 10 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  audio: 25 * 1024 * 1024,
  file: 25 * 1024 * 1024,
};

export type AttachmentKindName = (typeof ATTACHMENT_KINDS)[number];

export interface AttachmentPolicy {
  /** Kinds this subject accepts. Absent kind → declare is rejected. */
  kinds: readonly AttachmentKindName[];
  /** Optional per-kind ceilings BELOW the platform caps — a policy can
   *  tighten ATTACHMENT_MAX_BYTES, never exceed it. */
  maxBytes?: Partial<Record<AttachmentKindName, number>>;
}

/**
 * Per-subject upload rules — the product layer above the platform caps.
 * Single source for the server (declare + confirm) and the client
 * (pre-upload validation), so the browser never starts an upload the
 * server would refuse.
 *
 * The template ships no subjects, so this map is empty; a subject WITHOUT a
 * policy accepts every kind at the platform caps. Add an entry to tighten,
 * e.g. `task: { kinds: ['image', 'file'], maxBytes: { image: 10 * 1024 * 1024 } }`.
 */
export const ATTACHMENT_POLICIES: Readonly<Record<string, AttachmentPolicy>> = {};

/** Effective ceiling: the policy may tighten the platform cap, never raise it. */
export const attachmentLimitFor = (subjectType: string, kind: AttachmentKindName): number => {
  const platform = ATTACHMENT_MAX_BYTES[kind];
  const policy = ATTACHMENT_POLICIES[subjectType]?.maxBytes?.[kind];
  return policy === undefined ? platform : Math.min(policy, platform);
};

/** No policy for the subject → every kind is welcome (platform caps apply). */
export const attachmentKindAllowed = (subjectType: string, kind: AttachmentKindName): boolean =>
  ATTACHMENT_POLICIES[subjectType]?.kinds.includes(kind) ?? true;
