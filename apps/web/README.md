# @vibeyvibe/web

Frontend SPA for the vibeyvibe AI Music Management System. Built with Refine v4, Mantine UI v7, and React 19. Deploys to Bunny CDN as static files.

## Prerequisites

- **Node.js** 20 or later
- **pnpm** (workspace-aware package manager)
- **vibeyvibe API** running on `http://localhost:3001` (for development)

## Setup

1. **Install dependencies** (from workspace root):
   ```bash
   pnpm install
   ```

2. **Copy environment file** (from workspace root, if not already done):
   ```bash
   cp .env.example .env
   ```

3. **Start the API** (required for the frontend to function):
   ```bash
   pnpm dev:api
   ```

4. **Start the web development server**:
   ```bash
   pnpm dev:web
   ```
   The app opens at `http://localhost:5173`.

5. **Start both together** (recommended):
   ```bash
   pnpm dev
   ```
   This starts the API on port 3001 and the web app on port 5173 in parallel.

## Available Scripts

Run from the workspace root or from `apps/web/`:

| Command              | Root Alias        | Description                          |
|----------------------|-------------------|--------------------------------------|
| `vite`               | `pnpm dev:web`    | Start Vite dev server (port 5173)    |
| `tsc -b && vite build` | `pnpm build:web` | TypeScript check + production build |
| `vite preview`       | --                | Preview production build locally     |
| `vitest run`         | `pnpm test:web`   | Run test suite                       |
| `vitest`             | --                | Run tests in watch mode              |
| `tsc --noEmit`       | --                | TypeScript type checking only        |

## Page Structure / Route Map

The app is organized into four main sections, each with standard CRUD pages:

### Dashboard
| Path | Component | Description |
|------|-----------|-------------|
| `/`  | `DashboardPage` | Overview with section cards (My Music, Anatomy, Bin, Suno Studio) |

### Authentication
| Path     | Component   | Description |
|----------|-------------|-------------|
| `/login` | `LoginPage` | Email/password login with optional Google OAuth |

### My Music
| Path | Component | Description |
|------|-----------|-------------|
| `/my-music/songs` | `SongList` | Paginated song table with search and archive filter |
| `/my-music/songs/create` | `SongCreate` | Form to add a new song (name, ISRC, rating, platform IDs) |
| `/my-music/songs/:id` | `SongShow` | Song detail with metadata, linked artists and albums |
| `/my-music/songs/:id/edit` | `SongEdit` | Edit song fields, toggle archive status |
| `/my-music/artists` | `ArtistList` | Paginated artist table |
| `/my-music/artists/create` | `ArtistCreate` | Form to add artist (name, ISNI, social links) |
| `/my-music/artists/:id` | `ArtistShow` | Artist detail view |
| `/my-music/artists/:id/edit` | `ArtistEdit` | Edit artist, toggle archive |
| `/my-music/albums` | `AlbumList` | Paginated album table |
| `/my-music/albums/create` | `AlbumCreate` | Form to add album (name, EAN, platform IDs) |
| `/my-music/albums/:id` | `AlbumShow` | Album detail view |
| `/my-music/albums/:id/edit` | `AlbumEdit` | Edit album, toggle archive |

### Anatomy
| Path | Component | Description |
|------|-----------|-------------|
| `/anatomy/songs` | `AnatomySongList` | Reference songs for analysis |
| `/anatomy/songs/create` | `AnatomySongCreate` | Add reference song |
| `/anatomy/songs/:id` | `AnatomySongShow` | Song detail with anatomy profiles |
| `/anatomy/songs/:id/edit` | `AnatomySongEdit` | Edit reference song |
| `/anatomy/artists` | `AnatomyArtistList` | Reference artists |
| `/anatomy/artists/create` | `AnatomyArtistCreate` | Add reference artist |
| `/anatomy/artists/:id` | `AnatomyArtistShow` | Artist detail |
| `/anatomy/artists/:id/edit` | `AnatomyArtistEdit` | Edit reference artist |
| `/anatomy/attributes` | `AttributeList` | Analysis attributes (tempo, mood, etc.) |
| `/anatomy/attributes/create` | `AttributeCreate` | Add attribute with description and instruction |
| `/anatomy/attributes/:id` | `AttributeShow` | Attribute detail |
| `/anatomy/attributes/:id/edit` | `AttributeEdit` | Edit attribute |

### Bin
| Path | Component | Description |
|------|-----------|-------------|
| `/bin/songs` | `BinSongList` | Discovered songs |
| `/bin/songs/create` | `BinSongCreate` | Add discovered song |
| `/bin/songs/:id` | `BinSongShow` | Song detail with source info |
| `/bin/songs/:id/edit` | `BinSongEdit` | Edit bin song |
| `/bin/sources` | `SourceList` | Discovery sources |
| `/bin/sources/create` | `SourceCreate` | Add discovery source |
| `/bin/sources/:id` | `SourceShow` | Source detail |
| `/bin/sources/:id/edit` | `SourceEdit` | Edit source |

### Suno Studio
| Path | Component | Description |
|------|-----------|-------------|
| `/suno/prompts` | `PromptList` | Generation prompts |
| `/suno/prompts/create` | `PromptCreate` | Craft new prompt (lyrics, style, voice, notes) |
| `/suno/prompts/:id` | `PromptShow` | Prompt detail with linked profile |
| `/suno/prompts/:id/edit` | `PromptEdit` | Edit prompt |
| `/suno/collections` | `CollectionList` | Prompt collections |
| `/suno/collections/create` | `CollectionCreate` | Create collection |
| `/suno/collections/:id` | `CollectionShow` | Collection detail with prompts |
| `/suno/collections/:id/edit` | `CollectionEdit` | Edit collection |
| `/suno/generations` | `GenerationList` | Generation results |
| `/suno/generations/create` | `GenerationCreate` | Record new generation |
| `/suno/generations/:id` | `GenerationShow` | Generation detail |
| `/suno/generations/:id/edit` | `GenerationEdit` | Edit generation |

## Component Conventions

### Page Pattern
Every resource has four page files in its directory:

```
pages/{section}/{resource}/
├── list.tsx     # useTable hook, search, pagination, archive filter
├── create.tsx   # useForm hook, form fields, submit handler
├── edit.tsx     # useForm hook (action: "edit"), pre-populated, archive toggle
└── show.tsx     # useShow hook, read-only detail display
```

### Hooks
- Use `useTable` for all list pages (provides sorting, pagination, filtering)
- Use `useForm` for all create/edit pages (provides validation, submission, loading states)
- Use `useShow` for all show pages (fetches single record by route param)
- Use `useLogin` and `useLogout` for authentication actions

### UI Components
- Use Mantine components for all visual elements
- Use `@tabler/icons-react` for all icons
- Use Refine's `ThemedLayoutV2` as the page shell
- Use the custom `Sider` component for navigation

### No Delete Actions
Never add delete buttons, delete actions, or delete confirmation dialogs. Archiving is the only way to "remove" records, and it is done through the edit page's archive toggle.

## Theming Guide

### Color Scheme
- Default: **Dark mode** (`defaultColorScheme="dark"`)
- Primary color: **Violet**
- Section colors: Violet (My Music), Teal (Anatomy), Orange (Bin), Pink (Suno Studio)

### Fonts
- **Poppins** (body and headings): Set globally in the Mantine theme. Available weights: 300, 400, 500, 600, 700.
- **Righteous** (brand only): Applied inline on the "vibeyvibe" brand text in the sidebar and login page. Usage: `style={{ fontFamily: "'Righteous', cursive" }}`
- Loaded from Google Fonts in `index.html`.

### Theme Configuration
The theme is defined in `src/theme.ts`:

```typescript
import { createTheme } from "@mantine/core";

export const theme = createTheme({
  fontFamily: "Poppins, sans-serif",
  headings: { fontFamily: "Poppins, sans-serif" },
  primaryColor: "violet",
});
```

### Guidelines
- Keep theme overrides minimal. Do not add component-specific style overrides to the theme.
- Use Mantine's color tokens: `var(--mantine-color-{color}-{shade})` (e.g., `var(--mantine-color-violet-6)`)
- Use Mantine's spacing scale via component props (`gap`, `p`, `m`, etc.) rather than custom CSS.
- Use `c="dimmed"` for secondary text.
- Use `withBorder` on Cards for visual separation.
- Notifications are positioned at `top-right` via the `Notifications` provider.

## Deployment to Bunny CDN

1. **Build the production bundle**:
   ```bash
   pnpm build:web
   ```
   Output goes to `apps/web/dist/`.

2. **Verify the build**:
   ```bash
   pnpm --filter @vibeyvibe/web preview
   ```

3. **Upload to Bunny CDN**:
   - Upload the contents of `apps/web/dist/` to your Bunny CDN storage zone
   - Configure the pull zone to serve from the storage zone
   - Set up a custom domain if desired

4. **SPA routing**:
   - Configure Bunny CDN to serve `index.html` for all routes (SPA fallback)
   - This ensures React Router handles client-side routing correctly

5. **Environment**:
   - Set `VITE_API_URL` to the production API URL before building
   - Set `VITE_GOOGLE_CLIENT_ID` if using Google OAuth
   - These are baked into the build at compile time (Vite environment variables)

6. **CORS**:
   - The API's CORS configuration must include the production frontend URL
   - Set `FRONTEND_URL` in the API's environment to match the CDN domain

## Environment Variables

| Variable              | Default | Description                                     |
|-----------------------|---------|-------------------------------------------------|
| `VITE_API_URL`        | `""`    | API base URL. Empty for dev (uses Vite proxy)   |
| `VITE_GOOGLE_CLIENT_ID` | --   | Google OAuth client ID. Enables Google sign-in button when set |

Note: Vite environment variables are embedded at build time, not runtime. They must be prefixed with `VITE_` to be exposed to the client bundle.
