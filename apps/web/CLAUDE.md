# vibeyvibe Web Frontend

Refine v5 (headless) + Mantine UI v8 single-page application for the vibeyvibe music management system.

## Overview

The web app is a React 19 SPA built with Refine (headless CRUD framework) and Mantine (component library). It communicates with the API backend through a REST data provider. Authentication is handled via Better Auth session cookies. The app uses Vite for development and production builds, and deploys as static files to Bunny CDN.

## Directory Structure

```
src/
├── main.tsx              # React entry point: BrowserRouter, MantineProvider, Notifications, App
├── App.tsx               # Refine configuration: resources, data provider, auth provider, routes
├── theme.ts              # Mantine theme overrides: Poppins font, violet primary color
├── providers/
│   ├── auth-provider.ts  # Refine AuthProvider: login, logout, check, getIdentity, onError
│   └── data-provider.ts  # Refine DataProvider: @refinedev/simple-rest wrapping /api
├── components/
│   ├── layout/
│   │   ├── index.tsx     # Layout wrapper: ThemedLayoutV2 with custom Sider
│   │   └── sidebar.tsx   # Navigation sidebar: collapsible section groups with NavLink items
│   ├── shared/           # Reusable components shared across pages
│   └── anatomy/          # Anatomy-specific components (ProfileEditor)
├── pages/
│   ├── login.tsx         # Login page: email/password form + optional Google OAuth button
│   ├── dashboard.tsx     # Dashboard page: section overview cards with icons
│   ├── my-music/         # My Music resource pages
│   │   ├── songs/        # list.tsx, show.tsx
│   │   ├── artists/      # list.tsx, show.tsx
│   │   └── albums/       # list.tsx, show.tsx
│   ├── anatomy/          # Anatomy resource pages
│   │   ├── songs/        # list.tsx, show.tsx
│   │   ├── artists/      # list.tsx, show.tsx
│   │   ├── albums/       # list.tsx, show.tsx
│   │   ├── attributes/   # list.tsx, show.tsx
│   │   └── import.tsx    # Spotify import page (preview + confirm flow)
│   ├── bin/              # Bin resource pages
│   │   ├── songs/        # list.tsx, show.tsx
│   │   └── sources/      # list.tsx, show.tsx
│   └── suno/             # Suno Studio resource pages
│       ├── prompts/      # list.tsx, show.tsx
│       ├── collections/  # list.tsx, show.tsx
│       └── generations/  # list.tsx, show.tsx
└── utils/                # Utility functions and helpers
```

## Routing

Routing is handled by React Router v7 via the `@refinedev/react-router` integration.

### Route Map

| Path                              | Page           | Description                    |
|-----------------------------------|----------------|--------------------------------|
| `/`                               | Dashboard      | Section overview cards         |
| `/login`                          | Login          | Email/password + Google OAuth  |
| `/my-music/songs`                 | List           | My songs list                  |
| `/my-music/songs/show/:id`        | Show           | Song detail view               |
| `/my-music/artists`               | List           | My artists list                |
| `/my-music/artists/show/:id`      | Show           | Artist detail view             |
| `/my-music/albums`                | List           | My albums list                 |
| `/my-music/albums/show/:id`       | Show           | Album detail view              |
| `/anatomy/songs`                  | List           | Anatomy songs list             |
| `/anatomy/songs/show/:id`         | Show           | Anatomy song detail            |
| `/anatomy/artists`                | List           | Anatomy artists list           |
| `/anatomy/artists/show/:id`       | Show           | Anatomy artist detail          |
| `/anatomy/albums`                 | List           | Anatomy albums list            |
| `/anatomy/albums/show/:id`        | Show           | Anatomy album detail           |
| `/anatomy/attributes`             | List           | Attributes list                |
| `/anatomy/attributes/show/:id`    | Show           | Attribute detail               |
| `/anatomy/import`                 | Import         | Import songs from Spotify URLs |
| `/bin/songs`                      | List           | Bin songs list                 |
| `/bin/songs/show/:id`             | Show           | Bin song detail                |
| `/bin/sources`                    | List           | Bin sources list               |
| `/bin/sources/show/:id`           | Show           | Bin source detail              |
| `/suno/prompts`                   | List           | Suno prompts list              |
| `/suno/prompts/show/:id`          | Show           | Prompt detail                  |
| `/suno/collections`               | List           | Collections list               |
| `/suno/collections/show/:id`      | Show           | Collection detail              |
| `/suno/generations`               | List           | Generations list               |
| `/suno/generations/show/:id`      | Show           | Generation detail              |

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

## Component Patterns

### Refine Hooks
Use Refine's data hooks for all CRUD operations:
- `useList` -- List pages with server-side data fetching
- `useShow` -- Show pages to fetch a single record
- `useOne` -- Ad-hoc single-record fetching
- `useCreate` -- Programmatic record creation (used in list page create modals)
- `useUpdate` -- Programmatic record updates (used for inline editing on show pages)
- `useLogin` / `useLogout` -- Auth actions

### Mantine Components
Use Mantine v8 components for all UI:
- Layout: `Box`, `Group`, `Stack`, `SimpleGrid`, `Center`
- Data display: `Card`, `Text`, `Title`, `Badge`
- Forms: `TextInput`, `PasswordInput`, `NumberInput`, `Select`, `Textarea`
- Navigation: `NavLink`, `Tabs`, `Breadcrumbs`
- Feedback: `Button`, `ActionIcon`, `Notifications`
- Overlay: `Modal`, `Drawer`

### EntityPage Pattern
The `EntityPage` component (`components/shared/entity-page.tsx`) is the standard wrapper for all show pages. It provides:
- **Editable title**: Click-to-edit inline title with save/cancel controls
- **Header**: Back button + title + `ArchiveBadge`
- **Body**: Main content area with optional right panel (default 300px width)
- **Footer**: `ArchiveButton` with confirmation, separated by a divider
- **States**: Loading spinner, not-found message
- **Modals slot**: For any extra modals rendered after the layout

### ImageUpload Component
The `ImageUpload` component (`components/shared/image-upload.tsx`) combines image preview and click-to-upload in one widget. Shows the current image or a placeholder with upload icon. Clicking opens a file picker, uploads via `POST /api/upload`, and calls `onUpload` with the new storage path. Used in the right panel of show pages for cover art.

### Enhanced MediaEmbeds
The `MediaEmbeds` component (`components/shared/media-embeds.tsx`) renders Spotify, Apple Music, and YouTube iframe embeds. When an `onSave` callback is provided, each platform ID becomes inline-editable (click to add/edit). Supports a `type` prop (`"track"` or `"album"`) to generate correct embed URLs. Empty slots show a "Click to add" placeholder.

### Layout
The `Layout` component (`components/layout/index.tsx`) wraps all authenticated pages using Refine's `ThemedLayoutV2` with a custom `Sider` component.

The `Sider` component (`components/layout/sidebar.tsx`) provides:
- Brand title ("vibeyvibe" in Righteous font)
- Dashboard link
- Collapsible section groups (My Music, Anatomy, Bin, Suno Studio)
- Color-coded section icons (violet, teal, orange, pink)
- Active state tracking based on current URL

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

## Page Conventions

Each resource has two pages inside its own directory:

```
pages/{section}/{resource}/
├── list.tsx     # Table/list view with pagination, sorting, search, archive filter + create modal
└── show.tsx     # Detail view with inline editing via EntityPage component
```

There are no separate create or edit pages. Create functionality lives in a modal on the list page, and all editing is done inline on the show page.

### List Pages
- Use `useList` hook for server-side data fetching
- Default `pageSize: 20` on all list pages
- Include search input for text filtering via `ListToolbar` component
- Include archive status segmented control (Active/All/Archived)
- Paginate with Refine's built-in pagination
- Clickable name column navigates to show page (`cursor: pointer`, `onClick → show(resource, id)`)
- Row actions: PlatformLinks for songs -- never Delete or Edit buttons
- Use `ArchiveBadge` in Status column (shows green "Active" or red "Archived")
- **Create modal**: Use `useDisclosure` from Mantine hooks + `useCreate` from Refine. A "+" button in the header opens a modal with a name field. On success, navigates to the new record's show page.

### Show Pages
- Use the `EntityPage` component for consistent layout and behavior
- `EntityPage` provides: editable title (click-to-edit inline), `ArchiveBadge` in header, `ArchiveButton` in footer, optional right panel, loading/not-found states
- Use `useShow` hook to fetch record by ID, `useUpdate` for inline saves
- **Right panel** (300px): `ImageUpload` for cover art + `MediaEmbeds` for platform embeds (Spotify, Apple Music, YouTube). Both support inline editing via `onSave`/`onUpload` callbacks.
- Use `EditableField` for simple text metadata fields (ISRC, dates, platform IDs, URLs). Click-to-edit with hover edit icon.
- Use `RatingField` with `onChange` for interactive inline ratings
- Use `SectionCard` for grouping related fields within the main content area
- Platform IDs are editable directly within `MediaEmbeds` (click to add/edit)

## Validation

Client-side validation mirrors the Zod schemas defined on the API side. Use Mantine form validation or the Refine form integration to validate before submission:
- Required fields match the API's `.min(1)` constraints
- Format patterns (ISRC, ISNI, EAN, social usernames) should match the API regex patterns
- Numeric ranges (ratings 0-5) should be enforced in the UI

## No Delete Buttons

There are no delete buttons, delete actions, or delete confirmation dialogs anywhere in the UI. To archive a record, use the `ArchiveButton` in the footer of the show page's `EntityPage` component (sets `archived = true` via PUT). List pages can filter by archive status to show/hide archived records.

## Icons

All icons come from `@tabler/icons-react`. Use the existing icon set consistently:
- `IconMusic` -- My Music section
- `IconDna` -- Anatomy section
- `IconTrash` -- Bin section (note: this is the section icon, not a delete action)
- `IconBrain` -- Suno Studio section
- `IconMicrophone2` -- Artists
- `IconDisc` -- Albums
- `IconMusicBolt` -- Songs
- `IconAdjustments` -- Attributes
- `IconDatabase` -- Sources
- `IconMessageChatbot` -- Prompts
- `IconFolder` -- Collections
- `IconSparkles` -- Generations
- `IconLayoutDashboard` -- Dashboard
- `IconLogin` -- Sign in action
- `IconBrandGoogle` -- Google OAuth
- `IconChevronRight` -- Expand/collapse indicator

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
