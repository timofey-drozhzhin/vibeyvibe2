# vibeyvibe

A personal AI music management system for cataloging music collections, analyzing song anatomy, managing a song bin, and crafting AI prompts for Suno music generation.

## Architecture

```
                          +---------------------+
                          |   Bunny CDN / CDN    |
                          |   (Static Assets)    |
                          +----------+----------+
                                     |
                                     v
+------------------+        +--------+--------+        +-------------------+
|                  |  /api  |                 |  SQL   |                   |
|   Browser SPA    +------->+ Hono REST API   +------->+ SQLite / libSQL   |
|   (React 19)     |        | (Edge Worker)   |        | (Turso / Bunny)   |
|                  |<-------+                 |<-------+                   |
+------------------+  JSON  +--------+--------+        +-------------------+
                                     |
                                     v
                            +--------+--------+
                            | Bunny Edge      |
                            | Storage + CDN   |
                            | (Files)         |
                            +-----------------+
```

**Monorepo** managed with pnpm workspaces. Two apps live under `apps/`:

| App | Description | Dev Port | Production |
|-----|-------------|----------|------------|
| `apps/api` | Hono v4 REST API | `localhost:3001` | Bunny Edge Scripting |
| `apps/web` | Refine v5 + Mantine v8 SPA | `localhost:5173` | Bunny CDN |

The API serves all data through the `/api` prefix. During development, the Vite dev server proxies `/api` requests to the API backend.

The system uses a **registry-driven architecture**:
- A unified Drizzle schema defines all tables in one file with shared base columns
- An API route factory generates standard CRUD endpoints from entity configurations in a centralized registry
- A frontend entity registry drives all UI generation (routes, sidebar navigation, pages, forms, list columns)
- Two generic page components (list + show) handle all 14 entity types
- Extensions (Spotify import, ProfileEditor) are loaded for specific entities via the registry

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| API Framework | Hono | v4.7+ |
| Frontend Framework | Refine (headless) | v5.0+ |
| UI Library | Mantine | v8.3+ |
| React | React | v19.2+ |
| Router | React Router | v7.13+ |
| Database ORM | Drizzle ORM | v0.45+ |
| Database | SQLite (dev) / libSQL (prod) | -- |
| Auth | Better Auth | v1.4+ |
| Validation | Zod | v3.24+ |
| File Storage | Local filesystem (dev) / Bunny Edge Storage (prod) | -- |
| Build (API) | esbuild | v0.25+ |
| Build (Web) | Vite | v6.3+ |
| Testing | Vitest | v3.1+ |
| Runtime | Node.js 20+ (dev) / Bunny Edge Scripting (prod) | -- |
| Package Manager | pnpm (workspaces) | -- |
| Icons | @tabler/icons-react | v3.31+ |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)

### Setup

```bash
# 1. Clone the repository
git clone <repo-url> vibeyvibe
cd vibeyvibe

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.dev-example .env

# 4. Start development servers (auto-creates tmp/, pushes DB schema if needed)
pnpm dev
```

The web app will be available at `http://localhost:5173` and the API at `http://localhost:3001`.

> **Note:** `pnpm dev` automatically copies `.env.dev-example` to `.env` if missing, creates `tmp/storage/`, and runs `db:push` if the database doesn't exist.

With `DEV_AUTH_BYPASS=true` set in `.env`, authentication is bypassed during development. A synthetic "Dev User" is injected automatically.

## Environment Variables

All env variables are validated on startup via Zod (`apps/api/src/env.ts`). No defaults -- all values must be set in `.env`. See `.env.dev-example` and `.env.prod-example` for templates.

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Environment mode (`development`, `production`, `test`) |
| `DATABASE_URL` | Yes | SQLite file path (dev, relative to `apps/api`) or libSQL URL (prod) |
| `DATABASE_AUTH_TOKEN` | No | libSQL auth token for remote database |
| `BETTER_AUTH_SECRET` | Yes | Auth encryption secret (min 16 chars, 32+ recommended) |
| `BETTER_AUTH_URL` | Yes | Base URL for the auth system |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (enables Google sign-in) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `STORAGE_PROVIDER` | Yes | `local` (filesystem) or `bunny` (Bunny Edge Storage) |
| `STORAGE_LOCAL_PATH` | Yes | Path for local file storage (relative to API root) |
| `BUNNY_STORAGE_ZONE` | No | Bunny Edge Storage zone name |
| `BUNNY_STORAGE_PASSWORD` | No | Bunny Edge Storage access key |
| `BUNNY_STORAGE_REGION` | No | Bunny storage region hostname |
| `BUNNY_CDN_HOSTNAME` | No | Bunny CDN pull zone hostname |
| `BUNNY_CDN_SECURITY_KEY` | No | Bunny CDN URL signing key |
| `DEV_AUTH_BYPASS` | No | Set `true` to bypass auth in development |
| `FRONTEND_URL` | Yes | Frontend origin for CORS |

## Database

| Environment | Driver | Connection |
|-------------|--------|------------|
| Development | SQLite file | `tmp/local.db` (relative to workspace root) |
| Production | libSQL (Turso/Bunny) | `DATABASE_URL` + `DATABASE_AUTH_TOKEN` |

- ORM: **Drizzle ORM** with the libSQL driver
- All tables use **integer auto-increment** primary keys
- All column names use **snake_case** (e.g., `image_path`, `release_date`, `spotify_uid`)
- Foreign keys use `_id` suffix (e.g., `song_id`, `artist_id`)
- External platform identifiers use `_uid` suffix (e.g., `spotify_uid`, `apple_music_uid`, `youtube_uid`)
- Timestamps are `created_at` and `updated_at` (snake_case text columns with SQL `CURRENT_TIMESTAMP` defaults)
- All domain tables include an `archived` boolean flag (records are never deleted)
- Rating fields use a **0-1 real** scale (0 = unrated, values between 0 and 1 represent the rating)

### Shared Base Columns

A `baseEntityColumns` object provides shared columns to all entity tables:

```typescript
const baseEntityColumns = {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  context: text("context").notNull(),
  archived: integer("archived", { mode: "boolean" }).default(false),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
};
```

### Table Structure

Tables are unified. Shared entity tables use a `context` column to differentiate sections.

| Table | Context Values | Description |
|-------|---------------|-------------|
| `songs` | my_music, anatomy | Merged songs table with context column |
| `artists` | my_music, anatomy | Merged artists table |
| `albums` | my_music, anatomy | Merged albums table |
| `artist_songs` | -- | Pivot: artist<>song (composite PK) |
| `album_songs` | -- | Pivot: album<>song (composite PK) |
| `song_profiles` | anatomy | Anatomy profiles with JSON value column |
| `song_attributes` | anatomy | Analysis attributes by category |
| `bin_sources` | bin | Source playlists/channels |
| `bin_songs` | bin | Bin song entries |
| `suno_prompt_collections` | suno | Prompt collection groups |
| `suno_prompts` | suno | AI generation prompts |
| `suno_collection_prompts` | -- | Pivot: collection<>prompt (composite PK) |
| `suno_song_playlists` | suno | Generated song playlists |
| `suno_songs` | suno | Generated songs from Suno |
| Auth tables | -- | user, session, account, verification (Better Auth) |

All domain tables are defined in a single unified file: `apps/api/src/db/schema.ts`.

### Migration Workflow

1. Edit schema in `apps/api/src/db/schema.ts` (or `schema/auth.ts` for auth tables)
2. Push locally: `pnpm db:push` (development only, applies directly to local SQLite)
3. Generate migration: `pnpm db:generate` (creates SQL migration files)
4. Commit the schema changes and migration files
5. Migrate production: `pnpm db:migrate` (runs pending migrations)

**Never run `drizzle-kit push` against production.** Always use the generate + migrate workflow.

## Storage

| Environment | Provider | File Location | Public URL |
|-------------|----------|--------------|------------|
| Development | Local filesystem | `tmp/storage/` | `http://localhost:3001/api/storage/{path}` |
| Production | Bunny Edge Storage | Bunny Storage Zone | `https://{BUNNY_CDN_HOSTNAME}/{path}` |

Files are accessed through the `StorageClient` abstraction (`apps/api/src/services/storage/`), which provides:

- `upload(path, data, contentType)` -- Upload a file
- `download(path)` -- Download a file
- `getPublicUrl(path)` -- Get the public URL for a file
- `exists(path)` -- Check if a file exists

The upload endpoint (`POST /api/upload`) accepts multipart form data with:
- `file` -- The file to upload (max 10MB, image/* or audio/* only)
- `directory` -- Optional subdirectory (`artists`, `albums`, `songs`, `bin`)

## Application Sections

### My Music
Personal music library. Catalog songs, artists, and albums with industry identifiers (ISRC, ISNI, EAN), ratings (0-1 real scale), cover art, and links to Spotify, Apple Music, and YouTube. Songs can be assigned to artists and albums through junction tables.

### Anatomy
Song analysis workspace. Study reference songs, artists, and albums through structured attributes (tempo, mood, instrumentation, etc.) organized by category. Build anatomy profiles that map attribute values to songs. Profiles store a JSON object keyed by attribute name. Supports smart search across ISRC codes, ISNI identifiers, and names. Includes Spotify import to extract song metadata from track, album, or playlist URLs.

### Bin
Collection point for song discoveries. Track where songs come from via sources (playlists, channels, recommendations) and store raw audio assets. Each bin song can link to a source and hold an uploaded audio file.

### Suno Studio
AI music generation workflow. Craft text prompts with lyrics and style descriptions. Organize prompts into collections via a many-to-many pivot table. Track generation results from Suno, linking songs back to the prompts that produced them and optionally to bin songs for output storage. Prompts can reference anatomy profiles for style guidance.

## Project Structure

```
/
├── apps/
│   ├── api/                    # Hono backend API
│   │   ├── src/
│   │   │   ├── index.ts        # Dev entry point (Node.js server, port 3001)
│   │   │   ├── handler.ts      # Production entry point (Bunny Edge Scripting)
│   │   │   ├── app.ts          # Hono app: middleware, auth, route mounting
│   │   │   ├── env.ts          # Zod-validated environment variables
│   │   │   ├── auth/           # Better Auth configuration
│   │   │   ├── db/
│   │   │   │   ├── schema.ts   # Unified Drizzle schema (all 14 domain tables)
│   │   │   │   ├── schema/
│   │   │   │   │   ├── index.ts    # Re-exports schema.ts + auth.ts
│   │   │   │   │   └── auth.ts     # Better Auth tables
│   │   │   │   ├── migrations/ # Generated SQL migrations
│   │   │   │   ├── seed.ts     # Database seeder
│   │   │   │   └── seed-attributes.ts # Song attributes seeder (60+ categorized attributes)
│   │   │   ├── middleware/      # Auth, error, and rate limiting middleware
│   │   │   ├── routes/
│   │   │   │   ├── index.ts    # Assembles factory + extension routes under /api
│   │   │   │   ├── registry.ts # 14 entity-context configurations (tables, schemas, enrichers)
│   │   │   │   ├── factory/
│   │   │   │   │   ├── types.ts          # EntityRouteConfig types
│   │   │   │   │   └── create-routes.ts  # Generic CRUD route factory
│   │   │   │   └── extensions/
│   │   │   │       ├── anatomy-import.ts # Spotify import endpoints
│   │   │   │       ├── upload.ts         # File upload endpoint
│   │   │   │       └── storage.ts        # File serving endpoint
│   │   │   ├── services/
│   │   │   │   ├── spotify/   # Spotify metadata extraction service
│   │   │   │   └── storage/   # StorageClient (local + Bunny implementations)
│   │   │   ├── types/          # Type declarations (spotify-url-info)
│   │   │   └── validators/     # Zod validation schemas
│   │   ├── drizzle.config.ts   # Drizzle Kit configuration
│   │   └── package.json
│   └── web/                    # React SPA frontend
│       ├── src/
│       │   ├── main.tsx        # React entry point
│       │   ├── App.tsx         # Refine configuration and routing
│       │   ├── theme.ts        # Mantine theme (Poppins, violet)
│       │   ├── config/
│       │   │   └── entity-registry.ts  # Entity definitions driving all UI
│       │   ├── providers/
│       │   │   ├── auth-provider.ts    # Refine auth provider
│       │   │   └── data-provider.ts    # Refine REST data provider
│       │   ├── components/
│       │   │   ├── layout/     # Layout wrapper and dynamic sidebar navigation
│       │   │   ├── generic/    # Registry-driven components
│       │   │   │   ├── list-cell.tsx             # Table cell renderer
│       │   │   │   ├── field-row.tsx             # Detail field renderer
│       │   │   │   ├── aside-panel.tsx           # Right-side panel (image, embeds)
│       │   │   │   └── relationship-section.tsx  # M:N relationship management
│       │   │   ├── shared/     # Reusable components
│       │   │   └── anatomy/    # Anatomy-specific components (ProfileEditor)
│       │   ├── pages/
│       │   │   ├── login.tsx       # Login page
│       │   │   ├── dashboard.tsx   # Dashboard
│       │   │   ├── generic/
│       │   │   │   ├── list.tsx    # GenericEntityList (handles ALL entities)
│       │   │   │   └── show.tsx    # GenericEntityDetail (handles ALL entities)
│       │   │   └── anatomy/
│       │   │       └── import.tsx  # Spotify import (standalone page)
│       │   └── utils/          # Utility functions
│       ├── vite.config.ts      # Vite configuration with API proxy
│       └── package.json
├── tests/
│   └── e2e/                    # End-to-end test specs
├── tmp/                        # Temporary files (gitignored)
│   └── storage/                # Local file storage for dev
├── .devcontainer/              # Dev container configuration
├── .env.dev-example            # Development environment template
├── .env.prod-example           # Production environment template
├── package.json                # Root workspace scripts
├── pnpm-workspace.yaml         # pnpm workspace config
├── tsconfig.base.json          # Shared TypeScript base config
└── CLAUDE.md                   # AI assistant instructions
```

## Design Principles

- **Registry-Driven**: All entity CRUD is generated from configuration. Adding a new entity means adding a registry entry, not writing new route/page files. The API registry (`routes/registry.ts`) and frontend registry (`config/entity-registry.ts`) drive the entire system.
- **DRY Schema**: A `baseEntityColumns` object provides shared columns (id, name, context, archived, timestamps) to all entity tables. One schema file defines all 14 domain tables.
- **Context Filtering**: Shared tables (songs, artists, albums) use a `context` column to partition data between sections (my_music vs anatomy). The route factory automatically applies context filters.
- **No Deletes**: Records are archived (`archived = true` via PUT), never deleted. No DELETE HTTP methods exist.
- **Single User**: This is a personal tool. One user account. Auth protects the deployment.
- **Libraries Over Custom Code**: Use Refine hooks, Mantine components, Drizzle queries, and Zod schemas over bespoke implementations.
- **Input Validation**: All API endpoints validate with Zod via `@hono/zod-validator`. List query schemas are auto-generated by the route factory.
- **Edge-Ready**: The API bundle must work in a web-worker-like environment with no Node.js built-ins.

## Deployment Guide

### Bunny Edge Scripting (API)

The API deploys as a single JavaScript bundle to Bunny Edge Scripting.

```bash
# Build the production bundle
pnpm build:api
```

This produces `apps/api/dist/handler.js` -- a single ESM file using `bunny-hono` as the entry point adapter. The bundle must stay under the 1MB size limit.

**Production constraints:**
- No native Node.js modules (`fs`, `http`, `net`, etc.)
- Web-compatible APIs only (runs in a web-worker-like environment)
- Uses `@libsql/client/web` for database access on the edge
- All HTTP via `fetch`

**Deploy steps:**
1. Build: `pnpm build:api`
2. Upload `apps/api/dist/handler.js` to your Bunny Edge Scripting endpoint
3. Set environment variables in the Bunny dashboard:
   - `DATABASE_URL` -- Your libSQL connection string
   - `DATABASE_AUTH_TOKEN` -- Your libSQL auth token
   - `BETTER_AUTH_SECRET` -- A strong secret (32+ characters)
   - `BETTER_AUTH_URL` -- Your API domain (e.g., `https://api.yourdomain.com`)
   - `FRONTEND_URL` -- Your frontend domain (e.g., `https://yourdomain.com`)
   - `STORAGE_PROVIDER=bunny`
   - `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_PASSWORD`, `BUNNY_CDN_HOSTNAME`
   - Optionally: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` for OAuth

### Bunny CDN (Frontend)

The web app deploys as static files to Bunny CDN.

```bash
# Build the production bundle
pnpm build:web
```

This produces static files in `apps/web/dist/`.

**Deploy steps:**
1. Build: `pnpm build:web`
2. Upload the contents of `apps/web/dist/` to your Bunny CDN storage zone
3. Configure your CDN pull zone to serve from the storage zone
4. Set up a custom hostname if desired
5. Configure SPA routing: set the 404 page to `/index.html` so React Router handles all routes

**Build-time environment variables:**
- `VITE_API_URL` -- Set to your API domain (e.g., `https://api.yourdomain.com`). Leave empty if API and frontend share the same domain.
- `VITE_GOOGLE_CLIENT_ID` -- Set if Google OAuth is enabled

### Bunny libSQL (Database)

1. Create a libSQL database on Bunny (or use Turso)
2. Note the connection URL and auth token
3. Run migrations against production:
   ```bash
   DATABASE_URL="libsql://your-db-url" DATABASE_AUTH_TOKEN="your-token" pnpm db:migrate
   ```
4. Create the initial admin user by calling the Better Auth sign-up endpoint or seeding the database

### Bunny Edge Storage (File Uploads)

1. Create a Bunny Storage Zone for file uploads
2. Create a CDN Pull Zone linked to the storage zone
3. Note the zone name, access password, and CDN hostname
4. Set the corresponding `BUNNY_*` environment variables on the API

### Environment Variables for Production

A minimal production configuration:

```env
NODE_ENV=production
DATABASE_URL=libsql://your-db.bunny.net
DATABASE_AUTH_TOKEN=your-auth-token
BETTER_AUTH_SECRET=your-strong-secret-at-least-32-characters
BETTER_AUTH_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
STORAGE_PROVIDER=bunny
BUNNY_STORAGE_ZONE=your-zone-name
BUNNY_STORAGE_PASSWORD=your-access-key
BUNNY_CDN_HOSTNAME=your-cdn.b-cdn.net
```

## Commands Reference

All commands are run from the workspace root:

```bash
# Development
pnpm dev              # Start both API and web in parallel
pnpm dev:api          # Start API only (tsx watch, port 3001)
pnpm dev:web          # Start web only (Vite, port 5173)

# Build
pnpm build            # Build both apps
pnpm build:api        # Build API (esbuild bundle -> dist/handler.js)
pnpm build:web        # Build web (Vite -> dist/)

# Test
pnpm test             # Run all tests (vitest)
pnpm test:api         # Run API tests only
pnpm test:web         # Run web tests only

# Database
pnpm db:push          # Push schema to local SQLite (dev only)
pnpm db:generate      # Generate migration files from schema changes
pnpm db:migrate       # Run migrations (production)
pnpm db:studio        # Open Drizzle Studio GUI
pnpm db:seed          # Seed database with sample data

# Quality
pnpm lint             # Lint all packages
pnpm typecheck        # TypeScript type checking
```

## License

Private project. Not open source.
