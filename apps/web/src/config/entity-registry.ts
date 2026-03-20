import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export type FieldType =
  | "text"
  | "textarea"
  | "date"
  | "rating"
  | "uid"
  | "image"
  | "audio"
  | "fk"
  | "url"
  | "select"
  | "readonly";

export type SectionContext = "my-music" | "lab" | "bin" | "suno" | "admin";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  platform?: "spotify" | "apple_music" | "youtube" | "suno";
  target?: string;
  targetLabelField?: string;
  embedType?: "track" | "album" | "artist";
  placeholder?: string;
  validate?: (value: string) => string | null;
  createField?: boolean;
  createRequired?: boolean;
  directory?: string;
  accept?: string;
}

export interface PayloadFieldDef {
  key: string;
  label: string;
  type: "text" | "textarea";
  required?: boolean;
  placeholder?: string;
}

export interface GenerateActionDef {
  label: string;
  endpoint: string;
  bodyField: string;
  color?: string;
  icon?: "sparkles" | "music";
  /** Resource to navigate to on success (uses data.id from response) */
  successNavigate?: string;
  /** API endpoint returning { data: string[] } of available models. Adds a model selector next to the button. */
  modelsEndpoint?: string;
}

export interface RowActionDef {
  label: string;
  icon: "eye" | "music" | "sparkles" | "pencil";
  type: "view-json" | "generate" | "edit-json";
  /** For view-json / edit-json: which field contains the JSON to display/edit */
  viewField?: string;
  /** For generate: API endpoint to POST to */
  endpoint?: string;
  /** For edit-json: API endpoint to PUT updated JSON to (PUT {editEndpoint}/{id}) */
  editEndpoint?: string;
  /** For generate: field name for row ID in request body */
  bodyField?: string;
  /** For generate: navigate to this resource on success */
  successNavigate?: string;
  color?: string;
}

export interface CompareActionDef {
  /** Which JSON field on the item to parse and display in comparison columns */
  viewField: string;
  /** Item field keys to use as column headers (e.g., ["created_at", "model"]) */
  labelFields: string[];
}

export interface RelationshipDef {
  type: "many-to-many" | "one-to-many";
  target: string;
  label: string;
  subResource: string;
  assignFieldName: string;
  pivotTable?: string;
  columns: Array<{
    key: string;
    label: string;
    type?: "text" | "rating" | "badge" | "date";
    /** Makes this column a clickable link that triggers the given action */
    action?: Pick<RowActionDef, "type" | "viewField">;
  }>;
  targetLabelField?: string;
  payloadFields?: PayloadFieldDef[];
  generateAction?: GenerateActionDef | GenerateActionDef[];
  removeAction?: {
    label: string;
    type: "unlink" | "delete";
  };
  hideAssign?: boolean;
  /** Read-only: hides assign button and all action columns */
  readOnly?: boolean;
  /** Max items to display (rest hidden behind "View all") */
  maxItems?: number;
  /** Per-row action buttons */
  rowActions?: RowActionDef[];
  /** Show archive/restore toggle per row */
  archivable?: boolean;
  /** API endpoint for archiving rows (PUT /{endpoint}/{id}) */
  archiveEndpoint?: string;
  /** Auto-poll parent record when items have this status value */
  pollWhileStatus?: string;
  /** Poll interval in ms (default 4000) */
  pollInterval?: number;
  /** Enable checkbox selection and side-by-side comparison modal for JSON data */
  compareAction?: CompareActionDef;
  /** Display mode: "table" (default), "chips" (compact pill widgets), or "cards" (reuses list page card components) */
  displayMode?: "table" | "chips" | "cards";
}

export interface SectionDef {
  context: SectionContext;
  label: string;
  color: string;
  requiredRole?: string;
}

export interface ShowActionDef {
  label: string;
  /** POST endpoint — record ID is appended (e.g. "/api/admin/ai-queue/process" → POST /api/admin/ai-queue/process/123) */
  endpoint: string;
  color?: string;
  icon?: "sparkles" | "play" | "refresh";
  /** Only show when record[conditionField] matches one of conditionValues */
  conditionField?: string;
  conditionValues?: string[];
}

export interface SortPresetDef {
  label: string;
  field: string;
  order: "asc" | "desc";
}

export interface ShowLayoutDef {
  /** Group sections into a compact grid. Each inner array is a column.
   *  "details" = main fields card. Use relationship subResource names for relationship cards.
   *  Sections not listed render full-width below the grid. */
  compactGrid: string[][];
}

export interface EntityDef {
  slug: string;
  tableName: string;
  name: string;
  pluralName: string;
  context: SectionContext;
  fields: FieldDef[];
  relationships: RelationshipDef[];
  listColumns: string[];
  asideFields: string[];
  resource?: string;
  titleField?: string;
  storageDirectory?: string;
  createExtraFields?: string[];
  /** Action buttons shown on the show page */
  showActions?: ShowActionDef[];
  /** Allow admin users to permanently delete records */
  allowDelete?: boolean;
  /** Predefined sort options shown in a dropdown on the list page */
  sortPresets?: SortPresetDef[];
  /** Layout mode for the list page. Defaults to "card-row". */
  listLayout?: "card-row" | "card-grid" | "artist-card" | "album-card" | "song-row";
  /** Enable per-user likes (heart icon, liked filter). Disabled by default. */
  enableLikes?: boolean;
  /** Columns rendered as Badges on Row 1 of the card-row layout (next to name). */
  listBadgeColumns?: string[];
  /** Auto-poll list and show pages when records have any of these status values */
  pollWhileStatus?: string[];
  /** Poll interval in ms (default 4000) */
  pollInterval?: number;
  /** Layout configuration for the show page compact grid */
  showLayout?: ShowLayoutDef;
}

export interface ExtensionDef {
  key: string;
  placement: "show-section" | "show-modal" | "list-action" | "sidebar-item";
  label: string;
  component: () => Promise<{ default: React.ComponentType<any> }>;
}

export interface StandalonePageDef {
  context: SectionContext;
  label: string;
  path: string;
  component: () => Promise<{ default: React.ComponentType<any> }>;
}

// ---------------------------------------------------------------------------
// Section Definitions
// ---------------------------------------------------------------------------

export const sections: SectionDef[] = [
  { context: "my-music", label: "My Music", color: "violet" },
  { context: "lab", label: "Lab", color: "teal" },
  { context: "bin", label: "Bin", color: "orange" },
  { context: "suno", label: "Suno Studio", color: "pink" },
  { context: "admin", label: "Admin", color: "red", requiredRole: "admin" },
];

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

const isrcRegex = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;
const validateIsrc = (v: string) =>
  v && !isrcRegex.test(v) ? "Invalid ISRC format" : null;

// ---------------------------------------------------------------------------
// Reusable Field Sets
// ---------------------------------------------------------------------------

const songFields = (storageDir: string): FieldDef[] => [
  {
    key: "isrc",
    label: "ISRC",
    type: "text",
    validate: validateIsrc,
  },
  {
    key: "release_date",
    label: "Release Date",
    type: "date",
  },
  {
    key: "image_path",
    label: "Image",
    type: "image",
    directory: storageDir,
  },
  {
    key: "spotify_uid",
    label: "Spotify",
    type: "uid",
    platform: "spotify",
    embedType: "track",
  },
  {
    key: "apple_music_uid",
    label: "Apple Music",
    type: "uid",
    platform: "apple_music",
    embedType: "track",
  },
  {
    key: "youtube_uid",
    label: "YouTube",
    type: "uid",
    platform: "youtube",
  },
];

const songRelationships: RelationshipDef[] = [
  {
    type: "many-to-many",
    target: "artists",
    label: "Artists",
    subResource: "artists",
    assignFieldName: "artistId",
    pivotTable: "artist_songs",
    columns: [
      { key: "name", label: "Name", type: "text" },
    ],
    displayMode: "cards",
  },
  {
    type: "many-to-many",
    target: "albums",
    label: "Albums",
    subResource: "albums",
    assignFieldName: "albumId",
    pivotTable: "album_songs",
    columns: [
      { key: "name", label: "Name", type: "text" },
      { key: "release_date", label: "Release Date", type: "date" },
    ],
    displayMode: "cards",
  },
  {
    type: "one-to-many",
    target: "profiles",
    label: "Profiles",
    subResource: "profiles",
    assignFieldName: "",
    hideAssign: true,
    columns: [
      { key: "created_at", label: "Date", type: "date", action: { type: "view-json", viewField: "value" } },
      { key: "model", label: "Model", type: "text" },
      { key: "status", label: "Status", type: "badge" },
    ],
    maxItems: 10,
    archivable: true,
    archiveEndpoint: "/api/profiles",
    pollWhileStatus: "processing",
    pollInterval: 4000,
    compareAction: { viewField: "value", labelFields: ["created_at", "model"] },
    generateAction: {
      label: "Generate",
      endpoint: "/api/profile-generator/generate",
      bodyField: "songId",
      color: "violet",
      icon: "sparkles",
      modelsEndpoint: "/api/profile-generator/models",
    },
    rowActions: [
      {
        label: "Edit Profile",
        icon: "pencil",
        type: "edit-json",
        viewField: "value",
        editEndpoint: "/api/profiles",
        color: "blue",
      },
      {
        label: "Suno Prompt",
        icon: "music",
        type: "generate",
        endpoint: "/api/suno-prompt-generator/generate-from-profile",
        bodyField: "profileId",
        successNavigate: "suno/prompts",
        color: "pink",
      },
    ],
  },
];

const artistRelationships: RelationshipDef[] = [
  {
    type: "many-to-many",
    target: "songs",
    label: "Songs",
    subResource: "songs",
    assignFieldName: "songId",
    pivotTable: "artist_songs",
    columns: [
      { key: "name", label: "Name", type: "text" },
    ],
    displayMode: "chips",
  },
];

const albumRelationships: RelationshipDef[] = [
  {
    type: "many-to-many",
    target: "artists",
    label: "Artists",
    subResource: "artists",
    assignFieldName: "artistId",
    columns: [
      { key: "name", label: "Name", type: "text" },
    ],
    readOnly: true,
    displayMode: "chips",
  },
  {
    type: "many-to-many",
    target: "songs",
    label: "Songs",
    subResource: "songs",
    assignFieldName: "songId",
    pivotTable: "album_songs",
    columns: [
      { key: "name", label: "Name", type: "text" },
    ],
    displayMode: "chips",
  },
];

const artistFields = (storageDir: string): FieldDef[] => [
  {
    key: "isni",
    label: "ISNI",
    type: "text",
  },
  {
    key: "image_path",
    label: "Image",
    type: "image",
    directory: storageDir,
  },
  {
    key: "spotify_uid",
    label: "Spotify",
    type: "uid",
    platform: "spotify",
    embedType: "artist",
  },
  {
    key: "apple_music_uid",
    label: "Apple Music",
    type: "uid",
    platform: "apple_music",
    embedType: "artist",
  },
  {
    key: "youtube_uid",
    label: "YouTube",
    type: "uid",
    platform: "youtube",
    embedType: "artist",
  },
];

const albumFields = (storageDir: string): FieldDef[] => [
  {
    key: "ean",
    label: "EAN",
    type: "text",
  },
  {
    key: "release_date",
    label: "Release Date",
    type: "date",
  },
  {
    key: "image_path",
    label: "Image",
    type: "image",
    directory: storageDir,
  },
  {
    key: "spotify_uid",
    label: "Spotify",
    type: "uid",
    platform: "spotify",
    embedType: "album",
  },
  {
    key: "apple_music_uid",
    label: "Apple Music",
    type: "uid",
    platform: "apple_music",
    embedType: "album",
  },
  {
    key: "youtube_uid",
    label: "YouTube",
    type: "uid",
    platform: "youtube",
  },
];

// ---------------------------------------------------------------------------
// Reusable Sort Presets
// ---------------------------------------------------------------------------

const songSortPresets: SortPresetDef[] = [
  { label: "Added: Newest", field: "created_at", order: "desc" },
  { label: "Added: Oldest", field: "created_at", order: "asc" },
  { label: "Released: Newest", field: "release_date", order: "desc" },
  { label: "Released: Oldest", field: "release_date", order: "asc" },
];

const albumSortPresets: SortPresetDef[] = [
  { label: "Added: Newest", field: "created_at", order: "desc" },
  { label: "Added: Oldest", field: "created_at", order: "asc" },
  { label: "Released: Newest", field: "release_date", order: "desc" },
  { label: "Released: Oldest", field: "release_date", order: "asc" },
];

const artistSortPresets: SortPresetDef[] = [
  { label: "Added: Newest", field: "created_at", order: "desc" },
  { label: "Added: Oldest", field: "created_at", order: "asc" },
];

// ---------------------------------------------------------------------------
// Entity Registry (13 entities)
// ---------------------------------------------------------------------------

export const entityRegistry: EntityDef[] = [
  // =========================================================================
  // 1. my-music/songs
  // =========================================================================
  {
    slug: "songs",
    tableName: "songs",
    name: "Song",
    pluralName: "Songs",
    context: "my-music",
    storageDirectory: "songs",
    fields: songFields("songs"),
    relationships: songRelationships,
    listColumns: [
      "image_path",
      "name",
      "artists",
      "release_date",
      "created_at",
    ],
    asideFields: [
      "image_path",
      "spotify_uid",
      "apple_music_uid",
      "youtube_uid",
    ],
    allowDelete: true,
    sortPresets: songSortPresets,
    listLayout: "song-row",
    enableLikes: true,
    showLayout: {
      compactGrid: [
        ["details"],
        ["artists", "albums"],
      ],
    },
  },

  // =========================================================================
  // 2. my-music/artists
  // =========================================================================
  {
    slug: "artists",
    tableName: "artists",
    name: "Artist",
    pluralName: "Artists",
    context: "my-music",
    storageDirectory: "artists",
    fields: artistFields("artists"),
    relationships: artistRelationships,
    listColumns: [
      "image_path",
      "name",
      "created_at",
    ],
    asideFields: [
      "image_path",
      "spotify_uid",
      "apple_music_uid",
      "youtube_uid",
    ],
    allowDelete: true,
    sortPresets: artistSortPresets,
    listLayout: "artist-card",
    enableLikes: true,
  },

  // =========================================================================
  // 3. my-music/albums
  // =========================================================================
  {
    slug: "albums",
    tableName: "albums",
    name: "Album",
    pluralName: "Albums",
    context: "my-music",
    storageDirectory: "albums",
    fields: albumFields("albums"),
    relationships: albumRelationships,
    listColumns: [
      "image_path",
      "name",
      "artists",
      "release_date",
      "created_at",
    ],
    asideFields: [
      "image_path",
      "spotify_uid",
      "apple_music_uid",
      "youtube_uid",
    ],
    allowDelete: true,
    sortPresets: albumSortPresets,
    listLayout: "album-card",
    enableLikes: true,
  },

  // =========================================================================
  // 4. lab/songs
  // =========================================================================
  {
    slug: "songs",
    tableName: "songs",
    name: "Song",
    pluralName: "Songs",
    context: "lab",
    storageDirectory: "songs",
    fields: songFields("songs"),
    relationships: songRelationships,
    listColumns: [
      "image_path",
      "name",
      "artists",
      "release_date",
      "created_at",
    ],
    asideFields: [
      "image_path",
      "spotify_uid",
      "apple_music_uid",
      "youtube_uid",
    ],
    allowDelete: true,
    sortPresets: songSortPresets,
    listLayout: "song-row",
    enableLikes: true,
    showLayout: {
      compactGrid: [
        ["details"],
        ["artists", "albums"],
      ],
    },
  },

  // =========================================================================
  // 5. lab/artists
  // =========================================================================
  {
    slug: "artists",
    tableName: "artists",
    name: "Artist",
    pluralName: "Artists",
    context: "lab",
    storageDirectory: "artists",
    fields: artistFields("artists"),
    relationships: artistRelationships,
    listColumns: [
      "image_path",
      "name",
      "created_at",
    ],
    asideFields: [
      "image_path",
      "spotify_uid",
      "apple_music_uid",
      "youtube_uid",
    ],
    allowDelete: true,
    sortPresets: artistSortPresets,
    listLayout: "artist-card",
    enableLikes: true,
  },

  // =========================================================================
  // 6. lab/albums
  // =========================================================================
  {
    slug: "albums",
    tableName: "albums",
    name: "Album",
    pluralName: "Albums",
    context: "lab",
    storageDirectory: "albums",
    fields: albumFields("albums"),
    relationships: albumRelationships,
    listColumns: [
      "image_path",
      "name",
      "artists",
      "release_date",
      "created_at",
    ],
    asideFields: [
      "image_path",
      "spotify_uid",
      "apple_music_uid",
      "youtube_uid",
    ],
    allowDelete: true,
    sortPresets: albumSortPresets,
    listLayout: "album-card",
    enableLikes: true,
  },

  // =========================================================================
  // 7. admin/queue (AI Queue)
  // =========================================================================
  {
    slug: "queue",
    tableName: "ai_queue",
    name: "Queue Item",
    pluralName: "Queue",
    context: "admin",
    fields: [
      {
        key: "type",
        label: "Type",
        type: "readonly",
      },
      {
        key: "status",
        label: "Status",
        type: "readonly",
      },
      {
        key: "model",
        label: "Model",
        type: "readonly",
      },
      {
        key: "attempts",
        label: "Attempts",
        type: "readonly",
      },
      {
        key: "started_at",
        label: "Started",
        type: "readonly",
      },
      {
        key: "error",
        label: "Error",
        type: "textarea",
      },
      {
        key: "prompt",
        label: "Prompt",
        type: "textarea",
      },
      {
        key: "response",
        label: "Response",
        type: "textarea",
      },
    ],
    relationships: [],
    listColumns: ["name", "status", "model", "created_at"],
    asideFields: [],
    listBadgeColumns: ["status"],
    pollWhileStatus: ["pending", "processing"],
    pollInterval: 4000,
    showActions: [
      {
        label: "Retry",
        endpoint: "/api/admin/ai-queue/retry",
        color: "orange",
        icon: "refresh",
        conditionField: "status",
        conditionValues: ["pending", "failed", "processing"],
      },
    ],
  },

  // =========================================================================
  // 9. bin/songs
  // =========================================================================
  {
    slug: "songs",
    tableName: "bin_songs",
    name: "Song",
    pluralName: "Songs",
    context: "bin",
    fields: [
      {
        key: "bin_source_id",
        label: "Source",
        type: "fk",
        target: "sources",
      },
      {
        key: "asset_path",
        label: "Audio Asset",
        type: "audio",
        directory: "bin",
        accept: "audio/*",
      },
      {
        key: "lyrics",
        label: "Lyrics",
        type: "textarea",
      },
      {
        key: "notes",
        label: "Notes",
        type: "textarea",
      },
      {
        key: "rating",
        label: "Rating",
        type: "rating",
      },
    ],
    relationships: [],
    listColumns: ["name", "asset_path", "rating", "created_at"],
    asideFields: [],
    enableLikes: true,
  },

  // =========================================================================
  // 10. bin/sources
  // =========================================================================
  {
    slug: "sources",
    tableName: "bin_sources",
    name: "Source",
    pluralName: "Sources",
    context: "bin",
    fields: [
      {
        key: "url",
        label: "URL",
        type: "url",
        placeholder: "https://...",
        createField: true,
        createRequired: true,
      },
    ],
    relationships: [],
    listColumns: ["name", "url", "created_at"],
    asideFields: [],
  },

  // =========================================================================
  // 11. suno/songs
  // =========================================================================
  {
    slug: "songs",
    tableName: "suno_songs",
    name: "Song",
    pluralName: "Songs",
    context: "suno",
    storageDirectory: "suno",
    fields: [
      {
        key: "suno_uid",
        label: "Suno",
        type: "uid",
        platform: "suno",
      },
      {
        key: "image_path",
        label: "Image",
        type: "image",
        directory: "suno",
      },
      {
        key: "suno_prompt_id",
        label: "Prompt",
        type: "fk",
        target: "prompts",
      },
      {
        key: "bin_song_id",
        label: "Bin Song",
        type: "fk",
        target: "bin/songs",
      },
    ],
    relationships: [],
    listColumns: [
      "image_path",
      "name",
      "suno_prompt_id",
      "created_at",
    ],
    asideFields: ["image_path", "suno_uid"],
    enableLikes: true,
  },

  // =========================================================================
  // 12. suno/prompts
  // =========================================================================
  {
    slug: "prompts",
    tableName: "suno_prompts",
    name: "Prompt",
    pluralName: "Prompts",
    context: "suno",
    fields: [
      {
        key: "song_id",
        label: "Source Song",
        type: "fk",
        target: "lab/songs",
      },
      {
        key: "lyrics",
        label: "Lyrics",
        type: "textarea",
      },
      {
        key: "prompt",
        label: "Prompt",
        type: "textarea",
      },
      {
        key: "notes",
        label: "Notes",
        type: "textarea",
      },
    ],
    relationships: [],
    listColumns: ["name", "created_at"],
    asideFields: [],
    enableLikes: true,
  },
];

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

export function getResourceName(entity: EntityDef): string {
  return entity.resource ?? `${entity.context}/${entity.slug}`;
}

export function getRoutePath(entity: EntityDef): string {
  return `/${entity.context}/${entity.slug}`;
}

export function findEntity(
  context: SectionContext,
  slug: string,
): EntityDef | undefined {
  return entityRegistry.find(
    (e) => e.context === context && e.slug === slug,
  );
}

export function findEntityByResource(
  resource: string,
): EntityDef | undefined {
  return entityRegistry.find((e) => getResourceName(e) === resource);
}

export function getEntitiesForSection(
  context: SectionContext,
): EntityDef[] {
  return entityRegistry.filter((e) => e.context === context);
}

export function resolveRelationshipTarget(
  sourceEntity: EntityDef,
  targetSlug: string,
): EntityDef | undefined {
  if (targetSlug.includes("/")) {
    const [ctx, slug] = targetSlug.split("/");
    return findEntity(ctx as SectionContext, slug);
  }
  return findEntity(sourceEntity.context, targetSlug);
}

// ---------------------------------------------------------------------------
// Extensions Registry
// ---------------------------------------------------------------------------

export const entityExtensions: Record<string, ExtensionDef[]> = {};

// ---------------------------------------------------------------------------
// Standalone Pages
// ---------------------------------------------------------------------------

export const standalonePages: StandalonePageDef[] = [
  {
    context: "lab",
    label: "Import",
    path: "/lab/import",
    component: () => import("../pages/lab/import.js").then(m => ({ default: (m as any).LabImport ?? (m as any).default })),
  },
];
