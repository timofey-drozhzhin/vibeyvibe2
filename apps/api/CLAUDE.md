# vibeyvibe API

Hono v4 REST API backend for the vibeyvibe music management system. Deploys to Bunny Edge Scripting as a single bundled file.

## Overview

The API is a Hono application that serves all data at the `/api` prefix. It uses Drizzle ORM with SQLite/libSQL for persistence, Better Auth for authentication, and Zod for request validation. The server runs on Node.js locally (via `@hono/node-server`) and deploys as an edge function to Bunny Edge Scripting.

## Directory Structure

```
src/
├── index.ts              # Entry point: loads .env, starts @hono/node-server on port 3001
├── app.ts                # Hono app setup: middleware stack, auth handler, route mounting
├── env.ts                # Zod-validated environment variable schema and getEnv() singleton
├── auth/
│   └── index.ts          # Better Auth configuration (Drizzle adapter, Google OAuth, email/password)
├── db/
│   ├── index.ts          # Drizzle client factory with libSQL driver (getDb() singleton)
│   ├── seed.ts           # Database seeding script (run via pnpm db:seed)
│   └── schema/
│       ├── index.ts      # Re-exports all schema modules
│       ├── auth.ts       # Better Auth tables: user, session, account, verification
│       ├── my-music.ts   # My Music tables: my_songs, my_artists, my_albums, my_song_artists, my_song_albums
│       ├── anatomy.ts    # Anatomy tables: anatomy_songs, anatomy_artists, anatomy_song_artists, anatomy_attributes, anatomy_profiles
│       ├── bin.ts         # Bin tables: bin_sources, bin_songs
│       └── suno-studio.ts # Suno tables: suno_prompts, suno_collections, suno_collection_prompts, suno_generations, suno_generation_prompts
├── middleware/
│   ├── auth.ts           # Auth middleware: session validation, dev bypass, route skipping for /api/auth/*
│   └── error.ts          # Global error handler: HTTPException mapping, 500 fallback
├── routes/
│   ├── index.ts          # Route registry: mounts all sub-routers under /api
│   ├── my-music/
│   │   ├── songs.ts      # CRUD for my_songs + artist/album assignment
│   │   ├── artists.ts    # CRUD for my_artists
│   │   └── albums.ts     # CRUD for my_albums
│   ├── anatomy/
│   │   ├── songs.ts      # CRUD for anatomy_songs + artist assignment
│   │   ├── artists.ts    # CRUD for anatomy_artists
│   │   ├── attributes.ts # CRUD for anatomy_attributes
│   │   ├── profiles.ts   # CRUD for anatomy_profiles
│   │   └── import.ts     # Anatomy import endpoint
│   ├── bin/
│   │   ├── songs.ts      # CRUD for bin_songs
│   │   └── sources.ts    # CRUD for bin_sources
│   └── suno/
│       ├── prompts.ts    # CRUD for suno_prompts
│       ├── collections.ts # CRUD for suno_collections + prompt assignment
│       └── generations.ts # CRUD for suno_generations + prompt assignment
├── services/
│   └── storage/
│       ├── index.ts      # StorageClient interface + factory (createStorageClient)
│       ├── local.ts      # LocalStorageClient: filesystem-based storage for development
│       └── bunny.ts      # BunnyStorageClient: Bunny Edge Storage for production
└── validators/
    └── my-music.ts       # Zod schemas for My Music routes (songs, artists, albums, list params)
```

## Schema Rules

### Table Naming
All tables are prefixed by section:
- `my_` for My Music
- `anatomy_` for Anatomy
- `bin_` for Bin
- `suno_` for Suno Studio
- Auth tables (user, session, account, verification) are unprefixed as they follow Better Auth conventions.

### Primary Keys
All tables use `text("id").primaryKey()` with nanoid-generated string IDs. Never use auto-incrementing integer IDs.

### Timestamps
Every table includes:
- `createdAt` -- Set to `current_timestamp` by default
- `updatedAt` -- Set to `current_timestamp` by default (must be updated on every write)

Domain tables use `text` columns with SQL `current_timestamp` defaults. Auth tables use `integer` columns with `{ mode: "timestamp" }` as required by Better Auth.

### Archive Flag
Every domain table includes `archived: integer("archived", { mode: "boolean" }).default(false).notNull()`. Records are never deleted; they are archived.

### Foreign Keys
Junction/relationship tables use `.references(() => parentTable.id)` for referential integrity. Unique composite indexes prevent duplicate relationships (e.g., `my_song_artists_unique` on `(songId, artistId)`).

## Route Conventions

### RESTful Patterns
All routes are mounted under `/api`. Route structure follows the pattern:

| Method | Path                              | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | /api/{section}/{resource}         | List with pagination/filtering |
| GET    | /api/{section}/{resource}/:id     | Get single record              |
| POST   | /api/{section}/{resource}         | Create new record              |
| PUT    | /api/{section}/{resource}/:id     | Update record (including archive) |

### No DELETE Endpoints
There are no DELETE endpoints. To "delete" a record, send a PUT request with `{ archived: true }`. This is enforced project-wide.

### CORS
Only GET, POST, PUT, and OPTIONS methods are allowed. The CORS configuration explicitly omits DELETE.

### Allowed Methods in app.ts
```typescript
allowMethods: ["GET", "POST", "PUT", "OPTIONS"]
```

### Special Routes
- `GET /api/health` -- Health check (unauthenticated)
- `POST|GET /api/auth/*` -- Better Auth handler (unauthenticated)
- `GET /api/dashboard/stats` -- Dashboard statistics

### List Endpoint Query Parameters
All list endpoints accept standardized query parameters validated by `listQuerySchema`:
- `page` (number, default: 1)
- `pageSize` (number, 1-100, default: 25)
- `sort` (string, column name)
- `order` ("asc" | "desc", default: "desc")
- `search` (string, optional text search)
- `archived` (boolean, filter by archive status)

## Validation

Every route handler uses `@hono/zod-validator` with schemas defined in the `validators/` directory. Validation is applied to:

- **Request body** (POST/PUT): `zValidator("json", createSchema)` or `zValidator("json", updateSchema)`
- **Query parameters** (GET list): `zValidator("query", listQuerySchema)`

Update schemas are typically `.partial()` extensions of create schemas with an additional `archived` boolean field.

Example validator schemas in `validators/my-music.ts`:
- `createSongSchema` / `updateSongSchema` -- Song CRUD validation
- `createArtistSchema` / `updateArtistSchema` -- Artist CRUD validation (ISNI, social usernames)
- `createAlbumSchema` / `updateAlbumSchema` -- Album CRUD validation (EAN)
- `assignArtistSchema` / `assignAlbumSchema` -- Relationship assignment validation
- `listQuerySchema` -- Pagination and filtering parameters

When adding new routes, always create corresponding Zod schemas in `validators/` and apply them with `zValidator`.

## Authentication

### Better Auth Setup
Authentication is handled by Better Auth configured in `auth/index.ts`:
- **Adapter**: Drizzle adapter with SQLite provider
- **Methods**: Email/password (always enabled) + Google OAuth (optional, enabled when credentials provided)
- **Session**: Cookie-based with 5-minute cookie cache
- **Tables**: user, session, account, verification (defined in `db/schema/auth.ts`)

### Auth Middleware
The auth middleware (`middleware/auth.ts`) runs on all `/api/*` routes with these exceptions:
- `/api/auth/*` routes are skipped (Better Auth handles its own authentication)
- `/api/health` is defined before the middleware and is unauthenticated

The middleware:
1. Checks for the dev bypass condition
2. Calls Better Auth's `getSession` API
3. Sets `user` and `session` context variables on the Hono context
4. Returns 401 if no valid session exists

### Dev Auth Bypass
For local development, authentication can be bypassed entirely. This requires a **double guard**:
- `DEV_AUTH_BYPASS=true` must be set in environment variables
- `NODE_ENV` must NOT be `"production"`

Both conditions must be true. If either is false, real authentication is required. The bypass injects a synthetic "Dev User" with ID `dev-user-1`.

## Storage

### StorageClient Abstraction
All file operations go through the `StorageClient` interface (`services/storage/index.ts`):

```typescript
interface StorageClient {
  upload(path: string, data: Buffer | ArrayBuffer | ReadableStream, contentType: string): Promise<void>;
  download(path: string): Promise<ArrayBuffer>;
  getPublicUrl(path: string): string;
  exists(path: string): Promise<boolean>;
}
```

### Implementations
- **LocalStorageClient**: Writes to the local filesystem at `../../tmp/storage` (relative to API root). Serves files through `/api/storage/*`. Used when `STORAGE_PROVIDER=local`.
- **BunnyStorageClient**: Uses Bunny Edge Storage HTTP API for uploads/downloads and Bunny CDN for public URLs. Used when `STORAGE_PROVIDER=bunny`.

### Factory
Call `createStorageClient()` to get the correct implementation based on the `STORAGE_PROVIDER` environment variable. The factory validates that required Bunny credentials are present when using the Bunny provider.

## Migration Workflow

1. **Edit schema**: Modify files in `src/db/schema/`
2. **Push locally**: `pnpm db:push` -- Applies changes directly to local SQLite (development only)
3. **Generate migration**: `pnpm db:generate` -- Creates SQL migration files from schema diff
4. **Commit**: Commit the schema changes and generated migration files
5. **Migrate production**: `pnpm db:migrate` -- Runs pending migrations on the production database

**CRITICAL**: Never run `drizzle-kit push` against production. Always use the generate + migrate workflow for production databases.

## Testing

- Framework: Vitest
- Run: `pnpm test` (from API directory) or `pnpm test:api` (from root)
- Watch mode: `pnpm test:watch`
- Pattern: Use `app.request()` for route integration tests. Import the Hono app from `app.ts` and call `app.request(url, options)` to simulate HTTP requests without starting a server.

## Edge Deployment Constraints

The API deploys to Bunny Edge Scripting, which has specific constraints:

- **Bundle size limit**: 1MB maximum. The esbuild configuration in `src/esbuild.ts` produces a single bundled file.
- **No native Node.js modules**: Cannot use `fs`, `http`, `net`, or other Node-built-in modules in production. Use `fetch` for HTTP and `@libsql/client/web` for database access on the edge.
- **Web-compatible APIs only**: All code must work in a web-worker-like environment. The local dev server uses `@hono/node-server` but production runs in an edge runtime.
- **Database client**: Use `@libsql/client` (which supports both local file and remote libSQL). On the edge, the `/web` subpath import is used automatically.

## Environment Variables

| Variable               | Required | Default                    | Description                          |
|------------------------|----------|----------------------------|--------------------------------------|
| NODE_ENV               | No       | development                | Environment mode                     |
| DATABASE_URL           | No       | file:./local.db            | SQLite file path or libSQL URL       |
| DATABASE_AUTH_TOKEN    | No       | --                         | libSQL auth token (production)       |
| BETTER_AUTH_SECRET     | Yes      | --                         | Auth encryption secret (min 16 chars)|
| BETTER_AUTH_URL        | Yes      | --                         | Auth base URL                        |
| GOOGLE_CLIENT_ID       | No       | --                         | Google OAuth client ID               |
| GOOGLE_CLIENT_SECRET   | No       | --                         | Google OAuth client secret           |
| STORAGE_PROVIDER       | No       | local                      | "local" or "bunny"                   |
| STORAGE_LOCAL_PATH     | No       | ../../tmp/storage          | Local storage directory              |
| BUNNY_STORAGE_ZONE     | Bunny    | --                         | Bunny storage zone name              |
| BUNNY_STORAGE_PASSWORD | Bunny    | --                         | Bunny storage access key             |
| BUNNY_STORAGE_REGION   | No       | storage.bunnycdn.com       | Bunny storage region hostname        |
| BUNNY_CDN_HOSTNAME     | Bunny    | --                         | Bunny CDN pull zone hostname         |
| BUNNY_CDN_SECURITY_KEY | No       | --                         | Bunny CDN security key               |
| DEV_AUTH_BYPASS        | No       | --                         | Set "true" to bypass auth in dev     |
| FRONTEND_URL           | No       | http://localhost:5173       | Frontend origin for CORS             |
