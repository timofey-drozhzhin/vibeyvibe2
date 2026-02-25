# vibeyvibe - AI Music Management System

A personal music management platform for cataloging music collections, analyzing song anatomy, managing a song bin, and crafting AI prompts for Suno music generation.

## Architecture

Monorepo managed with pnpm workspaces. Two apps live under `apps/`:

- **apps/api** -- Hono v4 REST API backend (deploys to Bunny Edge Scripting)
- **apps/web** -- Refine v4 (headless) + Mantine UI v8 single-page application (deploys to Bunny CDN)

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
│   └── storage/          # Local file storage for dev (mimics Bunny CDN)
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
| Frontend      | Refine v4 (headless) + Mantine UI v8 + React 19 |
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
All temporary files go in `./tmp/` (gitignored). Local dev storage lives at `./tmp/storage/`.

### Documentation
Always document structural changes in CLAUDE.md files. Keep these files up to date when adding new routes, schemas, pages, or changing conventions.

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

- **Development**: Local SQLite file (`file:./local.db` relative to the API package). Created automatically on first `db:push`.
- **Production**: Bunny libSQL remote database. Set `DATABASE_URL` to the libSQL connection string and provide `DATABASE_AUTH_TOKEN`.
- ORM: Drizzle ORM with the libSQL driver.
- All tables use `text` primary keys with nanoid-generated IDs.
- All tables include `createdAt` and `updatedAt` timestamp columns.

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
