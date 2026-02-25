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
cp .env.example .env

# 4. Push database schema (creates local SQLite file)
pnpm db:push

# 5. Seed the database with sample data
pnpm db:seed

# 6. Start development servers
pnpm dev
```

The web app will be available at `http://localhost:5173` and the API at `http://localhost:3001`.

With `DEV_AUTH_BYPASS=true` set in `.env` (the default), authentication is bypassed during development. A synthetic "Dev User" is injected automatically.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode (`development` or `production`) |
| `DATABASE_URL` | No | `file:./local.db` | SQLite file path (dev) or libSQL URL (prod) |
| `DATABASE_AUTH_TOKEN` | Prod | -- | libSQL auth token for remote database |
| `BETTER_AUTH_SECRET` | Yes | -- | Auth encryption secret (min 16 chars, 32+ recommended) |
| `BETTER_AUTH_URL` | Yes | `http://localhost:3001` | Base URL for the auth system |
| `GOOGLE_CLIENT_ID` | No | -- | Google OAuth client ID (enables Google sign-in) |
| `GOOGLE_CLIENT_SECRET` | No | -- | Google OAuth client secret |
| `STORAGE_PROVIDER` | No | `local` | `local` (filesystem) or `bunny` (Bunny Edge Storage) |
| `STORAGE_LOCAL_PATH` | No | `../../tmp/storage` | Path for local file storage (relative to API root) |
| `BUNNY_STORAGE_ZONE` | Bunny | -- | Bunny Edge Storage zone name |
| `BUNNY_STORAGE_PASSWORD` | Bunny | -- | Bunny Edge Storage access key |
| `BUNNY_STORAGE_REGION` | No | `storage.bunnycdn.com` | Bunny storage region hostname |
| `BUNNY_CDN_HOSTNAME` | Bunny | -- | Bunny CDN pull zone hostname |
| `BUNNY_CDN_SECURITY_KEY` | No | -- | Bunny CDN URL signing key |
| `DEV_AUTH_BYPASS` | No | -- | Set `true` to bypass auth in development |
| `FRONTEND_URL` | No | `http://localhost:5173` | Frontend origin for CORS |
| `VITE_API_URL` | No | `""` | API base URL for the web app (empty = same origin) |
| `VITE_GOOGLE_CLIENT_ID` | No | -- | Google OAuth client ID (enables OAuth button in UI) |

## Database

| Environment | Driver | Connection |
|-------------|--------|------------|
| Development | SQLite file | `file:./local.db` (relative to `apps/api`) |
| Production | libSQL (Turso/Bunny) | `DATABASE_URL` + `DATABASE_AUTH_TOKEN` |

- ORM: **Drizzle ORM** with the libSQL driver
- All tables use `text` primary keys with nanoid-generated IDs
- All tables include `createdAt` and `updatedAt` timestamp columns
- All domain tables include an `archived` boolean flag (records are never deleted)

### Table Prefixes

| Prefix | Section | Tables |
|--------|---------|--------|
| `my_` | My Music | `my_songs`, `my_artists`, `my_albums`, `my_song_artists`, `my_song_albums` |
| `anatomy_` | Anatomy | `anatomy_songs`, `anatomy_artists`, `anatomy_song_artists`, `anatomy_attributes`, `anatomy_profiles` |
| `bin_` | Bin | `bin_sources`, `bin_songs` |
| `suno_` | Suno Studio | `suno_prompts`, `suno_collections`, `suno_collection_prompts`, `suno_generations`, `suno_generation_prompts` |
| (none) | Auth | `user`, `session`, `account`, `verification` (managed by Better Auth) |

### Migration Workflow

1. Edit schema files in `apps/api/src/db/schema/`
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
Personal music library. Catalog songs, artists, and albums with industry identifiers (ISRC, ISNI, EAN), ratings (0-10), cover art, and links to Spotify, Apple Music, and YouTube. Songs can be assigned to artists and albums through junction tables.

### Anatomy
Song analysis workspace. Study reference songs through structured attributes (tempo, mood, instrumentation, etc.) organized by category. Build anatomy profiles that map attribute values to songs. Profiles store a JSON object keyed by attribute name. Supports smart search across ISRC codes, ISNI identifiers, and names. Includes Spotify import to extract song metadata from track, album, or playlist URLs.

### Bin
Collection point for song discoveries. Track where songs come from via sources (playlists, channels, recommendations) and store raw audio assets. Each bin song can link to a source and hold an uploaded audio file.

### Suno Studio
AI music generation workflow. Craft text prompts with lyrics, style descriptions, and voice gender. Organize prompts into collections. Track generation results from Suno, linking back to the prompts that produced them and optionally to bin songs for output storage. Prompts can reference anatomy profiles for style guidance.

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
│   │   │   │   ├── schema/     # Drizzle schema definitions
│   │   │   │   ├── migrations/ # Generated SQL migrations
│   │   │   │   ├── seed.ts     # Database seeder
│   │   │   │   └── seed-attributes.ts # Anatomy attribute seeder (60+ categorized attributes)
│   │   │   ├── middleware/      # Auth, error, and rate limiting middleware
│   │   │   ├── routes/          # API route handlers
│   │   │   │   ├── my-music/   # Songs, artists, albums
│   │   │   │   ├── anatomy/    # Songs, artists, attributes, profiles, import
│   │   │   │   ├── bin/        # Songs, sources
│   │   │   │   ├── suno/       # Prompts, collections, generations
│   │   │   │   ├── upload.ts   # File upload endpoint
│   │   │   │   └── storage.ts  # File serving endpoint
│   │   │   ├── services/
│   │   │   │   ├── spotify/   # Spotify metadata extraction service
│   │   │   │   └── storage/   # StorageClient (local + Bunny implementations)
│   │   │   └── validators/      # Zod validation schemas
│   │   ├── drizzle.config.ts   # Drizzle Kit configuration
│   │   └── package.json
│   └── web/                    # React SPA frontend
│       ├── src/
│       │   ├── main.tsx        # React entry point
│       │   ├── App.tsx         # Refine configuration and routing
│       │   ├── theme.ts        # Mantine theme (Poppins, violet)
│       │   ├── providers/
│       │   │   ├── auth-provider.ts   # Refine auth provider
│       │   │   └── data-provider.ts   # Refine REST data provider
│       │   ├── components/
│       │   │   ├── layout/     # Layout wrapper and sidebar navigation
│       │   │   ├── shared/     # Reusable components
│       │   │   └── anatomy/    # Anatomy-specific components
│       │   ├── pages/          # CRUD pages by section
│       │   │   ├── my-music/   # songs/, artists/, albums/
│       │   │   ├── anatomy/    # songs/, artists/, attributes/
│       │   │   ├── bin/        # songs/, sources/
│       │   │   └── suno/       # prompts/, collections/, generations/
│       │   └── utils/          # Utility functions
│       ├── vite.config.ts      # Vite configuration with API proxy
│       └── package.json
├── tests/
│   └── e2e/                    # End-to-end test specs
├── tmp/                        # Temporary files (gitignored)
│   └── storage/                # Local file storage for dev
├── .devcontainer/              # Dev container configuration
├── .env.example                # Environment variable template
├── package.json                # Root workspace scripts
├── pnpm-workspace.yaml         # pnpm workspace config
├── tsconfig.base.json          # Shared TypeScript base config
└── CLAUDE.md                   # AI assistant instructions
```

## Design Principles

- **No Deletes**: Records are archived (`archived = true` via PUT), never deleted. No DELETE HTTP methods exist.
- **Single User**: This is a personal tool. One user account. Auth protects the deployment.
- **Libraries Over Custom Code**: Use Refine hooks, Mantine components, Drizzle queries, and Zod schemas over bespoke implementations.
- **Input Validation**: All API endpoints validate with Zod via `@hono/zod-validator`.
- **Edge-Ready**: The API bundle must work in a web-worker-like environment with no Node.js built-ins.

## License

Private project. Not open source.
