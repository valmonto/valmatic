export * from './schemas/index.js';
export * from './permissions/index.js';
// Explicit rather than `export * from './constants/index.js'`: several constants are
// already re-exported through schema files, and colliding star exports drop
// names silently.
export {
  ANALYTICS_EVENTS,
  FEATURE_FLAGS,
  type AnalyticsEvent,
  type FeatureFlag,
} from './constants/analytics.js';
export { MCP_SCOPES, type McpScope } from './constants/mcp.js';
export {
  ATTACHMENT_KINDS,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_POLICIES,
  ATTACHMENT_STATUSES,
  attachmentKindAllowed,
  attachmentLimitFor,
  type AttachmentKindName,
  type AttachmentPolicy,
} from './constants/attachment.js';
