import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, like, and, or, desc as descFn, asc as ascFn, sql } from "drizzle-orm";
import { getDb } from "../../db/index.js";
import type { EntityRouteConfig, RelationshipRouteConfig } from "./types.js";

function buildListQuerySchema(config: EntityRouteConfig) {
  const base: Record<string, z.ZodTypeAny> = {
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
    sort: z.string().optional(),
    order: z.enum(["asc", "desc"]).default(config.defaultOrder ?? "desc"),
    search: z.string().optional(),
    archived: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
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
    const { page, pageSize, sort, order, archived, search } = query;
    const db = getDb();
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
          conditions.push(f.mode === "eq" ? eq(f.column, val) : like(f.column, `%${val}%`));
        }
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const sortCol = sort && config.sortableColumns[sort] ? config.sortableColumns[sort] : config.defaultSort;
    const orderFn = order === "asc" ? ascFn(sortCol) : descFn(sortCol);

    const [data, countResult] = await Promise.all([
      db.select().from(config.table).where(whereClause).orderBy(orderFn).limit(pageSize).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(config.table).where(whereClause),
    ]);

    const enriched = config.listEnricher ? await config.listEnricher(db, data) : data;
    return c.json({ data: enriched, total: countResult[0].count, page, pageSize });
  });

  // ---- POST / (Create) ----
  router.post("/", zValidator("json", config.createSchema), async (c) => {
    const body = c.req.valid("json") as any;
    const db = getDb();
    const values: any = { ...body };
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

    if (config.detailEnricher) {
      const enrichments = await config.detailEnricher(db, entity);
      return c.json({ ...entity, ...enrichments });
    }
    return c.json(entity);
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

    const updateResult = await db
      .update(config.table)
      .set({ ...body, updated_at: new Date().toISOString() })
      .where(eq(config.table.id, id))
      .returning();
    const updated = (updateResult as any[])[0];

    return c.json(updated);
  });

  // ---- Relationship Routes ----
  if (config.relationships) {
    for (const rel of config.relationships) {
      registerRelationshipRoutes(router, config, rel);
    }
  }

  return router;
}

function registerRelationshipRoutes(router: Hono, config: EntityRouteConfig, rel: RelationshipRouteConfig) {
  const assignSchema = z.object({ [rel.bodyField]: z.number().int().positive() });

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

    // Verify related
    const related = await db.select().from(rel.relatedTable).where(eq(rel.relatedTable.id, relatedId)).get();
    if (!related) return c.json({ error: "Related entity not found" }, 404);

    // Check duplicate
    const existing = await db.select().from(rel.pivotTable)
      .where(and(eq(rel.parentFk, parentId), eq(rel.relatedFk, relatedId))).get();
    if (existing) return c.json({ error: "Already assigned" }, 409);

    // Insert
    const values: any = {};
    values[rel.parentFk.name] = parentId;
    values[rel.relatedFk.name] = relatedId;
    await db.insert(rel.pivotTable).values(values);

    return c.json({ message: "Assigned" }, 201);
  });

  // PUT /:id/:slug/:relatedId -- Remove
  router.put(`/:id/${rel.slug}/:relatedId`, async (c) => {
    const parentId = Number(c.req.param("id"));
    const relatedId = Number(c.req.param("relatedId"));
    if (isNaN(parentId) || isNaN(relatedId)) return c.json({ error: "Invalid ID" }, 400);
    const db = getDb();

    const existing = await db.select().from(rel.pivotTable)
      .where(and(eq(rel.parentFk, parentId), eq(rel.relatedFk, relatedId))).get();
    if (!existing) return c.json({ error: "Assignment not found" }, 404);

    await db.delete(rel.pivotTable)
      .where(and(eq(rel.parentFk, parentId), eq(rel.relatedFk, relatedId)));

    return c.json({ message: "Assignment removed" });
  });
}
