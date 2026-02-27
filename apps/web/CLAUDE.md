# vibeyvibe Web Frontend

Refine v5 (headless) + Mantine UI v8 single-page application for the vibeyvibe music management system.

## Overview

The web app is a React 19 SPA built with Refine (headless CRUD framework) and Mantine (component library). It communicates with the API backend through a REST data provider. Authentication is handled via Better Auth session cookies. The app uses Vite for development and production builds, and deploys as static files to Bunny CDN.

The UI is entirely **registry-driven**. A single entity registry (`config/entity-registry.ts`) defines all 13 entities across 4 sections. Two generic page components (`GenericEntityList`, `GenericEntityDetail`) handle every entity -- there are no per-entity page files.

## Directory Structure

```
src/
├── main.tsx              # React entry point: BrowserRouter, MantineProvider, Notifications, App
├── App.tsx               # Refine config: dynamic resources + routes from entity registry
├── theme.ts              # Mantine theme overrides: Poppins font, violet primary color
├── config/
│   └── entity-registry.ts  # Entity definitions driving all UI (13 entities, 4 sections)
├── providers/
│   ├── auth-provider.ts  # Refine AuthProvider: login, logout, check, getIdentity, onError
│   └── data-provider.ts  # Refine DataProvider: @refinedev/simple-rest wrapping /api
├── components/
│   ├── layout/
│   │   ├── index.tsx     # Layout wrapper: ThemedLayoutV2 with custom Sider
│   │   └── sidebar.tsx   # Dynamic sidebar generated from entity registry
│   ├── shared/           # Reusable UI components (EntityPage, EditableField, etc.)
│   ├── generic/          # Registry-driven dynamic components
│   │   ├── field-row.tsx           # FieldType -> component dispatch for show pages
│   │   ├── aside-panel.tsx         # Right panel (image upload + media embeds)
│   │   ├── relationship-section.tsx # M:N relationship table + assign modal
│   │   └── list-cell.tsx           # Field type renderer for list table cells
├── pages/
│   ├── login.tsx         # Login page: email/password form + optional Google OAuth
│   ├── dashboard.tsx     # Dashboard page: section overview cards
│   ├── generic/
│   │   ├── list.tsx      # GenericEntityList -- handles ALL entity list pages
│   │   └── show.tsx      # GenericEntityDetail -- handles ALL entity detail pages
│   └── lab/
│       └── import.tsx    # Spotify import (standalone page, not registry-driven)
└── utils/                # Utility functions and helpers
```

There are NO per-entity page directories. The old `pages/my-music/songs/`, `pages/lab/artists/`, etc. directories are all gone. Everything is driven by the entity registry and the two generic page components.

## Entity Registry

The entity registry at `config/entity-registry.ts` is the **single source of truth** for all UI generation. It replaces the old pattern of writing individual list/show page files for each entity.

### Core Types

```typescript
type FieldType = "text" | "textarea" | "date" | "rating" | "uid"
               | "image" | "audio" | "fk" | "url" | "select" | "readonly";

type SectionContext = "my-music" | "lab" | "bin" | "suno";

interface FieldDef {
  key: string;           // DB column name (e.g. "spotify_uid", "release_date")
  label: string;         // Display label
  type: FieldType;       // Controls which component renders this field
  platform?: "spotify" | "apple_music" | "youtube" | "suno";  // For uid fields
  target?: string;       // For fk fields: target entity slug (or "context/slug")
  targetLabelField?: string;  // For fk fields: which column to display
  embedType?: "track" | "album";  // For uid fields: media embed format
  placeholder?: string;
  validate?: (value: string) => string | null;
  createField?: boolean;     // Include in create modal
  createRequired?: boolean;  // Required in create modal
  directory?: string;        // Storage directory for image/audio uploads
  accept?: string;           // File accept attribute for audio fields
}

interface RelationshipDef {
  type: "many-to-many" | "one-to-many";
  target: string;            // Target entity slug
  label: string;             // Section header label
  subResource: string;       // API sub-resource path (e.g. "artists")
  assignFieldName: string;   // Field name for assign payload (e.g. "artistId")
  pivotTable?: string;       // Name of the junction table
  columns: Array<{           // Columns to display in the relationship table
    key: string;
    label: string;
    type?: "text" | "rating" | "badge" | "date";
  }>;
  targetLabelField?: string;
  generateAction?: {         // Optional AI generate button in section header
    label: string;           // Button label (e.g. "Generate")
    endpoint: string;        // API endpoint to POST to
    bodyField: string;       // Field name for record ID in POST body
  };
}

interface EntityDef {
  slug: string;              // URL slug (e.g. "songs", "vibes")
  tableName: string;         // DB table name (without section prefix)
  name: string;              // Singular display name
  pluralName: string;        // Plural display name
  context: SectionContext;   // Which section this entity belongs to
  fields: FieldDef[];        // All field definitions
  relationships: RelationshipDef[];  // M:N relationship definitions
  listColumns: string[];     // Field keys to show in the list table
  asideFields: string[];     // Field keys for the right panel on show pages
  resource?: string;         // Override Refine resource name
  titleField?: string;       // Override which field is the title (default: "name")
  storageDirectory?: string; // Default storage directory for uploads
  createExtraFields?: string[];  // Additional fields in the create modal
}
```

### 13 Entity Definitions

| # | Resource Name | Entity Name | Context |
|---|---------------|-------------|---------|
| 1 | `my-music/songs` | Song | my-music |
| 2 | `my-music/artists` | Artist | my-music |
| 3 | `my-music/albums` | Album | my-music |
| 4 | `lab/songs` | Song | lab |
| 5 | `lab/artists` | Artist | lab |
| 6 | `lab/albums` | Album | lab |
| 7 | `lab/vibes` | Vibe | lab |
| 8 | `bin/sources` | Source | bin |
| 9 | `bin/songs` | Song | bin |
| 10 | `suno/prompt-collections` | Prompt Collection | suno |
| 11 | `suno/prompts` | Prompt | suno |
| 12 | `suno/song-playlists` | Song Playlist | suno |
| 13 | `suno/songs` | Song | suno |

### Reusable Field Sets

The registry uses factory functions to avoid duplication across sections that share similar entities:

- `songFields(storageDir)` -- ISRC, release date, rating, image, Spotify/Apple Music/YouTube UIDs
- `artistFields(storageDir)` -- ISNI, rating, image
- `albumFields(storageDir)` -- EAN, release date, rating, image, Spotify/Apple Music/YouTube UIDs
- `songRelationships` -- M:N relationships to artists and albums

These are reused by my-music and lab song/artist/album entities.

### Utility Functions

```typescript
getResourceName(entity)          // -> "my-music/songs" (Refine resource name)
getRoutePath(entity)             // -> "/my-music/songs" (URL path)
findEntity(context, slug)        // -> EntityDef | undefined
findEntityByResource(resource)   // -> EntityDef | undefined
getEntitiesForSection(context)   // -> EntityDef[]
resolveRelationshipTarget(sourceEntity, targetSlug)  // -> EntityDef | undefined
// targetSlug can be "artists" (same context) or "bin/songs" (cross-context)
```

### Extensions Registry

Extensions add entity-specific functionality beyond what the generic components provide. Extensions are lazy-loaded React components.

```typescript
entityExtensions: Record<string, ExtensionDef[]>
```

Currently registered: none.

### Standalone Pages

Pages that exist outside the entity registry pattern:

```typescript
standalonePages: StandalonePageDef[]
```

Currently registered:
- Lab Import page at `/lab/import` (Spotify URL import flow)

## Routing

Routing is handled by React Router v7 via the `@refinedev/react-router` integration. Routes are **dynamically generated** from the entity registry in `App.tsx`.

### How Routes Are Built

1. **Resources array**: `entityRegistry.map(entity => ({ name, list, show, meta }))` -- tells Refine about each resource
2. **Route elements**: `sections.map(section -> entities -> Route elements)` -- nested React Router routes
3. **Two generic components** handle all entities: `GenericEntityList` and `GenericEntityDetail`
4. **Standalone pages** (Import) are mounted separately outside the registry loop

### Route Pattern

- List: `/{context}/{slug}` (e.g. `/lab/songs`)
- Detail: `/{context}/{slug}/show/:id` (e.g. `/lab/songs/show/abc123`)

### Route Map

| Path | Component | Description |
|------|-----------|-------------|
| `/` | DashboardPage | Section overview cards |
| `/login` | LoginPage | Email/password + Google OAuth |
| `/{context}/{slug}` | GenericEntityList | List page for any entity |
| `/{context}/{slug}/show/:id` | GenericEntityDetail | Detail page for any entity |
| `/lab/import` | LabImport | Import songs from Spotify URLs |

### Notification Provider

A custom Mantine-based notification provider is configured in `App.tsx`. It **suppresses success notifications** (to avoid noise from inline edits) and only shows error notifications.

## Data Provider

The data provider is configured in `providers/data-provider.ts` using `@refinedev/simple-rest`:

```typescript
const dataProvider = dataProviderSimpleRest(`${API_URL}/api`);
```

The `VITE_API_URL` environment variable controls the API base URL. In development it defaults to empty string (so requests go to the same origin and Vite proxies them to the API).

The Vite dev server proxies all `/api` requests to `http://localhost:3001`:

```typescript
proxy: {
  "/api": {
    target: "http://localhost:3001",
    changeOrigin: true,
  },
}
```

## Auth Provider

The auth provider (`providers/auth-provider.ts`) implements Refine's `AuthProvider` interface:

- **login**: POST to `/api/auth/sign-in/email` with `{ email, password }`. Uses `credentials: "include"` for cookie-based sessions.
- **logout**: POST to `/api/auth/sign-out`. Redirects to `/login`.
- **check**: GET `/api/auth/get-session`. Returns `authenticated: true` if session exists, redirects to `/login` otherwise.
- **getIdentity**: GET `/api/auth/get-session`. Extracts user data (id, name, email, avatar) from the session response.
- **onError**: Triggers logout on 401 errors.

## Page Conventions

There are **no per-entity page files**. Two generic components handle everything:

### GenericEntityList (`pages/generic/list.tsx`)

Receives an `EntityDef` as a prop and renders:
- **Header**: Title (`entity.pluralName`) + "New" button
- **Toolbar**: `ListToolbar` with search input and archive filter (Active/All/Archived)
- **Table**: Columns from `entity.listColumns`, rendered via `ListCell` component
  - Sortable columns: name, rating, release_date, created_at, updated_at, vibe_category
  - Image columns render as small Avatar previews (32px)
  - Name column is clickable (navigates to show page)
  - Platform links (Actions column) shown if entity has platform UID fields
- **Pagination**: Shown when pageCount > 1 (PAGE_SIZE = 20)
- **Create Modal**: Opens from "New" button. Always includes a "Name" field. Additional fields come from `entity.fields` where `createField: true`. On success, navigates to the new record's show page.

There are no separate create or edit pages. Create functionality lives in a modal on the list page, and all editing is done inline on the show page.

### GenericEntityDetail (`pages/generic/show.tsx`)

Receives an `EntityDef` as a prop and renders:
- **EntityPage wrapper**: Provides editable title, archive badge, archive button, back navigation
- **Main body**: `SectionCard` with a table of `FieldRow` components for each non-aside, non-UID field
  - Always appends Created/Updated timestamp rows
- **Right panel** (300px): `AsidePanel` for aside fields (image upload + media embeds)
- **Relationship sections**: One `RelationshipSection` per `entity.relationships` entry
- **Extension sections**: Lazy-loaded components from `entityExtensions` (if any registered)

Inline editing is handled by `useUpdate` from Refine. Each field has an `onSave` callback that calls `updateRecord` and refetches.

## Generic Components

Located in `components/generic/`. These are the building blocks used by the generic page components.

### FieldRow (`field-row.tsx`)

Renders a single `<Table.Tr>` with label and value cells. Dispatches rendering based on `FieldDef.type`:

| FieldType | Component Used | Behavior |
|-----------|---------------|----------|
| `text` | `EditableField` | Click-to-edit inline text |
| `textarea` | `EditableField` | Click-to-edit with `whiteSpace: pre-wrap` display |
| `date` | `EditableField` (type="date") | Calendar date picker |
| `rating` | `RatingField` | Interactive 0-5 star rating |
| `url` | `EditableField` | Click-to-edit, displays as clickable `Anchor` |
| `image` | `ImageUpload` | Inline image preview with click-to-upload (120px) |
| `audio` | `AudioPlayer` + `FileUpload` | Audio player with file upload below |
| `fk` | `ForeignKeyField` (internal) | Click-to-select dropdown; resolves display names from record enrichment |
| `uid` | (skipped) | UID fields are rendered in the aside panel, not as table rows |
| `select` | placeholder | Not yet fully implemented |
| `readonly` | `Text` | Plain text, no editing |

The `ForeignKeyField` sub-component uses `resolveRelationshipTarget` to find the target entity, then fetches options via `useList` only when the dropdown is opened (lazy loading). It resolves display names from API-enriched record data using multiple heuristics (e.g., `record.source.name`, `record.songName`, `record.song_name`).

### AsidePanel (`aside-panel.tsx`)

Renders the right panel on show pages. Separates aside fields into:
- **Image field**: `ImageUpload` component (300px size) for cover art
- **UID fields**: `MediaEmbeds` component with inline-editable platform IDs

Maps MediaEmbeds callback field names (`spotifyId`, `appleMusicId`, `youtubeId`) back to entity registry keys (`spotify_uid`, `apple_music_uid`, `youtube_uid`).

### RelationshipSection (`relationship-section.tsx`)

Renders a `SectionCard` with:
- Table of related items from `record[relationship.subResource]`
- Columns defined by `relationship.columns` with type-aware rendering (text, rating, badge, date)
- Clickable rows navigate to the related entity's show page
- Unlink button per row (calls `PUT /api/{resource}/{id}/{subResource}/{relatedId}`)
- "Assign" action button opens `AssignModal`

### ListCell (`list-cell.tsx`)

Type-aware cell renderer for list tables. Handles:
- `image_path` -> small `Avatar` (32px)
- `rating` -> `RatingDisplay` (read-only stars)
- `archived` -> `ArchiveBadge` (green Active / red Archived)
- `created_at` / `updated_at` -> formatted date
- `*_date` fields -> text display
- `*_uid` fields -> dimmed text
- `*_id` fields -> attempts to resolve enriched display names from record
- `name` -> bold text (clickable behavior handled by parent)

## Sidebar

The sidebar (`components/layout/sidebar.tsx`) is **dynamically generated** from the entity registry. It reads `sections` and `entityRegistry` to build navigation groups at module load time.

### Structure
- **Brand**: "vibeyvibe" in Righteous font (clickable, navigates to dashboard)
- **Dashboard link**: Always first, with `IconLayoutDashboard`
- **Section groups**: One collapsible group per section, auto-expanded if any child route is active
- **Entity items**: Each entity in a section becomes a `NavLink`, plus standalone pages for that section
- **User footer**: Avatar, name, email, logout button

### Section Icons and Colors

| Context | Icon | Color |
|---------|------|-------|
| my-music | `IconMusic` | violet |
| lab | `IconDna` | teal |
| bin | `IconTrash` | orange |
| suno | `IconBrain` | pink |

## Shared UI Components

Located in `components/shared/`:

| Component | File | Description |
|-----------|------|-------------|
| `EntityPage` | `entity-page.tsx` | Global show page layout: editable title, archive badge, optional right panel, archive button footer, loading/not-found states |
| `SectionCard` | `entity-page.tsx` | Card section with `Title order={4}` header and optional action button(s). Supports `action` (single button with "+") or `actions` (custom ReactNode). Re-exported from entity-page. |
| `EditableField` | `editable-field.tsx` | Click-to-edit inline field with hover edit icon. Supports custom `renderDisplay`, validation, async save. Supports `type='date'` for calendar picker via @mantine/dates. |
| `RatingField` | `rating-field.tsx` | Interactive star rating (0-1 decimal scale, 0=unrated). Click same star to reset. Emits 0-1 values. |
| `RatingDisplay` | `rating-field.tsx` | Read-only star rating display (0-1 decimal scale). |
| `ImageUpload` | `image-upload.tsx` | Click-to-upload image with preview. Hover overlay shows upload icon. |
| `ImagePreview` | `image-preview.tsx` | Displays image from storage path or placeholder. Configurable size. |
| `FileUpload` | `file-upload.tsx` | File upload widget that POSTs to `/api/upload` and returns the storage path. |
| `AudioPlayer` | `audio-player.tsx` | HTML5 audio player. Shows "no audio" placeholder when path is null. |
| `MediaEmbeds` | `media-embeds.tsx` | Spotify/Apple Music/YouTube iframe embeds. With `onSave`, shows editable platform ID placeholders. Supports `type` prop (track/album). |
| `PlatformLinks` | `platform-links.tsx` | Spotify/Apple Music/YouTube icon buttons that open external URLs. Used in table Actions columns. |
| `AssignModal` | `assign-modal.tsx` | Modal with searchable dropdown for assigning M:N relationships. |
| `ListToolbar` | `list-toolbar.tsx` | Toolbar with search input and archive status segmented control (Active/All/Archived). |
| `SortableHeader` | `sortable-header.tsx` | Clickable table header cell with sort direction arrow. |
| `ArchiveButton` | `archive-toggle.tsx` | Red "Archive" / green "Restore" button with confirmation modal. |
| `ArchiveBadge` | `archive-toggle.tsx` | Green "Active" / red "Archived" badge. |
| `ShowPageHeader` | `show-page.tsx` | **Deprecated** -- use `EntityPage` instead. |

## Component Patterns

### Refine Hooks
Use Refine's data hooks for all CRUD operations:
- `useList` -- List pages with server-side data fetching
- `useShow` -- Show pages to fetch a single record
- `useOne` -- Ad-hoc single-record fetching
- `useCreate` -- Programmatic record creation (used in list page create modals)
- `useUpdate` -- Programmatic record updates (used for inline editing on show pages)
- `useNavigation` -- Programmatic navigation (`show`, `list`)
- `useLogin` / `useLogout` -- Auth actions

### Mantine Components
Use Mantine v8 components for all UI:
- Layout: `Box`, `Group`, `Stack`, `SimpleGrid`, `Center`
- Data display: `Card`, `Text`, `Title`, `Badge`, `Avatar`, `Table`
- Forms: `TextInput`, `PasswordInput`, `NumberInput`, `Select`, `Textarea`
- Navigation: `NavLink`, `Collapse`, `Pagination`, `ScrollArea`
- Feedback: `Button`, `ActionIcon`, `Notifications`, `LoadingOverlay`, `Tooltip`, `Skeleton`
- Overlay: `Modal`

## Theming

The Mantine theme is configured in `theme.ts`:

```typescript
export const theme = createTheme({
  fontFamily: "Poppins, sans-serif",
  headings: { fontFamily: "Poppins, sans-serif" },
  primaryColor: "violet",
});
```

### Font Rules
- **Righteous**: Used exclusively for the "vibeyvibe" brand text. Applied via inline `style={{ fontFamily: "'Righteous', cursive" }}` only on brand elements.
- **Poppins**: Used for all body text and headings. Set globally through the Mantine theme.
- Both fonts are loaded from Google Fonts in `index.html`.

### Theming Rules
- Keep overrides minimal. Only the font family and primary color are customized.
- Do NOT override individual component styles in the theme configuration.
- Use Mantine's built-in color scheme support. The app defaults to dark mode (`defaultColorScheme="dark"`).
- Use Mantine's color tokens (e.g., `var(--mantine-color-violet-6)`) rather than hardcoded hex values.

## Validation

- Rating fields use a 0-1 decimal scale (0 = unrated, 0.2 = 1 star, 0.4 = 2 stars, ..., 1.0 = 5 stars). Click the same star to reset to 0.
- ISRC fields are validated against the regex `/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/`.
- Validation functions are defined per-field in the entity registry via `FieldDef.validate`.
- Required fields in create modals are marked with `createRequired: true`.

## No Delete Buttons

There are no delete buttons, delete actions, or delete confirmation dialogs anywhere in the UI. To archive a record, use the `ArchiveButton` in the footer of the show page's `EntityPage` component (sets `archived = true` via PUT). List pages can filter by archive status to show/hide archived records.

## Icons

All icons come from `@tabler/icons-react`. Key icons:
- `IconMusic` -- My Music section
- `IconDna` -- Lab section
- `IconTrash` -- Bin section (section icon, not a delete action)
- `IconBrain` -- Suno Studio section
- `IconLayoutDashboard` -- Dashboard
- `IconPlus` -- Create/add buttons
- `IconChevronRight` -- Expand/collapse indicator
- `IconUnlink` -- Remove relationship assignment
- `IconLogout` -- Logout button
- `IconStar` / `IconStarFilled` -- Rating stars
- `IconLogin` -- Sign in action
- `IconBrandGoogle` -- Google OAuth

## Environment Variables

| Variable          | Default | Description                                  |
|-------------------|---------|----------------------------------------------|
| VITE_API_URL      | ""      | API base URL (empty = same origin with proxy)|
| VITE_GOOGLE_CLIENT_ID | -- | Google OAuth client ID (enables OAuth button)|

## Development

```bash
pnpm dev        # Start Vite dev server on port 5173
pnpm build      # TypeScript check + Vite production build to dist/
pnpm preview    # Preview production build locally
pnpm test       # Run Vitest tests
pnpm test:watch # Run Vitest in watch mode
pnpm typecheck  # TypeScript type checking only
```

The Vite dev server automatically proxies `/api` requests to `http://localhost:3001`, so the API must be running for the frontend to function.

## Adding a New Entity

To add a new entity to the system:

1. **Define it in `entity-registry.ts`**: Add an `EntityDef` to the `entityRegistry` array with slug, context, fields, relationships, listColumns, and asideFields.
2. **That's it.** The generic components, routing, sidebar navigation, and Refine resources are all auto-generated from the registry. No new page files needed.

To add entity-specific behavior beyond the generic pattern:
- Add an extension in `entityExtensions` with a lazy-loaded component (placement: `"show-section"`)
- Or add a standalone page in `standalonePages` for flows that don't fit the list/show pattern (e.g., the Spotify import page)
