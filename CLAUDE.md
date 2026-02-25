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
├── .env.example          # Environment variable template
└── .gitignore            # Global ignore rules
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

### No Deletes -- Archive Only
There are NO delete operations anywhere in the system. Every record that needs to be "removed" is archived by setting `archived = true` via a PUT request. No DELETE HTTP methods exist. No delete buttons exist in the UI.

### Single User System
This is a personal tool. There is no registration flow after initial setup. Only one user account exists. Auth exists to protect the deployment, not to manage multiple users.

### Database Table Prefixes
All database tables are prefixed by their section:
- `my_` -- My Music (my_songs, my_artists, my_albums, my_song_artists, my_song_albums)
- `anatomy_` -- Anatomy (anatomy_songs, anatomy_artists, anatomy_song_artists, anatomy_attributes, anatomy_profiles)
- `bin_` -- Bin (bin_sources, bin_songs)
- `suno_` -- Suno Studio (suno_prompts, suno_collections, suno_collection_prompts, suno_generations, suno_generation_prompts)
- Auth tables (user, session, account, verification) are managed by Better Auth and have no prefix.

### Temporary Files
All temporary files go in `./tmp/` (gitignored). Local dev storage lives at `./tmp/storage/`. MCP Playwright outputs (screenshots, PDFs) go in `./tmp/playwright/`.

### Documentation
Always document structural changes in CLAUDE.md files. Keep these files up to date when adding new routes, schemas, pages, or changing conventions.

### Structural Notes for Context Continuity
`./tmp/DOCUMENTATIONS.md` is your temporary memory for CLAUDE.md and README.md documents. Update it before starting changes, and read it back after context compaction, to resume without losing important knowledge.

### Libraries Over Hand-Made Solutions
Use well-maintained libraries instead of writing custom implementations. Prefer established solutions (Refine hooks, Mantine components, Drizzle queries, Zod schemas) over bespoke code.

### Latest Versions
Use the latest stable versions of all tools and dependencies. Current baseline versions are specified in each app's package.json.

### Input Validation
All API endpoints must validate input with Zod using `@hono/zod-validator`. Every route handler validates both request body (POST/PUT) and query parameters (GET list endpoints).

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

1. Copy `.env.example` to `.env` at the workspace root:
   ```bash
   cp .env.example .env
   ```
2. For local development, the defaults work out of the box. Set `DEV_AUTH_BYPASS=true` to skip authentication during development.
3. Generate a strong `BETTER_AUTH_SECRET` (minimum 16 characters, use 32+ in production).
4. The `FRONTEND_URL` defaults to `http://localhost:5173` and `BETTER_AUTH_URL` defaults to `http://localhost:3001`.

## Database

- **Development**: Local SQLite file at `tmp/local.db` (relative to workspace root, gitignored). Created automatically on first `db:push`.
- **Production**: Bunny libSQL remote database. Set `DATABASE_URL` to the libSQL connection string and provide `DATABASE_AUTH_TOKEN`.
- ORM: Drizzle ORM with the libSQL driver.
- All tables use `text` primary keys with nanoid-generated IDs.
- All tables include `createdAt` and `updatedAt` timestamp columns.

### Seeding

- `pnpm db:seed` -- Seeds the database with sample data (runs `apps/api/src/db/seed.ts`).
- `apps/api/src/db/seed-attributes.ts` -- Standalone script to seed the `anatomy_attributes` table with a comprehensive set of 60+ analysis attributes grouped by category. Run directly via `tsx apps/api/src/db/seed-attributes.ts` from the API directory.

### Notable Schema Details

- **anatomy_attributes** includes a `category` column (text, nullable) for grouping attributes (e.g., "genre", "structure", "composition", "rhythm", "instrumentation", "vocals", "lyrics", "production", "mood", "energy", "signature").

## Storage

- **Development**: Local filesystem at `tmp/storage/` (relative to workspace root). Files are served through the API at `/api/storage/*`.
- **Production**: Bunny Edge Storage with Bunny CDN for public URLs. Configure `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_PASSWORD`, `BUNNY_STORAGE_REGION`, `BUNNY_CDN_HOSTNAME`.
- Storage is accessed through the `StorageClient` abstraction (`services/storage/`), which provides `upload`, `download`, `getPublicUrl`, and `exists` methods.

## Fonts

- **Righteous** -- Used for the brand/logo text ("vibeyvibe" in the sidebar and login page).
- **Poppins** -- Used for all body text and headings throughout the application.
- Both are loaded from Google Fonts in `index.html`.

## Application Sections

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
4. `POST /api/anatomy/import/confirm` creates `anatomy_songs` and `anatomy_artists` records from the selected tracks, with duplicate detection by Spotify ID and ISRC. Also downloads cover art images to storage (`songs/{nanoid}.jpg`, `artists/{nanoid}.jpg`) and updates `imagePath` on created records.

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

Anatomy profiles store structured analysis data as JSON objects keyed by attribute name (e.g., `{"Tempo": "120 BPM", "Mood": "melancholic"}`).

### API Routes
- `GET /api/anatomy/profiles` -- List profiles (filterable by `songId`)
- `POST /api/anatomy/profiles` -- Create profile (`{ songId, value }` where value is a JSON string)
- `GET /api/anatomy/profiles/:id` -- Get profile (enriched with song name)
- `PUT /api/anatomy/profiles/:id` -- Update/archive profile
- `GET /api/anatomy/songs/:id/profiles` -- List all profiles for a song
- `POST /api/anatomy/songs/:id/profiles` -- Create new profile version for a song

### ProfileEditor Component
The `ProfileEditor` component (`components/anatomy/profile-editor.tsx`) fetches all active attributes and renders a textarea for each one. Supports creating new profiles and editing existing ones. Used on the Anatomy Song show page.

## Import Functionality

### POST /api/anatomy/import
Accepts a Spotify URL and returns a preview of extracted track metadata using the Spotify import service. Validates that the URL is a supported Spotify URL (`open.spotify.com`, `spotify.link`). Returns track name, artists, album, release date, ISRC, image URL, and Spotify ID.

**Schema**: `{ url: string }` (must be a valid URL)

### POST /api/anatomy/import/confirm
Accepts an array of tracks (from the preview step) and creates `anatomy_songs` and `anatomy_artists` records. Skips duplicates by Spotify ID or ISRC. Artists are matched case-insensitively by name; new artists receive placeholder ISNI values.

**Schema**: `{ tracks: [{ name, artists: [{name}], album?, releaseDate?, isrc?, imageUrl?, spotifyId }] }`

## Relationship Assignment Routes

Songs can be assigned to artists and albums through junction tables:

### My Music
- `POST /api/my-music/songs/:id/artists` -- Assign artist (`{ artistId }`)
- `PUT /api/my-music/songs/:id/artists/:artistId` -- Remove artist assignment
- `POST /api/my-music/songs/:id/albums` -- Assign album (`{ albumId }`)
- `PUT /api/my-music/songs/:id/albums/:albumId` -- Remove album assignment

### Suno Studio
- `POST /api/suno/collections/:id/prompts` -- Assign prompt (`{ promptId }`)
- `PUT /api/suno/collections/:id/prompts/:promptId` -- Manage prompt assignment

## Shared UI Components

Located in `apps/web/src/components/shared/`:

| Component | File | Description |
|-----------|------|-------------|
| `FileUpload` | `file-upload.tsx` | File upload widget that POSTs to `/api/upload` and returns the storage path. Supports accept filter and directory parameter. |
| `ImagePreview` | `image-preview.tsx` | Displays an image from storage path, or a placeholder icon when no path is set. Configurable size. |
| `AudioPlayer` | `audio-player.tsx` | HTML5 audio player that plays files from storage. Shows "no audio" placeholder when path is null. |
| `AssignModal` | `assign-modal.tsx` | Modal with searchable dropdown for assigning relationships (artist to song, prompt to collection, etc.). |
| `SortableHeader` | `sortable-header.tsx` | Clickable table header cell with sort direction arrow indicator. |
| `ListToolbar` | `list-toolbar.tsx` | Shared toolbar with search input and archive status segmented control (Active/All/Archived). |
| `RatingField` | `rating-field.tsx` | Interactive star rating (0-5 whole stars, 0=unrated shows "--"). Click same star to reset. Also exports `RatingDisplay`. |
| `ArchiveButton` | `archive-toggle.tsx` | Red "Archive" / green "Restore" button with confirmation Modal. Also exports `ArchiveBadge` (green "Active" / red "Archived" badge). |
| `PlatformLinks` | `platform-links.tsx` | Spotify/Apple Music/YouTube icon buttons that open external URLs. Used in table Actions columns. |
| `MediaEmbeds` | `media-embeds.tsx` | Spotify (300x90), Apple Music (300x140), YouTube (300x169) iframe embeds in a 300px Stack. Used on song show pages. |

### Anatomy Components

Located in `apps/web/src/components/anatomy/`:

| Component | File | Description |
|-----------|------|-------------|
| `ProfileEditor` | `profile-editor.tsx` | Form for creating/editing anatomy profiles. Fetches all active attributes and renders a textarea per attribute. Saves as JSON. |

## API Validation Schemas

Located in `apps/api/src/validators/`:

| File | Schemas |
|------|---------|
| `my-music.ts` | `createSongSchema`, `updateSongSchema`, `createArtistSchema`, `updateArtistSchema`, `createAlbumSchema`, `updateAlbumSchema`, `assignArtistSchema`, `assignAlbumSchema`, `listQuerySchema` |
| `anatomy.ts` | `createAnatomySongSchema`, `updateAnatomySongSchema`, `createAnatomyArtistSchema`, `updateAnatomyArtistSchema`, `createAttributeSchema`, `updateAttributeSchema`, `createProfileSchema`, `updateProfileSchema`, `importUrlSchema`, `smartSearchSchema` |
| `bin.ts` | `createBinSongSchema`, `updateBinSongSchema`, `createBinSourceSchema`, `updateBinSourceSchema`, `importYoutubeSchema` |
| `suno.ts` | `createPromptSchema`, `updatePromptSchema`, `createCollectionSchema`, `updateCollectionSchema`, `assignPromptSchema`, `createGenerationSchema`, `assignGenerationPromptSchema` |
