// Loads the vibes JSON Schema and provides helper functions for querying it.
// The schema data lives in vibes.schema.json (pure config, editable independently).

import vibesSchema from "../../../vibes.schema.json";

export { vibesSchema };

// ---------------------------------------------------------------------------
// Schema Version
// ---------------------------------------------------------------------------

export const VIBES_SCHEMA_VERSION = 2;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SchemaNode {
  /** Dot-separated path, e.g. "genre.genre" or "vocals.cast[].timbre" */
  path: string;
  title: string;
  description?: string;
  type: string;
  /** Top-level parent key */
  category: string;
  /** Top-level parent title */
  categoryTitle: string;
  archived: boolean;
}

// ---------------------------------------------------------------------------
// Helper: Remove x-archived nodes from a schema (deep clone)
// ---------------------------------------------------------------------------

export function getActiveSchema(schema: any): any {
  if (schema == null || typeof schema !== "object") return schema;

  // If this node is archived, skip it entirely
  if (schema["x-archived"] === true) return null;

  const clone: any = Array.isArray(schema) ? [] : {};

  for (const key of Object.keys(schema)) {
    if (key === "properties" && typeof schema.properties === "object") {
      const activeProps: any = {};
      for (const [propKey, propVal] of Object.entries(schema.properties)) {
        const filtered = getActiveSchema(propVal);
        if (filtered !== null) {
          activeProps[propKey] = filtered;
        }
      }
      clone.properties = activeProps;
    } else if (key === "items") {
      clone.items = getActiveSchema(schema.items);
    } else {
      clone[key] = schema[key];
    }
  }

  return clone;
}

// ---------------------------------------------------------------------------
// Helper: Count leaf (string / string-array) nodes
// ---------------------------------------------------------------------------

export function getSchemaNodeCount(schema: any): number {
  if (schema == null || typeof schema !== "object") return 0;

  if (schema.type === "string") return 1;

  if (schema.type === "array") {
    if (schema.items?.type === "string") return 1;
    if (schema.items?.type === "object" && schema.items?.properties) {
      let count = 0;
      for (const prop of Object.values(schema.items.properties)) {
        count += getSchemaNodeCount(prop);
      }
      return count;
    }
    return 0;
  }

  if (schema.type === "object" && schema.properties) {
    let count = 0;
    for (const prop of Object.values(schema.properties)) {
      count += getSchemaNodeCount(prop);
    }
    return count;
  }

  return 0;
}

// ---------------------------------------------------------------------------
// Helper: Flatten schema tree to a list of leaf nodes with paths
// ---------------------------------------------------------------------------

export function getSchemaNodes(schema: any): SchemaNode[] {
  const nodes: SchemaNode[] = [];

  function walk(
    node: any,
    path: string,
    category: string,
    categoryTitle: string,
  ) {
    if (node == null || typeof node !== "object") return;

    const archived = node["x-archived"] === true;

    if (node.type === "string") {
      nodes.push({
        path,
        title: node.title ?? path.split(".").pop() ?? path,
        description: node.description,
        type: "string",
        category,
        categoryTitle,
        archived,
      });
      return;
    }

    if (node.type === "array") {
      if (node.items?.type === "string") {
        nodes.push({
          path: path + "[]",
          title: node.title ?? path.split(".").pop() ?? path,
          description: node.description,
          type: "string[]",
          category,
          categoryTitle,
          archived,
        });
        return;
      }
      if (node.items?.type === "object" && node.items.properties) {
        for (const [key, prop] of Object.entries(node.items.properties)) {
          walk(prop, `${path}[].${key}`, category, categoryTitle);
        }
      }
      return;
    }

    if (node.type === "object" && node.properties) {
      for (const [key, prop] of Object.entries(node.properties)) {
        // Top-level properties define categories
        const cat = path === "" ? key : category;
        const catTitle = path === "" ? ((prop as any).title ?? key) : categoryTitle;
        const childPath = path === "" ? key : `${path}.${key}`;
        walk(prop, childPath, cat, catTitle);
      }
    }
  }

  walk(schema, "", "", "");
  return nodes;
}
