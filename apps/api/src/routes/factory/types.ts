import type { z } from "zod";
import type { Hono } from "hono";

export interface ExtraFilter {
  param: string;
  column: any; // Drizzle column reference
  schema: z.ZodTypeAny;
  mode: "eq" | "like";
}

export interface RelationshipRouteConfig {
  slug: string;             // URL path segment (e.g., "artists")
  pivotTable: any;          // Drizzle pivot table
  relatedTable: any;        // Drizzle related entity table
  parentFk: any;            // Column on pivot for parent (e.g., artistSongs.song_id)
  relatedFk: any;           // Column on pivot for related (e.g., artistSongs.artist_id)
  bodyField: string;        // POST body field name (e.g., "artistId")
}

export interface FkEnrichment {
  column: string;           // FK column name (e.g., "bin_source_id")
  targetTable: any;         // Drizzle table object (e.g., binSources)
  labelColumn?: any;        // Drizzle column for display label (default: targetTable.name)
}

export interface EntityRouteConfig {
  context: string;
  slug: string;
  table: any;               // Drizzle table object
  entityName: string;       // Human name for error messages

  createSchema: z.ZodTypeAny;
  updateSchema?: z.ZodTypeAny; // If not provided, derived from createSchema.partial()

  defaultSort: any;         // Drizzle column for default sort
  defaultOrder?: "asc" | "desc";
  sortableColumns: Record<string, any>;

  searchColumns?: any[] | null;  // Default: [table.name]. null = disable search.
  extraFilters?: ExtraFilter[];

  contextColumnValue?: string;   // Auto-filter by context column (e.g., "my_music")

  fkEnrichments?: FkEnrichment[];  // Auto-enrich FK columns with target entity name
  listEnricher?: (db: any, rows: any[]) => Promise<any[]>;
  detailEnricher?: (db: any, entity: any) => Promise<Record<string, any>>;

  relationships?: RelationshipRouteConfig[];
  extensions?: (router: Hono) => void;   // Custom routes added before CRUD
}
