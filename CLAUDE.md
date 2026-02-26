# vibeyvibe - AI Music Management System

A personal music management platform for cataloging music collections, analyzing song anatomy, managing a song bin, and crafting AI prompts for Suno music generation.

## Architecture

Monorepo managed with pnpm workspaces. Two apps live under `apps/`:

- **apps/api** -- Hono v4 REST API backend (deploys to Bunny Edge Scripting)
- **apps/web** -- Refine v5 (headless) + Mantine UI v8 single-page application (deploys to Bunny CDN)

The API serves all data through a `/api` prefix. The web app proxies `/api` requests to the backend during development via Vite's dev server proxy.

## Folder Map

```
/
├── apps/
│   ├── api/              # Hono backend API (TypeScript, Node/Edge)
│   └── web/              # Refine + Mantine frontend SPA (React, Vite)
├── tests/
│   └── e2e/              # End-to-end test specs
│       └── specs/        # Test spec files
├── tmp/                  # Temporary files, local dev storage (gitignored)
│   ├── storage/          # Local file storage for dev (mimics Bunny CDN)
│   └── playwright/       # MCP Playwright screenshots, PDFs, and exports
├── .devcontainer/        # Dev container configuration (Debian + Node)
├── .claude/              # Claude Code settings
├── package.json          # Root workspace scripts
├── pnpm-workspace.yaml   # pnpm workspace config (apps/*)
├── tsconfig.base.json    # Shared TypeScript base configuration
├── .env.dev-example      # Development environment template
├── .env.prod-example     # Production environment template
└── .gitignore            # Global ignore rules

apps/api/src/db/
  schema.ts               # Unified Drizzle schema (all tables)
  schema/
    index.ts              # Re-exports schema.ts + auth.ts
    auth.ts               # Better Auth tables (unchanged)
  seed.ts                 # Database seeding
  seed-attributes.ts      # Song attributes seeding

apps/api/src/routes/
  factory/
    types.ts              # Route factory types
    create-routes.ts      # Generic CRUD route factory
  extensions/
    anatomy-import.ts     # Spotify import
    upload.ts             # File upload
    storage.ts            # File serving
  registry.ts             # All entity route configurations
  index.ts                # Assembles factory + extensions

apps/web/src/
  config/
    entity-registry.ts    # Entity definitions driving all UI
  pages/
    generic/
      list.tsx            # Generic entity list page
      show.tsx            # Generic entity detail page
  components/
    generic/              # Dynamic UI sub-components (FieldRow, AsidePanel, RelationshipSection, ListCell)
    shared/               # Reusable shared components
```

## Tech Stack

| Layer         | Technology                                      |
|---------------|------------------------------------------------|
| API Framework | Hono v4                                        |
| Frontend      | Refine v5 (headless) + Mantine UI v8 + React 19 |
| Database ORM  | Drizzle ORM (SQLite / libSQL)                  |
| Auth          | Better Auth (email/password + Google OAuth)     |
| Validation    | Zod (shared validation schemas)                |
| File Storage  | Bunny Edge Storage + CDN (local filesystem dev)|
| Build         | esbuild (API), Vite (web)                      |
| Testing       | Vitest                                         |
| Runtime       | Node.js 20+ (dev), Bunny Edge Scripting (prod) |
| Package Mgr   | pnpm (workspaces)                              |
| Icons         | @tabler/icons-react                            |

## Global Rules

### Framework Conventions Are Law
The conventions of the tech stack (Refine, Drizzle ORM, Mantine, Hono, Zod, etc.) always supersede project-specific conventions. Never implement something that contradicts how the framework is intended to be used. If you receive instructions that conflict with a framework's conventions or intended usage patterns, do not proceed -- notify the user immediately and explain the conflict.

### Revert Failed Fixes
If a fix did not resolve the issue, revert it before trying the next approach. Do not leave dead code behind.

### No Faking Features
If a feature cannot be properly implemented, do not fake it with placeholder logic or mock behavior. Either implement it correctly or tell me that you are unable to create it.

### No Deletes -- Archive Only
There are NO delete operations anywhere in the system. Every record that needs to be "removed" is archived by setting `archived = true` via a PUT request. No DELETE HTTP methods exist. No delete buttons exist in the UI.

### Single User System
This is a personal tool. There is no registration flow after initial setup. Only one user account exists. Auth exists to protect the deployment, not to manage multiple users.

### Database Table Naming
Tables are now unified. Shared entity tables (`songs`, `artists`, `albums`) use a `context` column to differentiate sections (values: `"my_music"`, `"anatomy"`).
- Shared tables: `songs`, `artists`, `albums` (with `context` column)
- Pivot tables: `artist_songs`, `album_songs`, `suno_collection_prompts`
- Anatomy-specific: `song_profiles`, `song_attributes`
- Bin: `bin_sources`, `bin_songs`
- Suno: `suno_prompt_collections`, `suno_prompts`, `suno_collection_prompts`, `suno_song_playlists`, `suno_songs`
- Auth tables (user, session, account, verification) are managed by Better Auth and have no prefix.

### Temporary Files
All temporary files and dev-environment specific go in `./tmp/` (gitignored). Local dev storage lives at `./tmp/storage/`, local dev database lives at `./tmp/local.db`. MCP Playwright outputs (screenshots, PDFs) go in `./tmp/mcp-playwright/screenshots`.

### Documentation
Always document changes (especially structural) in CLAUDE.md files. Keep these files up to date when adding new routes, schemas, pages, or changing conventions.
`./tmp/DOCUMENTATIONS.md` is your temporary memory for CLAUDE.md and README.md documents. Update it before starting changes, and read it back after context compaction, to resume without losing important knowledge.

### Libraries Over Hand-Made Solutions
Use well-maintained libraries instead of writing custom implementations. Prefer established solutions (Refine hooks, Mantine components, Drizzle queries, Zod schemas) over bespoke code.

### Latest Versions
Use the latest stable versions of all tools and dependencies. Current baseline versions are specified in each app's package.json.

### Input Validation
All API endpoints must validate input with Zod using `@hono/zod-validator`. Every route handler validates both request body (POST/PUT) and query parameters (GET list endpoints).

### Everything is Generic -- No Entity-Specific Code
Every component, route, URL path, and function must operate at the global entity level. Never write code that targets a specific entity type or context. No entity-specific components, no entity-specific route handlers, no `if (entity === 'x')` branches. All behavior differences between entities come from their registry configuration, never from code. If one entity needs something, build it as a generic capability that all entities can use.

### Production Safety
Never run `drizzle-kit push` against production. Production database changes go through the migration workflow: edit schema, push locally, generate migration, commit, then run `db:migrate` in production.

## Commands

All commands are run from the workspace root:

```bash
# Development
pnpm dev              # Start both API and web in parallel
pnpm dev:api          # Start API only (tsx watch, port 3001)
pnpm dev:web          # Start web only (Vite, port 5173)

# Build
pnpm build            # Build both apps
pnpm build:api        # Build API (esbuild bundle)
pnpm build:web        # Build web (Vite production build)

# Test
pnpm test             # Run all tests (vitest)
pnpm test:api         # Run API tests only
pnpm test:web         # Run web tests only

# Database
pnpm db:push          # Push schema to local SQLite (dev only)
pnpm db:generate      # Generate migration files from schema changes
pnpm db:migrate       # Run migrations (used for production)
pnpm db:studio        # Open Drizzle Studio GUI
pnpm db:seed          # Seed database with sample data

# Quality
pnpm lint             # Lint all packages
pnpm typecheck        # TypeScript type checking
```

## Environment Setup

**There is exactly one `.env` file for the entire project, located at the workspace root (`/workspace/.env`).** Never create `.env` files inside `apps/api/`, `apps/web/`, or any subdirectory. Both apps load environment variables from the root `.env` file. All paths in `.env` (like `DATABASE_URL`, `STORAGE_LOCAL_PATH`) are relative to `apps/api/` since that's where the API process runs.

**No env variables have default values.** All values must be explicitly set in `.env`. The Zod schema in `apps/api/src/env.ts` validates all variables on startup and throws if any required values are missing.

Two example files are provided:
- `.env.dev-example` -- Development defaults (local SQLite, local storage, auth bypass enabled)
- `.env.prod-example` -- Production template (libSQL remote, Bunny CDN, real auth)

For local development, `pnpm dev` automatically copies `.env.dev-example` to `.env` if `.env` doesn't exist (via the `predev` script).

## Database

- **Development**: Local SQLite file at `tmp/local.db` (relative to workspace root, gitignored). Created automatically on first `db:push`.
- **Production**: Bunny libSQL remote database. Set `DATABASE_URL` to the libSQL connection string and provide `DATABASE_AUTH_TOKEN`.
- ORM: Drizzle ORM with the libSQL driver.
- All tables use integer auto-increment primary keys (was text nanoid).
- All tables include `created_at` and `updated_at` timestamp columns.
- Rating scale is 0-1 real (was 0-5 integer). 0 = unrated, values between 0 and 1 represent the rating.
- Column names use snake_case (e.g., `image_path`, `release_date`, `spotify_uid`).
- Foreign keys use `_id` suffix (e.g., `song_id`, `artist_id`). External identifiers use `_uid` suffix (e.g., `spotify_uid`, `apple_music_uid`).

### Seeding

- `pnpm db:seed` -- Seeds the database with sample data (runs `apps/api/src/db/seed.ts`).
- `apps/api/src/db/seed-attributes.ts` -- Standalone script to seed the `song_attributes` table with a comprehensive set of 60+ analysis attributes grouped by category. Run directly via `tsx apps/api/src/db/seed-attributes.ts` from the API directory.

### Notable Schema Details

- **song_attributes** includes an `attribute_category` column (text, not null) for grouping attributes (e.g., "genre", "structure", "composition", "rhythm", "instrumentation", "vocals", "lyrics", "production", "mood", "energy", "signature").

## Storage

- **Development**: Local filesystem at `tmp/storage/` (relative to workspace root). Files are served through the API at `/api/storage/*`.
- **Production**: Bunny Edge Storage with Bunny CDN for public URLs. Configure `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_PASSWORD`, `BUNNY_STORAGE_REGION`, `BUNNY_CDN_HOSTNAME`.
- Storage is accessed through the `StorageClient` abstraction (`services/storage/`), which provides `upload`, `download`, `getPublicUrl`, and `exists` methods.

## Fonts

- **Righteous** -- Used for the brand/logo text ("vibeyvibe" in the sidebar and login page).
- **Poppins** -- Used for all body text and headings throughout the application.
- Both are loaded from Google Fonts in `index.html`.

## Application Sections

All entity pages are now dynamically generated from the entity registry. There are no per-entity page files -- two generic components (`GenericEntityList` and `GenericEntityDetail`) handle all entity types.

Routes follow the pattern: `/{context}/{entity-slug}` for list pages, `/{context}/{entity-slug}/show/:id` for detail pages.

### My Music
Personal music library. Track songs, artists, and albums with metadata (ISRC, ISNI, EAN), ratings, and links to Spotify/Apple Music/YouTube.

### Anatomy
Song analysis workspace. Study song structure through attributes (tempo, mood, instrumentation, etc.) and build anatomy profiles for reference songs.

### Bin
Collection point for song discoveries and sources. Track where songs come from and store raw assets before they are processed.

### Suno Studio
AI music generation workflow. Craft text prompts (lyrics + style), organize them into collections, and track generation results from Suno. Links to anatomy profiles for reference and bin songs for output.

## Security

### Rate Limiting
Auth endpoints (`/api/auth/*`) are protected by an in-memory rate limiter: 10 requests per 60 seconds per IP address. The middleware (`apps/api/src/middleware/rate-limit.ts`) tracks requests by IP (using `X-Forwarded-For` or `X-Real-IP` headers) and returns HTTP 429 with `Retry-After` header when the limit is exceeded. Expired entries are cleaned up periodically to prevent memory leaks.

### Secure Headers
All responses include secure headers via Hono's `secureHeaders()` middleware.

## Spotify Import Service

The Spotify metadata extraction service (`apps/api/src/services/spotify/index.ts`) uses the `spotify-url-info` library to scrape public Spotify embed pages and extract track metadata without requiring Spotify API credentials. Type declarations for the library are in `apps/api/src/types/spotify-url-info.d.ts`.

### Public API
- `fetchSpotifyData(url)` -- Fetches metadata for a Spotify URL (track, album, or playlist). Returns a `SpotifyImportResult` with an array of normalized `SpotifyTrack` objects containing name, artists, album, releaseDate, ISRC, imageUrl, and spotifyId.
- `detectSpotifyType(url)` -- Detects whether a URL points to a track, album, playlist, or is unknown.

### Import Flow
1. User enters a Spotify URL on the Import page (`/anatomy/import`)
2. `POST /api/anatomy/import` validates the URL and calls `fetchSpotifyData` to return a preview of extracted tracks
3. User reviews and selects tracks to import
4. `POST /api/anatomy/import/confirm` creates `songs` and `artists` records (with `context = "anatomy"`) from the selected tracks, with duplicate detection by Spotify ID and ISRC. Also downloads cover art images to storage and updates `image_path` on created records.

## File Upload Routes

### POST /api/upload
Upload a file via multipart form data. Accepts `file` (required) and `directory` (optional) fields.
- **Max size**: 10MB
- **Allowed types**: `image/*`, `audio/*`
- **Valid directories**: `artists`, `albums`, `songs`, `bin`
- **Returns**: `{ path: string, url: string }` (HTTP 201)
- Files are stored with nanoid-generated unique filenames

### GET /api/storage/*
Serve uploaded files by storage path. Sets immutable cache headers. Supports image formats (JPEG, PNG, GIF, WebP, SVG) and audio formats (MP3, WAV, OGG, FLAC, AAC, M4A).

## Profile Management

Anatomy profiles store structured analysis data as JSON objects keyed by attribute name (e.g., `{"Tempo": "120 BPM", "Mood": "melancholic"}`). Profiles are stored in the `song_profiles` table with a `song_id` foreign key and a `value` text column containing the JSON string.

### API Routes
Factory-generated CRUD routes at `/api/anatomy/song-profiles`:
- `GET /api/anatomy/song-profiles` -- List profiles (filterable by `song_id` query parameter)
- `POST /api/anatomy/song-profiles` -- Create profile (`{ name, song_id, value }`)
- `GET /api/anatomy/song-profiles/:id` -- Get profile (enriched with song name via detail enricher)
- `PUT /api/anatomy/song-profiles/:id` -- Update/archive profile

### ProfileEditor Component
The `ProfileEditor` component (`components/anatomy/profile-editor.tsx`) fetches all active attributes and renders a textarea for each one. Supports creating new profiles and editing existing ones. Used on the Anatomy Song show page.

## Import Functionality

These are extension routes defined in `apps/api/src/routes/extensions/anatomy-import.ts`, not factory-generated.

### POST /api/anatomy/import
Accepts a Spotify URL and returns a preview of extracted track metadata using the Spotify import service. Validates that the URL is a supported Spotify URL (`open.spotify.com`, `spotify.link`). Returns track name, artists, album, release date, ISRC, image URL, and Spotify ID.

**Schema**: `{ url: string }` (must be a valid URL, validated by `importUrlSchema` from `validators/anatomy.ts`)

### POST /api/anatomy/import/confirm
Accepts an array of tracks (from the preview step) and creates `songs`, `artists`, and `albums` records with `context = "anatomy"`. Links them via `artist_songs` and `album_songs` pivot tables. Skips duplicates by Spotify ID or ISRC. Artists and albums are matched case-insensitively by name within the anatomy context.

**Schema**: `{ tracks: [{ name, artists: [{name}], album?: {name}, releaseDate?, isrc?, imageUrl?, spotifyId }] }`

## Relationship Assignment Routes

Songs can be assigned to artists and albums through shared pivot tables (`artist_songs`, `album_songs`). These relationships are managed through the route factory and apply across all contexts. The `bodyField` in relationship configs uses camelCase (matching the JSON request body), while the underlying pivot table columns use snake_case.

### Songs (My Music and Anatomy)
- `POST /api/{context}/songs/:id/artists` -- Assign artist (`{ artistId }`)
- `PUT /api/{context}/songs/:id/artists/:relatedId` -- Remove artist assignment
- `POST /api/{context}/songs/:id/albums` -- Assign album (`{ albumId }`)
- `PUT /api/{context}/songs/:id/albums/:relatedId` -- Remove album assignment

### Suno Studio
- `POST /api/suno/prompt-collections/:id/prompts` -- Assign prompt (`{ promptId }`)
- `PUT /api/suno/prompt-collections/:id/prompts/:relatedId` -- Remove prompt assignment

## Show Page Standards

All show pages are rendered by `GenericEntityDetail` (`pages/generic/show.tsx`), which uses the `EntityPage` component (`components/shared/entity-page.tsx`) for consistent layout:

### Layout
- **`EntityPage`** wraps the entire show page with editable title header, archive badge, optional right panel, archive button in footer, and loading/not-found states.
- **`SectionCard`** (re-exported from `entity-page.tsx`) provides card sections with `Title order={4}` header and optional action button (`size="xs" variant="light"` with `IconPlus size={14}`).
- **`ImageUpload`** replaces the old `ImagePreview` + `FileUpload` combination. Click-to-upload with hover overlay.

### Inline Editing
- Use `EditableField` for simple text metadata fields (ISRC, dates, URLs). Click-to-edit with hover edit icon. Supports `type='date'` for calendar date picker.
- Use `RatingField` with `onChange` for interactive inline ratings (no `readOnly` prop on show pages).
- Use `MediaEmbeds` with `onSave` prop for platform ID editing -- renders editable placeholders and edit links for Spotify/Apple Music/YouTube IDs. No more separate `EditableField` rows for platform IDs.

### Create Flow
- There are no separate `create.tsx` or `edit.tsx` page files. List pages include create modals for adding new records inline.

## Shared UI Components

Located in `apps/web/src/components/shared/`:

| Component | File | Description |
|-----------|------|-------------|
| `FileUpload` | `file-upload.tsx` | File upload widget that POSTs to `/api/upload` and returns the storage path. No longer shows 'Uploaded:' text display. |
| `ImagePreview` | `image-preview.tsx` | Displays an image from storage path, or a placeholder icon when no path is set. Configurable size. |
| `AudioPlayer` | `audio-player.tsx` | HTML5 audio player that plays files from storage. Shows "no audio" placeholder when path is null. |
| `AssignModal` | `assign-modal.tsx` | Modal with searchable dropdown for assigning relationships (artist to song, prompt to collection, etc.). |
| `SortableHeader` | `sortable-header.tsx` | Clickable table header cell with sort direction arrow indicator. |
| `ListToolbar` | `list-toolbar.tsx` | Shared toolbar with search input and archive status segmented control (Active/All/Archived). |
| `RatingField` | `rating-field.tsx` | Interactive star rating (0-1 real scale, 0=unrated). Click same star to reset. Also exports `RatingDisplay`. |
| `ArchiveButton` | `archive-toggle.tsx` | Red "Archive" / green "Restore" button with confirmation Modal. Also exports `ArchiveBadge` (green "Active" / red "Archived" badge). |
| `PlatformLinks` | `platform-links.tsx` | Spotify/Apple Music/YouTube icon buttons that open external URLs. Used in table Actions columns. |
| `MediaEmbeds` | `media-embeds.tsx` | Spotify, Apple Music, YouTube iframe embeds. Supports `type` prop ('track'\|'album') for correct embed URLs. With `onSave` prop, shows editable platform ID placeholders and edit links. |
| `EditableField` | `editable-field.tsx` | Click-to-edit inline field with hover edit icon. Supports custom renderDisplay, validation, and async save. Supports `type='date'` for calendar date picker via @mantine/dates. |
| `EntityPage` | `entity-page.tsx` | Global show page layout with editable title header, archive badge, optional right panel, archive button footer, loading/not-found states. |
| `ImageUpload` | `image-upload.tsx` | Click-to-upload image with preview. Hover overlay shows upload icon. Replaces ImagePreview+FileUpload combo on show pages. |
| `SectionCard` | `entity-page.tsx` | Card section with Title order={4} header and optional action button (size="xs" variant="light"). Re-exported from `entity-page.tsx`. |

### Generic Page Components

The two main generic page components live in `apps/web/src/pages/generic/`:

| Component | File | Description |
|-----------|------|-------------|
| `GenericEntityList` | `pages/generic/list.tsx` | Dynamic list page driven by entity registry config. Renders table columns, search, pagination, and create modal for any entity type. |
| `GenericEntityDetail` | `pages/generic/show.tsx` | Dynamic detail/show page driven by entity registry config. Renders field rows, aside panel, relationship sections for any entity type. |

### Generic Sub-Components

Supporting components used by the generic pages, located in `apps/web/src/components/generic/`:

| Component | File | Description |
|-----------|------|-------------|
| `FieldRow` | `field-row.tsx` | Renders a single field on a detail page based on field type configuration from the registry. |
| `AsidePanel` | `aside-panel.tsx` | Right-side panel on detail pages for image upload, media embeds, and supplementary info. |
| `RelationshipSection` | `relationship-section.tsx` | Displays and manages entity relationships (e.g., artists on a song, prompts in a collection). |
| `ListCell` | `list-cell.tsx` | Renders a single table cell on list pages based on column type configuration from the registry. |

### Anatomy Components

Located in `apps/web/src/components/anatomy/`:

| Component | File | Description |
|-----------|------|-------------|
| `ProfileEditor` | `profile-editor.tsx` | Form for creating/editing anatomy profiles. Fetches all active attributes and renders a textarea per attribute. Saves as JSON. |

## API Validation Schemas

All Zod validation schemas used by the route factory are defined inline in `apps/api/src/routes/registry.ts`. Each entity's `createSchema` and `updateSchema` are declared alongside the registry entry. List query schemas are auto-generated by the factory based on entity configuration (sortable columns, extra filters). Update schemas are typically `createSchema.partial().extend({ archived: z.boolean().optional() })` unless explicitly overridden.

Legacy validator files still exist in `apps/api/src/validators/` (my-music.ts, anatomy.ts, bin.ts, suno.ts) but are **not consumed by the route factory**. The only active use is `importUrlSchema` from `validators/anatomy.ts`, which is referenced by the import extension route (`routes/extensions/anatomy-import.ts`).

## API Route Factory

CRUD routes are generated by a factory function (`apps/api/src/routes/factory/create-routes.ts`) from a centralized registry (`apps/api/src/routes/registry.ts`). The registry defines each entity's table, allowed columns, searchable fields, and relationships. The factory produces standard GET (list), GET (single), POST (create), and PUT (update) endpoints.

Special routes that do not fit the CRUD pattern live in `apps/api/src/routes/extensions/`:
- `anatomy-import.ts` -- Spotify import preview and confirm
- `upload.ts` -- File upload endpoint
- `storage.ts` -- File serving endpoint
