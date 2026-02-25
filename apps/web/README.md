# @vibeyvibe/web

Frontend SPA for the vibeyvibe AI Music Management System. Built with Refine v5, Mantine UI v8, and React 19. Deploys to Bunny CDN as static files.

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

| Command | Root Alias | Description |
|---------|-----------|-------------|
| `vite` | `pnpm dev:web` | Start Vite dev server (port 5173) |
| `tsc -b && vite build` | `pnpm build:web` | TypeScript check + production build |
| `vite preview` | -- | Preview production build locally |
| `vitest run` | `pnpm test:web` | Run test suite |
| `vitest` | -- | Run tests in watch mode |
| `tsc --noEmit` | -- | TypeScript type checking only |

## Page Structure / Route Map

The app is organized into four main sections, each with standard CRUD pages:

### Dashboard
| Path | Component | Description |
|------|-----------|-------------|
| `/` | `DashboardPage` | Overview with section cards showing record counts |

### Authentication
| Path | Component | Description |
|------|-----------|-------------|
| `/login` | `LoginPage` | Email/password login with optional Google OAuth button |

### My Music
| Path | Component | Description |
|------|-----------|-------------|
| `/my-music/songs` | `SongList` | Paginated song table with search and archive filter |
| `/my-music/songs/create` | `SongCreate` | Form to add a new song (name, ISRC, rating, platform IDs, image upload) |
| `/my-music/songs/show/:id` | `SongShow` | Song detail with metadata, linked artists and albums, image preview |
| `/my-music/songs/edit/:id` | `SongEdit` | Edit song fields, toggle archive status |
| `/my-music/artists` | `ArtistList` | Paginated artist table |
| `/my-music/artists/create` | `ArtistCreate` | Form to add artist (name, ISNI, social links, image upload) |
| `/my-music/artists/show/:id` | `ArtistShow` | Artist detail view with image |
| `/my-music/artists/edit/:id` | `ArtistEdit` | Edit artist, toggle archive |
| `/my-music/albums` | `AlbumList` | Paginated album table |
| `/my-music/albums/create` | `AlbumCreate` | Form to add album (name, EAN, platform IDs, image upload) |
| `/my-music/albums/show/:id` | `AlbumShow` | Album detail view |
| `/my-music/albums/edit/:id` | `AlbumEdit` | Edit album, toggle archive |

### Anatomy
| Path | Component | Description |
|------|-----------|-------------|
| `/anatomy/songs` | `AnatomySongList` | Reference songs for analysis (smart search) |
| `/anatomy/songs/create` | `AnatomySongCreate` | Add reference song (ISRC required) |
| `/anatomy/songs/show/:id` | `AnatomySongShow` | Song detail with anatomy profile editor |
| `/anatomy/songs/edit/:id` | `AnatomySongEdit` | Edit reference song |
| `/anatomy/artists` | `AnatomyArtistList` | Reference artists |
| `/anatomy/artists/show/:id` | `AnatomyArtistShow` | Artist detail |
| `/anatomy/attributes` | `AnatomyAttributeList` | Analysis attributes (tempo, mood, etc.) |
| `/anatomy/attributes/create` | `AnatomyAttributeCreate` | Add attribute with description and instruction |
| `/anatomy/attributes/edit/:id` | `AnatomyAttributeEdit` | Edit attribute |
| `/anatomy/import` | `AnatomyImport` | Import songs from Spotify URLs (preview + confirm) |

### Bin
| Path | Component | Description |
|------|-----------|-------------|
| `/bin/songs` | `BinSongList` | Discovered songs with audio player |
| `/bin/songs/create` | `BinSongCreate` | Add discovered song with audio file upload |
| `/bin/songs/show/:id` | `BinSongShow` | Song detail with source info and audio player |
| `/bin/songs/edit/:id` | `BinSongEdit` | Edit bin song |
| `/bin/sources` | `BinSourceList` | Discovery sources |
| `/bin/sources/create` | `BinSourceCreate` | Add discovery source |
| `/bin/sources/show/:id` | `BinSourceShow` | Source detail |
| `/bin/sources/edit/:id` | `BinSourceEdit` | Edit source |

### Suno Studio
| Path | Component | Description |
|------|-----------|-------------|
| `/suno/prompts` | `SunoPromptList` | Generation prompts |
| `/suno/prompts/create` | `SunoPromptCreate` | Craft new prompt (lyrics, style, voice, notes, profile link) |
| `/suno/prompts/show/:id` | `SunoPromptShow` | Prompt detail with linked anatomy profile |
| `/suno/prompts/edit/:id` | `SunoPromptEdit` | Edit prompt |
| `/suno/collections` | `SunoCollectionList` | Prompt collections |
| `/suno/collections/create` | `SunoCollectionCreate` | Create collection |
| `/suno/collections/show/:id` | `SunoCollectionShow` | Collection detail with assigned prompts |
| `/suno/collections/edit/:id` | `SunoCollectionEdit` | Edit collection |
| `/suno/generations` | `SunoGenerationList` | Generation results |
| `/suno/generations/show/:id` | `SunoGenerationShow` | Generation detail with assigned prompts |

## Component Patterns

### Page Pattern

Every resource has up to four page files in its directory:

```
pages/{section}/{resource}/
├── list.tsx     # useTable hook, search, pagination, archive filter
├── create.tsx   # useForm hook, form fields, submit handler
├── edit.tsx     # useForm hook (action: "edit"), pre-populated, archive toggle
└── show.tsx     # useShow hook, read-only detail display
```

### Refine Hooks

- `useTable` -- All list pages (provides sorting, pagination, filtering via server-side parameters)
- `useForm` -- All create/edit pages (form state management, validation, submission)
- `useShow` -- All show pages (fetches single record by route param)
- `useList` / `useOne` -- Ad-hoc data fetching (e.g., loading options for dropdowns)
- `useCreate` / `useUpdate` -- Programmatic mutations (e.g., profile editor)
- `useLogin` / `useLogout` -- Authentication actions

### Mantine Components

| Category | Components Used |
|----------|----------------|
| Layout | `Box`, `Group`, `Stack`, `SimpleGrid`, `Center`, `Flex` |
| Data Display | `Card`, `Text`, `Title`, `Badge`, `Table`, `Image` |
| Forms | `TextInput`, `PasswordInput`, `NumberInput`, `Select`, `Textarea`, `FileInput`, `Switch` |
| Navigation | `NavLink`, `Tabs`, `Breadcrumbs`, `SegmentedControl` |
| Feedback | `Button`, `ActionIcon`, `Loader`, `Notifications` |
| Overlay | `Modal`, `Tooltip`, `Drawer` |

## Shared Components

Reusable components in `src/components/shared/`:

### FileUpload

File upload component that posts to `/api/upload` and returns the storage path.

```tsx
<FileUpload
  value={form.values.imagePath}
  onChange={(path) => form.setFieldValue("imagePath", path)}
  accept="image/*"
  directory="artists"
  label="Artist Image"
  placeholder="Select an image"
/>
```

**Props:**
- `value` -- Current storage path
- `onChange` -- Called with storage path after upload, or empty string on clear
- `accept` -- MIME type filter (default: `image/*`)
- `directory` -- Storage subdirectory: `artists`, `albums`, `songs`, `bin`
- `label`, `placeholder`, `description` -- Form field labels

### ImagePreview

Displays an image from storage, or a placeholder icon if no path is set.

```tsx
<ImagePreview path={record.imagePath} size={120} alt="Artist photo" />
```

**Props:**
- `path` -- Storage path (e.g., `artists/abc123.jpg`), or `null`/`undefined` for placeholder
- `size` -- Width and height in pixels (default: 120)
- `alt` -- Alt text

### AudioPlayer

HTML5 audio player that plays files from storage.

```tsx
<AudioPlayer path={record.assetPath} label="Song Preview" />
```

**Props:**
- `path` -- Storage path (e.g., `bin/abc123.mp3`), or `null` for "no audio" placeholder
- `label` -- Display label (defaults to filename)

### AssignModal

Modal dialog for assigning relationships (e.g., artist to song, prompt to collection).

```tsx
<AssignModal
  opened={assignModalOpen}
  onClose={() => setAssignModalOpen(false)}
  title="Assign Artist"
  resource="my-music/artists"
  assignUrl={`/api/my-music/songs/${songId}/artists`}
  fieldName="artistId"
  labelField="name"
  onSuccess={() => refetch()}
/>
```

**Props:**
- `opened` / `onClose` -- Modal visibility control
- `title` -- Modal title
- `resource` -- Refine resource name for fetching options
- `assignUrl` -- API endpoint for the assignment POST
- `fieldName` -- JSON body field name (e.g., `artistId`, `albumId`, `promptId`)
- `labelField` -- Which field from the fetched records to display as label
- `onSuccess` -- Callback after successful assignment

### SortableHeader

Clickable table header cell with sort direction indicator.

```tsx
<SortableHeader
  field="name"
  label="Name"
  currentSort={sorter.field}
  currentOrder={sorter.order}
  onSort={(field) => setSorter({ field, order: toggleOrder() })}
/>
```

**Props:**
- `field` -- Column field name
- `label` -- Display text
- `currentSort` -- Currently active sort field
- `currentOrder` -- Current sort direction (`asc` or `desc`)
- `onSort` -- Called when header is clicked

### ListToolbar

Shared toolbar for list pages with search input and archive filter.

```tsx
<ListToolbar
  search={searchText}
  onSearchChange={setSearchText}
  archiveFilter={archiveFilter}
  onArchiveFilterChange={setArchiveFilter}
>
  {/* Optional extra controls */}
</ListToolbar>
```

**Props:**
- `search` / `onSearchChange` -- Search input state
- `archiveFilter` / `onArchiveFilterChange` -- Archive segmented control (`active`, `all`, `archived`)
- `children` -- Additional controls placed between search and archive filter

### RatingField

Interactive star rating component. Internal value is 0-10, displayed as 0-5 stars with half-star precision.

```tsx
<RatingField value={form.values.rating} onChange={(v) => form.setFieldValue("rating", v)} />
<RatingField value={record.rating} readOnly />
```

**Props:**
- `value` -- Rating on 0-10 scale
- `onChange` -- Called with new rating value
- `readOnly` -- Disables interaction (default: false)
- `size` -- Icon size in pixels (default: 20)

Also exports `RatingDisplay` for simple text display (`{value}/10`).

### ArchiveToggle

Switch for setting archived status on edit forms.

```tsx
<ArchiveToggle value={form.values.archived} onChange={(v) => form.setFieldValue("archived", v)} />
```

Also exports `ArchiveBadge` for read-only display (shows red "Archived" badge when true).

## Anatomy-Specific Components

### ProfileEditor (`src/components/anatomy/profile-editor.tsx`)

Form for creating or editing anatomy profiles. Fetches all active attributes and renders a textarea for each one. Saves the profile as a JSON object mapping attribute names to values.

```tsx
<ProfileEditor
  songId={songId}
  profileId={existingProfile?.id}
  initialValues={parsedProfileValues}
  onSaved={() => refetchSong()}
  onCancel={() => setEditing(false)}
/>
```

**Props:**
- `songId` -- The anatomy song this profile belongs to
- `profileId` -- Existing profile ID for updates (omit for creation)
- `initialValues` -- Pre-populated attribute values (`Record<string, string>`)
- `onSaved` -- Callback after successful save
- `onCancel` -- Callback for cancel action

## Data Provider

The data provider (`src/providers/data-provider.ts`) implements Refine's `DataProvider` interface with a custom REST client:

- All requests include `credentials: "include"` for cookie-based auth
- `getList` maps Refine's pagination, sorting, and filter parameters to API query strings
- `getOne` fetches single records
- `create` sends POST requests
- `update` sends PUT requests
- `deleteOne` sends a PUT with `{ archived: true }` (no actual deletion)
- `custom` supports arbitrary API calls with configurable method and payload

**Filter mapping:**
- `search` filter maps to `search` and `q` query params
- `archived` filter maps to `archived` query param
- `sourceId` filter maps to `sourceId` query param
- `voiceGender` filter maps to `voiceGender` query param

The API base URL is set via `VITE_API_URL`. In development, it defaults to empty string (same origin), and Vite proxies `/api` to `http://localhost:3001`.

## Auth Provider

The auth provider (`src/providers/auth-provider.ts`) implements Refine's `AuthProvider` interface:

| Method | Action | Endpoint |
|--------|--------|----------|
| `login` | POST email/password | `/api/auth/sign-in/email` |
| `logout` | POST sign out | `/api/auth/sign-out` |
| `check` | GET session validity | `/api/auth/get-session` |
| `getIdentity` | GET user info | `/api/auth/get-session` |
| `onError` | Trigger logout on 401 | -- |

All requests use `credentials: "include"` for cookie-based session management.

## Theming Guide

### Color Scheme
- Default: **Dark mode** (`defaultColorScheme="dark"`)
- Primary color: **Violet**
- Section colors in sidebar: Violet (My Music), Teal (Anatomy), Orange (Bin), Pink (Suno Studio)

### Fonts
- **Poppins** (body and headings): Set globally in the Mantine theme. Available weights: 300, 400, 500, 600, 700.
- **Righteous** (brand only): Applied inline on the "vibeyvibe" brand text in the sidebar and login page. Usage: `style={{ fontFamily: "'Righteous', cursive" }}`
- Both loaded from Google Fonts in `index.html`.

### Theme Configuration

Defined in `src/theme.ts`:

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
- Use Mantine's spacing scale via component props (`gap`, `p`, `m`, etc.)
- Use `c="dimmed"` for secondary text.
- Use `withBorder` on Cards for visual separation.
- Notifications are positioned at `top-right` via the `Notifications` provider.

### Icons

All icons from `@tabler/icons-react`. Section icons:

| Icon | Usage |
|------|-------|
| `IconMusic` | My Music section |
| `IconDna` | Anatomy section |
| `IconTrash` | Bin section (section icon, not delete) |
| `IconBrain` | Suno Studio section |
| `IconMicrophone2` | Artists |
| `IconDisc` | Albums |
| `IconMusicBolt` | Songs |
| `IconAdjustments` | Attributes |
| `IconDatabase` | Sources |
| `IconMessageChatbot` | Prompts |
| `IconFolder` | Collections |
| `IconSparkles` | Generations |
| `IconLayoutDashboard` | Dashboard |

## No Delete Actions

Never add delete buttons, delete actions, or delete confirmation dialogs. Archiving is the only way to "remove" records, done through the edit page's `ArchiveToggle` component. List pages filter by archive status using the `ListToolbar` component.

## Deployment to Bunny CDN

### Build

```bash
pnpm build:web
```

Output goes to `apps/web/dist/`.

### Build-Time Environment Variables

These are baked into the build at compile time (Vite `import.meta.env`):

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | Production API URL | e.g., `https://api.yourdomain.com` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | Enables Google sign-in button |

### Deploy Steps

1. Build: `pnpm build:web`
2. Verify locally: `pnpm --filter @vibeyvibe/web preview`
3. Upload `apps/web/dist/` contents to your Bunny CDN storage zone
4. Configure the pull zone to serve from the storage zone
5. Set up a custom hostname if desired
6. **SPA routing**: Set the 404 page to `/index.html` so React Router handles all client-side routes
7. **CORS**: Ensure the API's `FRONTEND_URL` environment variable matches the CDN domain
