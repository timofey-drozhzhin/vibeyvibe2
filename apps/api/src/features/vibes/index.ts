// Vibes feature — public API
//
// All vibes-related functionality is accessed through this barrel export.
// The schema config lives in vibes-schema.json (pure config, editable independently).

// Schema data + types + helpers
export {
  vibesSchema,
  VIBES_SCHEMA_VERSION,
  getActiveSchema,
  getSchemaNodeCount,
  getSchemaNodes,
  type SchemaNode,
} from "./schema.js";

// Prompt serializer
export { schemaToPrompt } from "./schema-to-prompt.js";

// Validation
export {
  validateProfileResponse,
  resetValidator,
  type ValidationResult,
} from "./validator.js";

// Profile v1/v2 compatibility
export {
  getProfileVersion,
  flattenProfile,
  stampVersion,
  type FlatVibeEntry,
} from "./profile-compat.js";
