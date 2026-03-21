// Validates AI profile responses against the vibes JSON Schema using ajv.
// Strips x-* extension properties before compiling the schema for validation.

import Ajv from "ajv";
import { vibesSchema, getActiveSchema } from "./schema.js";

// ---------------------------------------------------------------------------
// Strip custom x-* extensions (ajv doesn't understand them)
// ---------------------------------------------------------------------------

function stripExtensions(schema: any): any {
  if (schema == null || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) return schema.map(stripExtensions);

  const result: any = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key.startsWith("x-")) continue;
    if (key === "properties" && typeof value === "object" && value !== null) {
      const props: any = {};
      for (const [propKey, propVal] of Object.entries(value)) {
        props[propKey] = stripExtensions(propVal);
      }
      result.properties = props;
    } else if (key === "items") {
      result.items = stripExtensions(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Cached ajv validator
// ---------------------------------------------------------------------------

let cachedValidator: ReturnType<Ajv["compile"]> | null = null;

function getValidator() {
  if (!cachedValidator) {
    const ajv = new Ajv({
      allErrors: true,
      removeAdditional: true,
      coerceTypes: true,
    });
    const activeSchema = getActiveSchema(vibesSchema);
    const cleanSchema = stripExtensions(activeSchema);
    cachedValidator = ajv.compile(cleanSchema);
  }
  return cachedValidator;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  cleaned?: any;
}

/**
 * Validate an AI response object against the active vibes schema.
 * Returns the cleaned data (with extra properties removed) on success.
 */
export function validateProfileResponse(data: unknown): ValidationResult {
  const validate = getValidator();
  // Clone data since ajv mutates when removeAdditional is on
  const clone = JSON.parse(JSON.stringify(data));
  const valid = validate(clone);

  if (!valid) {
    return {
      valid: false,
      errors: validate.errors?.map(
        (e) => `${e.instancePath || "/"} ${e.message}`,
      ),
    };
  }

  return { valid: true, cleaned: clone };
}

/**
 * Reset the cached validator (call if the schema changes at runtime — mainly for tests).
 */
export function resetValidator(): void {
  cachedValidator = null;
}
