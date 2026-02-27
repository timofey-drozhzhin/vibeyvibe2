# @vibeyvibe/api

REST API backend for the vibeyvibe AI Music Management System. Built with Hono v4, Drizzle ORM, and Better Auth. Deploys to Bunny Edge Scripting.

## Prerequisites

- **Node.js** 20 or later
- **pnpm** (workspace-aware package manager)

## Setup

1. **Install dependencies** (from workspace root):
   ```bash
   pnpm install
   ```

2. **Copy environment file** (from workspace root):
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables**:
   - Set `BETTER_AUTH_SECRET` to a random string (minimum 16 characters, recommend 32+)
   - Set `DEV_AUTH_BYPASS=true` for local development without authentication
   - Other defaults work for local development

4. **Initialize the database**:
   ```bash
   pnpm db:push
   ```

5. **Seed sample data** (optional):
   ```bash
   pnpm db:seed
   ```

6. **Start the development server**:
   ```bash
   pnpm dev:api
   ```
   The API starts on `http://localhost:3001`.

## Available Scripts

Run from the workspace root or from `apps/api/`:

| Command | Root Alias | Description |
|---------|-----------|-------------|
| `tsx watch src/index.ts` | `pnpm dev:api` | Start dev server with hot reload |
| `tsx src/esbuild.ts` | `pnpm build:api` | Bundle for Bunny Edge Scripting |
| `vitest run` | `pnpm test:api` | Run test suite |
| `vitest` | -- | Run tests in watch mode |
| `drizzle-kit push` | `pnpm db:push` | Push schema to local database |
| `drizzle-kit generate` | `pnpm db:generate` | Generate migration SQL files |
| `drizzle-kit migrate` | `pnpm db:migrate` | Run pending migrations |
| `drizzle-kit studio` | `pnpm db:studio` | Open Drizzle Studio GUI |
| `tsx src/db/seed.ts` | `pnpm db:seed` | Seed database with sample data |
| `tsc --noEmit` | -- | TypeScript type checking |

## API Routes

All routes are prefixed with `/api`. Authentication is required on all routes except health check and auth endpoints.

### System

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/sign-in/email` | No | Email/password login |
| POST | `/api/auth/sign-out` | No | Sign out |
| GET | `/api/auth/get-session` | No | Get current session |
| GET | `/api/auth/sign-in/social` | No | Social OAuth redirect |
| GET | `/api/dashboard/stats` | Yes | Dashboard statistics (record counts per section) |

### File Upload and Storage

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload` | Upload a file (multipart form data) |
| GET | `/api/storage/*` | Serve uploaded files by storage path |

**Upload endpoint details:**
- Accepts multipart form data with `file` field (required) and `directory` field (optional)
- Maximum file size: 10MB
- Allowed MIME types: `image/*` and `audio/*`
- Valid directories: `artists`, `albums`, `songs`, `bin`
- Generates a unique filename using nanoid
- Returns `{ path: string, url: string }` on success (HTTP 201)

**Storage endpoint details:**
- Serves files from the configured storage provider
- Sets `Cache-Control: public, max-age=31536000, immutable` for cached delivery
- Supports image formats (JPEG, PNG, GIF, WebP, SVG, ICO) and audio formats (MP3, WAV, OGG, FLAC, AAC, M4A, WMA)
- Returns 404 if the file does not exist

### My Music

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/my-music/songs` | List songs (paginated, searchable, sortable) |
| POST | `/api/my-music/songs` | Create song |
| GET | `/api/my-music/songs/:id` | Get song with linked artists and albums |
| PUT | `/api/my-music/songs/:id` | Update/archive song |
| POST | `/api/my-music/songs/:id/artists` | Assign artist to song (`{ artistId }`) |
| PUT | `/api/my-music/songs/:id/artists/:artistId` | Remove artist assignment |
| POST | `/api/my-music/songs/:id/albums` | Assign song to album (`{ albumId }`) |
| PUT | `/api/my-music/songs/:id/albums/:albumId` | Remove album assignment |
| GET | `/api/my-music/artists` | List artists (paginated) |
| POST | `/api/my-music/artists` | Create artist |
| GET | `/api/my-music/artists/:id` | Get artist by ID |
| PUT | `/api/my-music/artists/:id` | Update/archive artist |
| GET | `/api/my-music/albums` | List albums (paginated) |
| POST | `/api/my-music/albums` | Create album |
| GET | `/api/my-music/albums/:id` | Get album by ID |
| PUT | `/api/my-music/albums/:id` | Update/archive album |

### Lab

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/lab/songs` | List lab songs (smart search: ISRC, ISNI, name, artist name) |
| POST | `/api/lab/songs` | Create lab song |
| GET | `/api/lab/songs/:id` | Get song with active profile and linked artists |
| PUT | `/api/lab/songs/:id` | Update/archive lab song |
| GET | `/api/lab/songs/:id/profiles` | List all profiles for a song |
| POST | `/api/lab/songs/:id/profiles` | Create new profile version for a song |
| GET | `/api/lab/artists` | List lab artists |
| POST | `/api/lab/artists` | Create lab artist |
| GET | `/api/lab/artists/:id` | Get lab artist |
| PUT | `/api/lab/artists/:id` | Update/archive lab artist |
| GET | `/api/lab/attributes` | List attributes |
| POST | `/api/lab/attributes` | Create attribute |
| GET | `/api/lab/attributes/:id` | Get attribute |
| PUT | `/api/lab/attributes/:id` | Update/archive attribute |
| GET | `/api/lab/profiles` | List profiles (filterable by `songId` query param) |
| POST | `/api/lab/profiles` | Create profile (`{ songId, value }`) |
| GET | `/api/lab/profiles/:id` | Get profile (enriched with song name) |
| PUT | `/api/lab/profiles/:id` | Update/archive profile |
| POST | `/api/lab/import` | Preview: parse Spotify URL and return extracted tracks |
| POST | `/api/lab/import/confirm` | Confirm: create lab songs and artists from selected tracks |

### Bin

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bin/songs` | List bin songs |
| POST | `/api/bin/songs` | Create bin song |
| GET | `/api/bin/songs/:id` | Get bin song |
| PUT | `/api/bin/songs/:id` | Update/archive bin song |
| GET | `/api/bin/sources` | List bin sources |
| POST | `/api/bin/sources` | Create bin source |
| GET | `/api/bin/sources/:id` | Get bin source |
| PUT | `/api/bin/sources/:id` | Update/archive bin source |

### Suno Studio

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/suno/prompts` | List prompts (filterable by `voiceGender`) |
| POST | `/api/suno/prompts` | Create prompt |
| GET | `/api/suno/prompts/:id` | Get prompt |
| PUT | `/api/suno/prompts/:id` | Update/archive prompt |
| GET | `/api/suno/collections` | List collections |
| POST | `/api/suno/collections` | Create collection |
| GET | `/api/suno/collections/:id` | Get collection with assigned prompts |
| PUT | `/api/suno/collections/:id` | Update/archive collection |
| POST | `/api/suno/collections/:id/prompts` | Assign prompt to collection (`{ promptId }`) |
| PUT | `/api/suno/collections/:id/prompts/:promptId` | Manage prompt assignment |
| GET | `/api/suno/generations` | List generations |
| POST | `/api/suno/generations` | Create generation (`{ sunoId?, binSongId? }`) |
| GET | `/api/suno/generations/:id` | Get generation with assigned prompts |

### Query Parameters (List Endpoints)

All list endpoints accept standardized query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `pageSize` | number | 25 | Items per page (1-100) |
| `sort` | string | -- | Column to sort by (varies per resource) |
| `order` | string | `desc` | Sort direction (`asc` or `desc`) |
| `search` | string | -- | Text search filter (name, ISRC for lab) |
| `q` | string | -- | Alternative search parameter (lab songs) |
| `archived` | boolean | -- | Filter by archive status |

**Resource-specific parameters:**
- **Lab profiles**: `songId` (filter profiles by song)
- **Bin songs**: `sourceId` (filter by source)
- **Suno prompts**: `voiceGender` (filter by voice gender)

### Important: No DELETE Endpoints

This API has no DELETE endpoints. Records are archived by sending a PUT request with `{ "archived": true }` in the body. Junction table entries (song-artist, song-album, collection-prompt) are the only records that can be removed, and they use PUT endpoints for that operation.

## Database Schema

### Auth Tables (Better Auth managed)

- **user** -- User accounts (id, name, email, emailVerified, image, timestamps)
- **session** -- Active sessions (id, token, userId, expiresAt, timestamps)
- **account** -- OAuth accounts (id, providerId, userId, tokens, timestamps)
- **verification** -- Email verification tokens

### My Music Tables

| Table | Columns | Notes |
|-------|---------|-------|
| `my_songs` | id, isrc (unique), name, imagePath, releaseDate, rating, spotifyId, appleMusicId, youtubeId | ISRC optional |
| `my_artists` | id, isni (unique), name, imagePath, rating, spotifyId, youtubeUsername, tiktokUsername, instagramUsername | Social usernames with format validation |
| `my_albums` | id, ean (unique), name, imagePath, releaseDate, rating, spotifyId, appleMusicId, youtubeId | EAN: 13 digits |
| `my_song_artists` | id, songId, artistId | Junction table, unique composite index |
| `my_song_albums` | id, songId, albumId | Junction table, unique composite index |

### Lab Tables

| Table | Columns | Notes |
|-------|---------|-------|
| `anatomy_songs` | id, isrc (required, unique), name, imagePath, releaseDate (required), rating, spotifyId, appleMusicId, youtubeId | ISRC required for lab |
| `anatomy_artists` | id, isni (required, unique), name, imagePath, rating | ISNI required |
| `anatomy_song_artists` | id, songId, artistId | Junction table |
| `anatomy_attributes` | id, name (unique), category, description, instruction, examples | Defines analysis dimensions; category groups related attributes |
| `anatomy_profiles` | id, songId (FK, indexed), value (JSON string) | Stores `{"attribute_name": "value"}` |

### Bin Tables

| Table | Columns | Notes |
|-------|---------|-------|
| `bin_sources` | id, name, url | Discovery sources |
| `bin_songs` | id, name, sourceId (FK), assetPath, sourceUrl | assetPath links to uploaded audio |

### Suno Studio Tables

| Table | Columns | Notes |
|-------|---------|-------|
| `suno_prompts` | id, lyrics, style, voiceGender, notes, profileId (FK to anatomy_profiles), rating | Links to lab for style reference |
| `suno_collections` | id, name, description | Groups prompts |
| `suno_collection_prompts` | id, collectionId, promptId | Junction table |
| `suno_generations` | id, sunoId, binSongId (FK to bin_songs) | Links to bin for output storage |
| `suno_generation_prompts` | id, generationId, promptId | Junction table |

All domain tables also include: `archived` (boolean, default false), `createdAt`, `updatedAt`.

### Schema Conventions

- All primary keys are `text` (nanoid-generated strings)
- All domain tables have `archived` boolean (default `false`)
- All tables have `createdAt` and `updatedAt` timestamps (text columns with SQL `current_timestamp` default)
- Foreign keys use `.references()` for referential integrity
- Junction tables have unique composite indexes to prevent duplicate relationships

## Validation

Every route handler uses `@hono/zod-validator`. Schemas are defined in `src/validators/`:

| File | Schemas |
|------|---------|
| `my-music.ts` | `createSongSchema`, `updateSongSchema`, `createArtistSchema`, `updateArtistSchema`, `createAlbumSchema`, `updateAlbumSchema`, `assignArtistSchema`, `assignAlbumSchema`, `listQuerySchema` |
| `lab.ts` | `createLabSongSchema`, `updateLabSongSchema`, `createLabArtistSchema`, `updateLabArtistSchema`, `createAttributeSchema`, `updateAttributeSchema`, `createProfileSchema`, `updateProfileSchema`, `importUrlSchema`, `smartSearchSchema` |
| `bin.ts` | `createBinSongSchema`, `updateBinSongSchema`, `createBinSourceSchema`, `updateBinSourceSchema`, `importYoutubeSchema` |
| `suno.ts` | `createPromptSchema`, `updatePromptSchema`, `createCollectionSchema`, `updateCollectionSchema`, `assignPromptSchema`, `createGenerationSchema`, `assignGenerationPromptSchema` |

**Validation patterns:**
- ISRC: `/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/` (e.g., `USRC17607839`)
- ISNI: `/^\d{15}[\dX]$/` (16 digits, last may be X)
- EAN: `/^\d{13}$/` (13 digits)
- TikTok username: `/^@[a-zA-Z0-9_.]+$/`
- Instagram username: `/^[a-zA-Z0-9_.]{1,30}$/`
- YouTube username: `/^@[a-zA-Z0-9_.-]+$/`

## Storage

### StorageClient Interface

```typescript
interface StorageClient {
  upload(path: string, data: Buffer | ArrayBuffer | ReadableStream, contentType: string): Promise<void>;
  download(path: string): Promise<ArrayBuffer>;
  getPublicUrl(path: string): string;
  exists(path: string): Promise<boolean>;
}
```

### Implementations

| Provider | Class | Configuration |
|----------|-------|--------------|
| `local` | `LocalStorageClient` | Writes to `../../tmp/storage` relative to API root. Files served at `/api/storage/*`. |
| `bunny` | `BunnyStorageClient` | Bunny Edge Storage HTTP API for uploads/downloads, Bunny CDN for public URLs. |

Set via `STORAGE_PROVIDER` environment variable. The factory (`createStorageClient()`) validates required Bunny credentials when using the Bunny provider.

## Migration Workflow

### Local Development
```bash
# After editing schema files in src/db/schema/:
pnpm db:push          # Apply changes directly to local SQLite
```

### Production Deployment
```bash
# After editing schema files:
pnpm db:push          # Test locally first
pnpm db:generate      # Generate migration SQL files
git add .             # Commit schema + migration files
git commit -m "Add new schema changes"

# With production credentials:
DATABASE_URL="libsql://your-db" DATABASE_AUTH_TOKEN="token" pnpm db:migrate
```

**WARNING**: Never run `drizzle-kit push` against a production database. Always use the generate + migrate workflow.

## Deployment to Bunny Edge Scripting

### Build

```bash
pnpm build:api
```

This runs `tsx src/esbuild.ts`, producing `dist/handler.js` -- a single ESM bundle optimized for edge runtime. The entry point (`src/handler.ts`) uses `bunny-hono`'s `standaloneHandler` adapter.

### Bundle Constraints

- Maximum 1MB bundle size
- No Node.js native modules (`fs`, `http`, `net`, etc.)
- Web-compatible APIs only (`fetch`, `Request`, `Response`, etc.)
- Uses `@libsql/client/web` for database access on the edge
- Target: ES2022, platform: browser

### Production Environment Variables

Set these in the Bunny Edge Scripting dashboard:

```env
NODE_ENV=production
DATABASE_URL=libsql://your-db-url
DATABASE_AUTH_TOKEN=your-auth-token
BETTER_AUTH_SECRET=your-strong-secret-32-chars-minimum
BETTER_AUTH_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
STORAGE_PROVIDER=bunny
BUNNY_STORAGE_ZONE=your-zone-name
BUNNY_STORAGE_PASSWORD=your-access-key
BUNNY_CDN_HOSTNAME=your-cdn.b-cdn.net
```

Optional:
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for OAuth
- `BUNNY_STORAGE_REGION` if not using the default `storage.bunnycdn.com`
- `BUNNY_CDN_SECURITY_KEY` for URL signing

## Testing

- **Framework**: Vitest
- **Pattern**: Use `app.request()` for route integration tests. Import the Hono app from `app.ts` and call `app.request(url, options)` to simulate HTTP requests without starting a server.
- **Run**: `pnpm test` (from API directory) or `pnpm test:api` (from root)
- **Watch mode**: `pnpm test:watch`
