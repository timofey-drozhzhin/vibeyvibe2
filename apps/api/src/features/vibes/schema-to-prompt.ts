// Converts a vibes JSON Schema into compact BAML-style type-definition text
// suitable for embedding in an AI prompt. Skips x-archived nodes.
//
// Output format:
//   genre {
//     genre: string  // Start with a general genre... Example: "Bubblegum Pop, Trap Metal"
//     era_influence: string  // What era...? Example: "late 80s synth-pop"
//   }
//   vocals {
//     cast[] {
//       role: string  // Identify role... Example: "lead on verses"
//     }
//   }

/**
 * Serialize a vibes JSON Schema into compact type-definition prompt text.
 * Skips nodes with x-archived: true.
 */
export function schemaToPrompt(schema: any): string {
  if (schema?.type !== "object" || !schema.properties) return "";
  return serializeProperties(schema.properties, 0);
}

function serializeProperties(properties: Record<string, any>, indent: number): string {
  const lines: string[] = [];
  const pad = "  ".repeat(indent);

  for (const [key, prop] of Object.entries(properties)) {
    if (prop == null || prop["x-archived"] === true) continue;

    if (prop.type === "string") {
      lines.push(`${pad}${key}: string${buildComment(prop)}`);
    } else if (prop.type === "array") {
      if (prop.items?.type === "string") {
        lines.push(`${pad}${key}: string[]${buildComment(prop)}`);
      } else if (prop.items?.type === "object" && prop.items.properties) {
        const desc = buildBlockComment(prop);
        if (desc) lines.push(`${pad}// ${desc}`);
        lines.push(`${pad}${key}[] {`);
        lines.push(serializeProperties(prop.items.properties, indent + 1));
        lines.push(`${pad}}`);
      }
    } else if (prop.type === "object" && prop.properties) {
      const desc = buildBlockComment(prop);
      if (desc) lines.push(`${pad}// ${desc}`);
      lines.push(`${pad}${key} {`);
      lines.push(serializeProperties(prop.properties, indent + 1));
      lines.push(`${pad}}`);
    }
  }

  return lines.join("\n");
}

function buildBlockComment(node: any): string {
  const instruction = node["x-instruction"];
  if (instruction) return instruction;
  if (node.description) return node.description;
  return "";
}

function buildComment(node: any): string {
  const parts: string[] = [];

  const instruction = node["x-instruction"];
  if (instruction) parts.push(instruction);

  const example = node["x-example"];
  if (example) parts.push(`Example: "${example}"`);

  if (parts.length === 0) {
    // Fall back to description if no instruction
    if (node.description) return `  // ${node.description}`;
    return "";
  }

  return `  // ${parts.join(". ")}`;
}
