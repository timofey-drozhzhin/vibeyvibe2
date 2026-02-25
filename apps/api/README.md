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

| Command            | Root Alias        | Description                                |
|--------------------|-------------------|--------------------------------------------|
| `tsx watch src/index.ts` | `pnpm dev:api` | Start dev server with hot reload     |
| `tsx src/esbuild.ts`     | `pnpm build:api` | Bundle for Bunny Edge Scripting     |
| `vitest run`             | `pnpm test:api`  | Run test suite                      |
| `vitest`                 | --               | Run tests in watch mode              |
| `drizzle-kit push`       | `pnpm db:push`   | Push schema to local database        |
| `drizzle-kit generate`   | `pnpm db:generate` | Generate migration SQL files      |
| `drizzle-kit migrate`    | `pnpm db:migrate`  | Run pending migrations             |
| `drizzle-kit studio`     | `pnpm db:studio`   | Open Drizzle Studio GUI            |
| `tsx src/db/seed.ts`     | `pnpm db:seed`     | Seed database with sample data     |
| `tsc --noEmit`           | --               | TypeScript type checking             |

## API Routes

All routes are prefixed with `/api`. Authentication is required on all routes except health check and auth endpoints.

### System

| Method | Path                | Auth     | Description            |
|--------|---------------------|----------|------------------------|
| GET    | `/api/health`       | No       | Health check           |
| POST   | `/api/auth/sign-in/email` | No | Email/password login   |
| POST   | `/api/auth/sign-out` | No      | Sign out               |
| GET    | `/api/auth/get-session` | No   | Get current session    |
| GET    | `/api/auth/sign-in/social` | No | Social OAuth redirect |
| GET    | `/api/dashboard/stats` | Yes   | Dashboard statistics   |

### My Music

| Method | Path                                     | Description                      |
|--------|------------------------------------------|----------------------------------|
| GET    | `/api/my-music/songs`                    | List songs (paginated)           |
| GET    | `/api/my-music/songs/:id`                | Get song by ID                   |
| POST   | `/api/my-music/songs`                    | Create song                      |
| PUT    | `/api/my-music/songs/:id`                | Update/archive song              |
| GET    | `/api/my-music/artists`                  | List artists (paginated)         |
| GET    | `/api/my-music/artists/:id`              | Get artist by ID                 |
| POST   | `/api/my-music/artists`                  | Create artist                    |
| PUT    | `/api/my-music/artists/:id`              | Update/archive artist            |
| GET    | `/api/my-music/albums`                   | List albums (paginated)          |
| GET    | `/api/my-music/albums/:id`               | Get album by ID                  |
| POST   | `/api/my-music/albums`                   | Create album                     |
| PUT    | `/api/my-music/albums/:id`               | Update/archive album             |

### Anatomy

| Method | Path                                     | Description                      |
|--------|------------------------------------------|----------------------------------|
| GET    | `/api/anatomy/songs`                     | List anatomy songs               |
| GET    | `/api/anatomy/songs/:id`                 | Get anatomy song                 |
| POST   | `/api/anatomy/songs`                     | Create anatomy song              |
| PUT    | `/api/anatomy/songs/:id`                 | Update/archive anatomy song      |
| GET    | `/api/anatomy/artists`                   | List anatomy artists             |
| GET    | `/api/anatomy/artists/:id`               | Get anatomy artist               |
| POST   | `/api/anatomy/artists`                   | Create anatomy artist            |
| PUT    | `/api/anatomy/artists/:id`               | Update/archive anatomy artist    |
| GET    | `/api/anatomy/attributes`                | List attributes                  |
| GET    | `/api/anatomy/attributes/:id`            | Get attribute                    |
| POST   | `/api/anatomy/attributes`                | Create attribute                 |
| PUT    | `/api/anatomy/attributes/:id`            | Update/archive attribute         |
| GET    | `/api/anatomy/profiles`                  | List anatomy profiles            |
| GET    | `/api/anatomy/profiles/:id`              | Get anatomy profile              |
| POST   | `/api/anatomy/profiles`                  | Create anatomy profile           |
| PUT    | `/api/anatomy/profiles/:id`              | Update/archive anatomy profile   |
| POST   | `/api/anatomy/import`                    | Import anatomy data              |

### Bin

| Method | Path                                     | Description                      |
|--------|------------------------------------------|----------------------------------|
| GET    | `/api/bin/songs`                         | List bin songs                   |
| GET    | `/api/bin/songs/:id`                     | Get bin song                     |
| POST   | `/api/bin/songs`                         | Create bin song                  |
| PUT    | `/api/bin/songs/:id`                     | Update/archive bin song          |
| GET    | `/api/bin/sources`                       | List bin sources                 |
| GET    | `/api/bin/sources/:id`                   | Get bin source                   |
| POST   | `/api/bin/sources`                       | Create bin source                |
| PUT    | `/api/bin/sources/:id`                   | Update/archive bin source        |

### Suno Studio

| Method | Path                                     | Description                      |
|--------|------------------------------------------|----------------------------------|
| GET    | `/api/suno/prompts`                      | List prompts                     |
| GET    | `/api/suno/prompts/:id`                  | Get prompt                       |
| POST   | `/api/suno/prompts`                      | Create prompt                    |
| PUT    | `/api/suno/prompts/:id`                  | Update/archive prompt            |
| GET    | `/api/suno/collections`                  | List collections                 |
| GET    | `/api/suno/collections/:id`              | Get collection                   |
| POST   | `/api/suno/collections`                  | Create collection                |
| PUT    | `/api/suno/collections/:id`              | Update/archive collection        |
| GET    | `/api/suno/generations`                  | List generations                 |
| GET    | `/api/suno/generations/:id`              | Get generation                   |
| POST   | `/api/suno/generations`                  | Create generation                |
| PUT    | `/api/suno/generations/:id`              | Update/archive generation        |

### Query Parameters (List Endpoints)

All list endpoints accept:

| Parameter  | Type    | Default | Description                          |
|------------|---------|---------|--------------------------------------|
| `page`     | number  | 1       | Page number                          |
| `pageSize` | number  | 25      | Items per page (1-100)               |
| `sort`     | string  | --      | Column to sort by                    |
| `order`    | string  | "desc"  | Sort direction ("asc" or "desc")     |
| `search`   | string  | --      | Text search filter                   |
| `archived` | boolean | --      | Filter by archive status             |

### Important: No DELETE Endpoints

This API has no DELETE endpoints. Records are archived by sending a PUT request with `{ "archived": true }` in the body.

## Database Schema

### Auth Tables (Better Auth managed)

- **user** -- User accounts (id, name, email, emailVerified, image, timestamps)
- **session** -- Active sessions (id, token, userId, expiresAt, timestamps)
- **account** -- OAuth accounts (id, providerId, userId, tokens, timestamps)
- **verification** -- Email verification tokens

### My Music Tables

- **my_songs** -- Songs with ISRC, rating, streaming platform IDs, image, release date
- **my_artists** -- Artists with ISNI, rating, social media usernames (Spotify, YouTube, TikTok, Instagram)
- **my_albums** -- Albums with EAN, rating, streaming platform IDs
- **my_song_artists** -- Song-Artist junction (unique on songId + artistId)
- **my_song_albums** -- Song-Album junction (unique on songId + albumId)

### Anatomy Tables

- **anatomy_songs** -- Reference songs for analysis (ISRC required)
- **anatomy_artists** -- Reference artists (ISNI required)
- **anatomy_song_artists** -- Song-Artist junction
- **anatomy_attributes** -- Analysis attributes (name, description, instruction, examples)
- **anatomy_profiles** -- Song analysis profiles (JSON value, linked to song)

### Bin Tables

- **bin_sources** -- Discovery sources (name, URL)
- **bin_songs** -- Discovered songs (name, source reference, asset path, source URL)

### Suno Studio Tables

- **suno_prompts** -- Generation prompts (lyrics, style, voice gender, notes, profile reference)
- **suno_collections** -- Prompt collections (name, description)
- **suno_collection_prompts** -- Collection-Prompt junction
- **suno_generations** -- Generation results (Suno ID, bin song reference)
- **suno_generation_prompts** -- Generation-Prompt junction

### Schema Conventions

- All primary keys are text (nanoid-generated strings)
- All domain tables have `archived` boolean (default false)
- All tables have `createdAt` and `updatedAt` timestamps
- Foreign keys use `.references()` for integrity
- Junction tables have unique composite indexes to prevent duplicates

## Migration Workflow

### Local Development
```bash
# After editing schema files:
pnpm db:push          # Apply changes directly to local SQLite
```

### Production Deployment
```bash
# After editing schema files:
pnpm db:push          # Test locally first
pnpm db:generate      # Generate migration SQL files
git add .             # Commit schema + migration files
git commit -m "Add new schema changes"
pnpm db:migrate       # Run against production (with production DATABASE_URL)
```

**WARNING**: Never run `drizzle-kit push` against a production database. Always use the generate + migrate workflow.

## Deployment to Bunny Edge Scripting

1. **Build the bundle**:
   ```bash
   pnpm build:api
   ```
   This runs `tsx src/esbuild.ts`, which produces a single JavaScript bundle optimized for the edge runtime.

2. **Bundle constraints**:
   - Maximum 1MB bundle size
   - No Node.js native modules (fs, http, net, etc.)
   - Web-compatible APIs only (fetch, Request, Response, etc.)
   - Uses `@libsql/client/web` for database access

3. **Environment variables**: Configure all required environment variables in the Bunny Edge Scripting dashboard:
   - `NODE_ENV=production`
   - `DATABASE_URL` (libSQL connection string)
   - `DATABASE_AUTH_TOKEN`
   - `BETTER_AUTH_SECRET` (strong random string)
   - `BETTER_AUTH_URL` (production API URL)
   - `STORAGE_PROVIDER=bunny`
   - `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_PASSWORD`, `BUNNY_CDN_HOSTNAME`
   - `FRONTEND_URL` (production frontend URL)

4. **Deploy**: Upload the bundle to Bunny Edge Scripting via their deployment API or dashboard.
