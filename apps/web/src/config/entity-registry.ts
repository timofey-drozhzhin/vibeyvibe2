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

export type SectionContext = "my-music" | "anatomy" | "bin" | "suno";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  platform?: "spotify" | "apple_music" | "youtube" | "suno";
  target?: string;
  targetLabelField?: string;
  embedType?: "track" | "album";
  placeholder?: string;
  validate?: (value: string) => string | null;
  createField?: boolean;
  createRequired?: boolean;
  directory?: string;
  accept?: string;
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
  }>;
  targetLabelField?: string;
}

export interface SectionDef {
  context: SectionContext;
  label: string;
  color: string;
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
  { context: "anatomy", label: "Anatomy", color: "teal" },
  { context: "bin", label: "Bin", color: "orange" },
  { context: "suno", label: "Suno Studio", color: "pink" },
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
    key: "rating",
    label: "Rating",
    type: "rating",
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
      { key: "rating", label: "Rating", type: "rating" },
    ],
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
      { key: "rating", label: "Rating", type: "rating" },
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
      { key: "rating", label: "Rating", type: "rating" },
    ],
  },
];

const albumRelationships: RelationshipDef[] = [
  {
    type: "many-to-many",
    target: "songs",
    label: "Songs",
    subResource: "songs",
    assignFieldName: "songId",
    pivotTable: "album_songs",
    columns: [
      { key: "name", label: "Name", type: "text" },
      { key: "rating", label: "Rating", type: "rating" },
    ],
  },
];

const artistFields = (storageDir: string): FieldDef[] => [
  {
    key: "isni",
    label: "ISNI",
    type: "text",
  },
  {
    key: "rating",
    label: "Rating",
    type: "rating",
  },
  {
    key: "image_path",
    label: "Image",
    type: "image",
    directory: storageDir,
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
    key: "rating",
    label: "Rating",
    type: "rating",
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
// Entity Registry (15 entities)
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
      "rating",
      "archived",
      "created_at",
    ],
    asideFields: [
      "image_path",
      "spotify_uid",
      "apple_music_uid",
      "youtube_uid",
    ],
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
      "rating",
      "archived",
      "created_at",
    ],
    asideFields: ["image_path"],
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
      "rating",
      "archived",
      "created_at",
    ],
    asideFields: [
      "image_path",
      "spotify_uid",
      "apple_music_uid",
      "youtube_uid",
    ],
  },

  // =========================================================================
  // 4. anatomy/songs
  // =========================================================================
  {
    slug: "songs",
    tableName: "songs",
    name: "Song",
    pluralName: "Songs",
    context: "anatomy",
    storageDirectory: "songs",
    fields: songFields("songs"),
    relationships: songRelationships,
    listColumns: [
      "image_path",
      "name",
      "artists",
      "release_date",
      "rating",
      "archived",
      "created_at",
    ],
    asideFields: [
      "image_path",
      "spotify_uid",
      "apple_music_uid",
      "youtube_uid",
    ],
  },

  // =========================================================================
  // 5. anatomy/artists
  // =========================================================================
  {
    slug: "artists",
    tableName: "artists",
    name: "Artist",
    pluralName: "Artists",
    context: "anatomy",
    storageDirectory: "artists",
    fields: artistFields("artists"),
    relationships: artistRelationships,
    listColumns: [
      "image_path",
      "name",
      "rating",
      "archived",
      "created_at",
    ],
    asideFields: ["image_path"],
  },

  // =========================================================================
  // 6. anatomy/albums
  // =========================================================================
  {
    slug: "albums",
    tableName: "albums",
    name: "Album",
    pluralName: "Albums",
    context: "anatomy",
    storageDirectory: "albums",
    fields: albumFields("albums"),
    relationships: albumRelationships,
    listColumns: [
      "image_path",
      "name",
      "artists",
      "release_date",
      "rating",
      "archived",
      "created_at",
    ],
    asideFields: [
      "image_path",
      "spotify_uid",
      "apple_music_uid",
      "youtube_uid",
    ],
  },

  // =========================================================================
  // 7. anatomy/song-attributes
  // =========================================================================
  {
    slug: "song-attributes",
    tableName: "song_attributes",
    name: "Song Attribute",
    pluralName: "Song Attributes",
    context: "anatomy",
    fields: [
      {
        key: "attribute_category",
        label: "Category",
        type: "text",
        placeholder: "e.g. genre, structure, mood...",
      },
      {
        key: "description",
        label: "Description",
        type: "textarea",
      },
      {
        key: "instructions",
        label: "Instructions",
        type: "textarea",
      },
      {
        key: "examples",
        label: "Examples",
        type: "textarea",
      },
    ],
    relationships: [],
    listColumns: ["name", "attribute_category", "archived", "created_at"],
    asideFields: [],
  },

  // =========================================================================
  // 8. anatomy/song-profiles
  // =========================================================================
  {
    slug: "song-profiles",
    tableName: "song_profiles",
    name: "Song Profile",
    pluralName: "Song Profiles",
    context: "anatomy",
    fields: [
      {
        key: "song_id",
        label: "Song",
        type: "fk",
        target: "songs",
        targetLabelField: "name",
      },
      {
        key: "rating",
        label: "Rating",
        type: "rating",
      },
      {
        key: "value",
        label: "Value",
        type: "textarea",
        placeholder: "JSON attribute\u2192value pairs",
      },
    ],
    relationships: [],
    listColumns: ["name", "song_id", "rating", "archived", "created_at"],
    asideFields: [],
  },

  // =========================================================================
  // 9. bin/sources
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
    listColumns: ["name", "url", "archived", "created_at"],
    asideFields: [],
  },

  // =========================================================================
  // 10. bin/songs
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
    listColumns: ["name", "bin_source_id", "rating", "archived", "created_at"],
    asideFields: [],
  },

  // =========================================================================
  // 11. suno/prompt-collections
  // =========================================================================
  {
    slug: "prompt-collections",
    tableName: "suno_prompt_collections",
    name: "Prompt Collection",
    pluralName: "Prompt Collections",
    context: "suno",
    fields: [
      {
        key: "description",
        label: "Description",
        type: "text",
      },
    ],
    relationships: [
      {
        type: "many-to-many",
        target: "prompts",
        label: "Prompts",
        subResource: "prompts",
        assignFieldName: "promptId",
        pivotTable: "suno_collection_prompts",
        columns: [{ key: "name", label: "Name", type: "text" }],
      },
    ],
    listColumns: ["name", "description", "archived", "created_at"],
    asideFields: [],
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
      {
        key: "song_profile_id",
        label: "Song Profile",
        type: "fk",
        target: "anatomy/song-profiles",
      },
    ],
    relationships: [],
    listColumns: ["name", "archived", "created_at"],
    asideFields: [],
  },

  // =========================================================================
  // 13. suno/song-playlists
  // =========================================================================
  {
    slug: "song-playlists",
    tableName: "suno_song_playlists",
    name: "Song Playlist",
    pluralName: "Song Playlists",
    context: "suno",
    fields: [
      {
        key: "description",
        label: "Description",
        type: "text",
      },
    ],
    relationships: [],
    listColumns: ["name", "description", "archived", "created_at"],
    asideFields: [],
  },

  // =========================================================================
  // 14. suno/songs
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
      {
        key: "suno_song_playlist_id",
        label: "Playlist",
        type: "fk",
        target: "song-playlists",
      },
    ],
    relationships: [],
    listColumns: [
      "image_path",
      "name",
      "suno_prompt_id",
      "archived",
      "created_at",
    ],
    asideFields: ["image_path", "suno_uid"],
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

export const entityExtensions: Record<string, ExtensionDef[]> = {
  "anatomy/songs": [
    {
      key: "profiles",
      placement: "show-section",
      label: "Profiles",
      component: () => import("../components/anatomy/profile-editor.js").then(m => ({ default: (m as any).ProfileEditor ?? (m as any).default })),
    },
  ],
};

// ---------------------------------------------------------------------------
// Standalone Pages
// ---------------------------------------------------------------------------

export const standalonePages: StandalonePageDef[] = [
  {
    context: "anatomy",
    label: "Import",
    path: "/anatomy/import",
    component: () => import("../pages/anatomy/import.js").then(m => ({ default: (m as any).AnatomyImport ?? (m as any).default })),
  },
];
