import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, like, and, or, desc as descFn, asc as ascFn, sql, getTableColumns, inArray } from "drizzle-orm";
import { getDb } from "../../db/index.js";
import { likes } from "../../db/schema/index.js";
import type { EntityRouteConfig, RelationshipRouteConfig, FkEnrichment } from "./types.js";

// ---------------------------------------------------------------------------
// Auto FK enrichment helpers
// ---------------------------------------------------------------------------

/** Batch-enrich FK columns for list responses. */
async function autoEnrichFkList(db: any, rows: any[], enrichments: FkEnrichment[]): Promise<any[]> {
  if (rows.length === 0) return rows;
  let result = rows;

  for (const fk of enrichments) {
    const fkIds = [...new Set(result.map((r: any) => r[fk.column]).filter(Boolean))];
    if (fkIds.length === 0) {
      const baseKey = fk.column.replace(/_id$/, "");
      result = result.map((r: any) => ({ ...r, [baseKey]: null }));
      continue;
    }

    const labelCol = fk.labelColumn ?? fk.targetTable.name;
    const targetRows = await db
      .select({ id: fk.targetTable.id, name: labelCol })
      .from(fk.targetTable)
      .where(
        sql`${fk.targetTable.id} IN (${sql.join(
          fkIds.map((id: number) => sql`${id}`),
          sql`, `
        )})`
      );

    const map: Record<number, { id: number; name: string }> = {};
    for (const row of targetRows) {
      map[row.id] = { id: row.id, name: row.name };
    }

    const baseKey = fk.column.replace(/_id$/, "");
    result = result.map((r: any) => ({
      ...r,
      [baseKey]: r[fk.column] ? map[r[fk.column]] || null : null,
    }));
  }

  return result;
}

/** Enrich FK columns for a single detail response. */
async function autoEnrichFkDetail(db: any, entity: any, enrichments: FkEnrichment[]): Promise<Record<string, any>> {
  const result: Record<string, any> = {};

  for (const fk of enrichments) {
    const baseKey = fk.column.replace(/_id$/, "");
    if (!entity[fk.column]) {
      result[baseKey] = null;
      continue;
    }

    const labelCol = fk.labelColumn ?? fk.targetTable.name;
    const target = await db
      .select({ id: fk.targetTable.id, name: labelCol })
      .from(fk.targetTable)
      .where(eq(fk.targetTable.id, entity[fk.column]))
      .get();

    result[baseKey] = target ? { id: target.id, name: target.name } : null;
  }

  return result;
}

function buildListQuerySchema(config: EntityRouteConfig) {
  const base: Record<string, z.ZodTypeAny> = {
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
    sort: z.string().optional(),
    order: z.enum(["asc", "desc"]).default(config.defaultOrder ?? "desc"),
    search: z.string().optional(),
    archived: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
    ...(config.enableLikes ? { liked: z.enum(["true", "false"]).transform((v) => v === "true").optional() } : {}),
  };
  if (config.extraFilters) {
    for (const f of config.extraFilters) {
      base[f.param] = f.schema;
    }
  }
  return z.object(base);
}

export function createEntityRoutes(config: EntityRouteConfig): Hono {
  const router = new Hono();
  const listSchema = buildListQuerySchema(config);

  const effectiveUpdateSchema = config.updateSchema ??
    (config.createSchema as z.ZodObject<any>).partial().extend({
      archived: z.boolean().optional(),
    });

  // Register extensions first (they get priority)
  if (config.extensions) {
    config.extensions(router);
  }

  // ---- GET / (List) ----
  router.get("/", zValidator("query", listSchema), async (c) => {
    const query = c.req.valid("query") as any;
    const { page, pageSize, sort, order, archived, search, liked: likedFilter } = query;
    const db = getDb();
    const user = c.get("user" as never) as { id: string } | null;
    const entityKey = `${config.context}/${config.slug}`;
    const offset = (page - 1) * pageSize;
    const conditions: any[] = [];

    // Auto context filter
    if (config.contextColumnValue && config.table.context) {
      conditions.push(eq(config.table.context, config.contextColumnValue));
    }

    // Archive filter
    if (archived !== undefined) {
      conditions.push(eq(config.table.archived, archived));
    }

    // Search
    if (search) {
      if (config.searchColumns === null) {
        // search disabled
      } else if (config.searchColumns && config.searchColumns.length > 0) {
        const searchConditions = config.searchColumns.map((col: any) => like(col, `%${search}%`));
        conditions.push(searchConditions.length === 1 ? searchConditions[0] : or(...searchConditions));
      } else if (config.table.name) {
        conditions.push(like(config.table.name, `%${search}%`));
      }
    }

    // Extra filters
    if (config.extraFilters) {
      for (const f of config.extraFilters) {
        const val = query[f.param];
        if (val !== undefined && val !== null && val !== "") {
          if (f.mode === "eq") {
            conditions.push(eq(f.column, val));
          } else if (f.mode === "starts_with") {
            conditions.push(like(f.column, `${val}%`));
          } else {
            conditions.push(like(f.column, `%${val}%`));
          }
        }
      }
    }

    // Liked filter (only when likes are enabled)
    if (config.enableLikes && likedFilter !== undefined && user) {
      const likedSubquery = likedFilter
        ? sql`${config.table.id} IN (SELECT ${likes.entity_id} FROM ${likes} WHERE ${likes.user_id} = ${user.id} AND ${likes.entity} = ${entityKey})`
        : sql`${config.table.id} NOT IN (SELECT ${likes.entity_id} FROM ${likes} WHERE ${likes.user_id} = ${user.id} AND ${likes.entity} = ${entityKey})`;
      conditions.push(likedSubquery);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const sortCol = sort && config.sortableColumns[sort] ? config.sortableColumns[sort] : config.defaultSort;
    const orderFn = order === "asc" ? ascFn(sortCol) : descFn(sortCol);

    const [data, countResult] = await Promise.all([
      db.select().from(config.table).where(whereClause).orderBy(orderFn).limit(pageSize).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(config.table).where(whereClause),
    ]);

    let enriched = config.fkEnrichments?.length
      ? await autoEnrichFkList(db, data, config.fkEnrichments)
      : data;
    if (config.listEnricher) {
      enriched = await config.listEnricher(db, enriched);
    }

    // Enrich with liked status (only when likes are enabled)
    if (config.enableLikes) {
      if (user && enriched.length > 0) {
        const ids = enriched.map((r: any) => r.id);
        const likedRows = await db
          .select({ entity_id: likes.entity_id })
          .from(likes)
          .where(
            and(
              eq(likes.user_id, user.id),
              eq(likes.entity, entityKey),
              inArray(likes.entity_id, ids),
            ),
          );
        const likedSet = new Set(likedRows.map((r) => r.entity_id));
        enriched = enriched.map((r: any) => ({ ...r, liked: likedSet.has(r.id) }));
      } else {
        enriched = enriched.map((r: any) => ({ ...r, liked: false }));
      }
    }

    return c.json({ data: enriched, total: countResult[0].count, page, pageSize });
  });

  // ---- POST / (Create) ----
  router.post("/", zValidator("json", config.createSchema), async (c) => {
    const body = c.req.valid("json") as any;
    const db = getDb();
    const now = new Date().toISOString();
    const values: any = { ...body, created_at: now, updated_at: now };
    if (config.contextColumnValue) {
      values.context = config.contextColumnValue;
    }
    const result = await db.insert(config.table).values(values).returning();
    const created = (result as any[])[0];
    return c.json(created, 201);
  });

  // ---- GET /:id ----
  router.get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);
    const db = getDb();

    const conditions = [eq(config.table.id, id)];
    if (config.contextColumnValue && config.table.context) {
      conditions.push(eq(config.table.context, config.contextColumnValue));
    }

    const entity = await db.select().from(config.table).where(and(...conditions)).get();
    if (!entity) return c.json({ error: `${config.entityName} not found` }, 404);

    let enrichments: Record<string, any> = {};
    if (config.fkEnrichments?.length) {
      enrichments = await autoEnrichFkDetail(db, entity, config.fkEnrichments);
    }
    if (config.detailEnricher) {
      const custom = await config.detailEnricher(db, entity);
      enrichments = { ...enrichments, ...custom };
    }

    // Auto-enrich associative relationships (those with payloadColumns)
    if (config.relationships) {
      for (const rel of config.relationships) {
        if (rel.payloadColumns && rel.payloadColumns.length > 0 && !enrichments[rel.slug]) {
          const relatedCols = getTableColumns(rel.relatedTable);
          const selectObj: any = { ...relatedCols };
          for (const pc of rel.payloadColumns) {
            selectObj[`_pivot_${pc.name}`] = pc.column;
          }

          const pivotRows = await db
            .select(selectObj)
            .from(rel.pivotTable)
            .innerJoin(rel.relatedTable, eq(rel.relatedFk, rel.relatedTable.id))
            .where(eq(rel.parentFk, entity.id));

          enrichments[rel.slug] = pivotRows.map((row: any) => {
            const result: any = {};
            for (const [k, v] of Object.entries(row)) {
              if (k.startsWith("_pivot_")) {
                result[k.slice(7)] = v;
              } else {
                result[k] = v;
              }
            }
            return result;
          });
        }
      }
    }

    // Enrich with liked status (only when likes are enabled)
    if (config.enableLikes) {
      const user = c.get("user" as never) as { id: string } | null;
      const entityKey = `${config.context}/${config.slug}`;
      let liked = false;
      if (user) {
        const likeRow = await db
          .select()
          .from(likes)
          .where(
            and(
              eq(likes.user_id, user.id),
              eq(likes.entity, entityKey),
              eq(likes.entity_id, id),
            ),
          )
          .get();
        liked = !!likeRow;
      }
      return c.json({ ...entity, ...enrichments, liked });
    }

    return c.json({ ...entity, ...enrichments });
  });

  // ---- PUT /:id ----
  router.put("/:id", zValidator("json", effectiveUpdateSchema), async (c) => {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);
    const body = c.req.valid("json") as any;
    const db = getDb();

    const conditions = [eq(config.table.id, id)];
    if (config.contextColumnValue && config.table.context) {
      conditions.push(eq(config.table.context, config.contextColumnValue));
    }

    const existing = await db.select().from(config.table).where(and(...conditions)).get();
    if (!existing) return c.json({ error: `${config.entityName} not found` }, 404);

    const updateConditions = [eq(config.table.id, id)];
    if (config.contextColumnValue && config.table.context) {
      updateConditions.push(eq(config.table.context, config.contextColumnValue));
    }

    const updateResult = await db
      .update(config.table)
      .set({ ...body, updated_at: new Date().toISOString() })
      .where(and(...updateConditions))
      .returning();
    const updated = (updateResult as any[])[0];

    return c.json(updated);
  });

  // ---- DELETE /:id (admin-only) ----
  if (config.allowDelete) {
    router.delete("/:id", async (c) => {
      const user = c.get("user" as never) as { role: string } | null;
      if (!user || user.role !== "admin") {
        return c.json({ error: "Forbidden" }, 403);
      }

      const id = Number(c.req.param("id"));
      if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);
      const db = getDb();

      const conditions = [eq(config.table.id, id)];
      if (config.contextColumnValue && config.table.context) {
        conditions.push(eq(config.table.context, config.contextColumnValue));
      }

      const existing = await db.select().from(config.table).where(and(...conditions)).get();
      if (!existing) return c.json({ error: `${config.entityName} not found` }, 404);
      if (!existing.archived) return c.json({ error: "Record must be archived before it can be deleted" }, 400);

      await db.transaction(async (tx) => {
        // Clean up pivot tables from relationships config
        if (config.relationships) {
          for (const rel of config.relationships) {
            await tx.delete(rel.pivotTable).where(eq(rel.parentFk, id));
          }
        }
        // Clean up 1:N cascade tables
        if (config.cascadeDeletes) {
          for (const cascade of config.cascadeDeletes) {
            await tx.delete(cascade.table).where(eq(cascade.fk, id));
          }
        }
        // Delete the record
        await tx.delete(config.table).where(eq(config.table.id, id));
      });

      return c.json({ message: "Deleted" });
    });
  }

  // ---- Relationship Routes ----
  if (config.relationships) {
    for (const rel of config.relationships) {
      registerRelationshipRoutes(router, config, rel);
    }
  }

  return router;
}

function registerRelationshipRoutes(router: Hono, config: EntityRouteConfig, rel: RelationshipRouteConfig) {
  // Build assign schema: relatedId field + optional payload fields
  const baseAssignSchema = z.object({ [rel.bodyField]: z.number().int().positive() });
  const assignSchema = rel.payloadSchema
    ? baseAssignSchema.merge(rel.payloadSchema as z.ZodObject<any>)
    : baseAssignSchema;

  // POST /:id/:slug -- Assign
  router.post(`/:id/${rel.slug}`, zValidator("json", assignSchema), async (c) => {
    const parentId = Number(c.req.param("id"));
    if (isNaN(parentId)) return c.json({ error: "Invalid ID" }, 400);
    const body = c.req.valid("json") as any;
    const relatedId = body[rel.bodyField];
    const db = getDb();

    // Verify parent
    const parentConditions = [eq(config.table.id, parentId)];
    if (config.contextColumnValue && config.table.context) {
      parentConditions.push(eq(config.table.context, config.contextColumnValue));
    }
    const parent = await db.select().from(config.table).where(and(...parentConditions)).get();
    if (!parent) return c.json({ error: `${config.entityName} not found` }, 404);
    if (parent.archived) return c.json({ error: "Cannot modify archived entity" }, 400);

    // Verify related (with context check if parent has context filtering)
    const relatedConditions: any[] = [eq(rel.relatedTable.id, relatedId)];
    if (config.contextColumnValue && rel.relatedTable.context) {
      relatedConditions.push(eq(rel.relatedTable.context, config.contextColumnValue));
    }
    const related = await db.select().from(rel.relatedTable).where(and(...relatedConditions)).get();
    if (!related) return c.json({ error: "Related entity not found" }, 404);

    // Prevent linking to archived entities
    if (related.archived) return c.json({ error: "Cannot link to archived entity" }, 400);

    // Check duplicate
    const existing = await db.select().from(rel.pivotTable)
      .where(and(eq(rel.parentFk, parentId), eq(rel.relatedFk, relatedId))).get();
    if (existing) return c.json({ error: "Already assigned" }, 409);

    // Insert with optional payload columns
    const values: any = {};
    values[rel.parentFk.name] = parentId;
    values[rel.relatedFk.name] = relatedId;
    if (rel.payloadColumns) {
      for (const pc of rel.payloadColumns) {
        if (body[pc.name] !== undefined) {
          values[pc.name] = body[pc.name];
        }
      }
    }
    await db.insert(rel.pivotTable).values(values);

    return c.json({ message: "Assigned" }, 201);
  });

  // PUT /:id/:slug/:relatedId -- Update payload or Remove
  router.put(`/:id/${rel.slug}/:relatedId`, async (c) => {
    const parentId = Number(c.req.param("id"));
    const relatedId = Number(c.req.param("relatedId"));
    if (isNaN(parentId) || isNaN(relatedId)) return c.json({ error: "Invalid ID" }, 400);
    const db = getDb();

    // Verify parent exists in correct context
    const parentConditions = [eq(config.table.id, parentId)];
    if (config.contextColumnValue && config.table.context) {
      parentConditions.push(eq(config.table.context, config.contextColumnValue));
    }
    const parent = await db.select().from(config.table).where(and(...parentConditions)).get();
    if (!parent) return c.json({ error: `${config.entityName} not found` }, 404);

    const existing = await db.select().from(rel.pivotTable)
      .where(and(eq(rel.parentFk, parentId), eq(rel.relatedFk, relatedId))).get();
    if (!existing) return c.json({ error: "Assignment not found" }, 404);

    // Check if body contains payload fields (update) vs empty (remove)
    let body: any = {};
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }

    const hasPayloadFields = rel.payloadColumns?.some(pc => pc.name in body) ?? false;

    if (hasPayloadFields && rel.payloadColumns) {
      // Validate payload if schema is provided
      if (rel.payloadSchema) {
        const partialSchema = (rel.payloadSchema as z.ZodObject<any>).partial();
        const parsed = partialSchema.safeParse(body);
        if (!parsed.success) {
          return c.json({ error: "Validation error", details: parsed.error.flatten() }, 400);
        }
        body = parsed.data;
      }

      // Update pivot row with payload values
      const updateValues: any = {};
      for (const pc of rel.payloadColumns) {
        if (body[pc.name] !== undefined) {
          updateValues[pc.name] = body[pc.name];
        }
      }

      if (Object.keys(updateValues).length > 0) {
        await db.update(rel.pivotTable)
          .set(updateValues)
          .where(and(eq(rel.parentFk, parentId), eq(rel.relatedFk, relatedId)));
        return c.json({ message: "Updated" });
      }
    }

    // Default: remove assignment
    await db.delete(rel.pivotTable)
      .where(and(eq(rel.parentFk, parentId), eq(rel.relatedFk, relatedId)));

    return c.json({ message: "Assignment removed" });
  });
}
