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
│   │   ├── songs/        # list.tsx, create.tsx, edit.tsx, show.tsx
│   │   ├── artists/      # list.tsx, create.tsx, edit.tsx, show.tsx
│   │   └── albums/       # list.tsx, create.tsx, edit.tsx, show.tsx
│   ├── anatomy/          # Anatomy resource pages
│   │   ├── songs/        # list.tsx, create.tsx, edit.tsx, show.tsx
│   │   ├── artists/      # list.tsx, create.tsx, edit.tsx, show.tsx
│   │   ├── attributes/   # list.tsx, create.tsx, edit.tsx, show.tsx
│   │   └── import.tsx    # Spotify import page (preview + confirm flow)
│   ├── bin/              # Bin resource pages
│   │   ├── songs/        # list.tsx, create.tsx, edit.tsx, show.tsx
│   │   └── sources/      # list.tsx, create.tsx, edit.tsx, show.tsx
│   └── suno/             # Suno Studio resource pages
│       ├── prompts/      # list.tsx, create.tsx, edit.tsx, show.tsx
│       ├── collections/  # list.tsx, create.tsx, edit.tsx, show.tsx
│       └── generations/  # list.tsx, create.tsx, edit.tsx, show.tsx
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
| `/my-music/songs/create`          | Create         | Add a new song                 |
| `/my-music/songs/:id`             | Show           | Song detail view               |
| `/my-music/songs/:id/edit`        | Edit           | Edit song                      |
| `/my-music/artists`               | List           | My artists list                |
| `/my-music/artists/create`        | Create         | Add a new artist               |
| `/my-music/artists/:id`           | Show           | Artist detail view             |
| `/my-music/artists/:id/edit`      | Edit           | Edit artist                    |
| `/my-music/albums`                | List           | My albums list                 |
| `/my-music/albums/create`         | Create         | Add a new album                |
| `/my-music/albums/:id`            | Show           | Album detail view              |
| `/my-music/albums/:id/edit`       | Edit           | Edit album                     |
| `/anatomy/songs`                  | List           | Anatomy songs list             |
| `/anatomy/songs/create`           | Create         | Add anatomy song               |
| `/anatomy/songs/:id`              | Show           | Anatomy song detail            |
| `/anatomy/songs/:id/edit`         | Edit           | Edit anatomy song              |
| `/anatomy/artists`                | List           | Anatomy artists list           |
| `/anatomy/artists/create`         | Create         | Add anatomy artist             |
| `/anatomy/artists/:id`            | Show           | Anatomy artist detail          |
| `/anatomy/artists/:id/edit`       | Edit           | Edit anatomy artist            |
| `/anatomy/attributes`             | List           | Attributes list                |
| `/anatomy/attributes/create`      | Create         | Add attribute                  |
| `/anatomy/attributes/:id`         | Show           | Attribute detail               |
| `/anatomy/attributes/:id/edit`    | Edit           | Edit attribute                 |
| `/anatomy/import`                 | Import         | Import songs from Spotify URLs |
| `/bin/songs`                      | List           | Bin songs list                 |
| `/bin/songs/create`               | Create         | Add bin song                   |
| `/bin/songs/:id`                  | Show           | Bin song detail                |
| `/bin/songs/:id/edit`             | Edit           | Edit bin song                  |
| `/bin/sources`                    | List           | Bin sources list               |
| `/bin/sources/create`             | Create         | Add bin source                 |
| `/bin/sources/:id`                | Show           | Bin source detail              |
| `/bin/sources/:id/edit`           | Edit           | Edit bin source                |
| `/suno/prompts`                   | List           | Suno prompts list              |
| `/suno/prompts/create`            | Create         | Create prompt                  |
| `/suno/prompts/:id`               | Show           | Prompt detail                  |
| `/suno/prompts/:id/edit`          | Edit           | Edit prompt                    |
| `/suno/collections`               | List           | Collections list               |
| `/suno/collections/create`        | Create         | Create collection              |
| `/suno/collections/:id`           | Show           | Collection detail              |
| `/suno/collections/:id/edit`      | Edit           | Edit collection                |
| `/suno/generations`               | List           | Generations list               |
| `/suno/generations/create`        | Create         | Create generation              |
| `/suno/generations/:id`           | Show           | Generation detail              |
| `/suno/generations/:id/edit`      | Edit           | Edit generation                |

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
- `useTable` -- List pages with server-side pagination, sorting, and filtering
- `useForm` -- Create and edit pages with form state management
- `useShow` -- Show pages to fetch a single record
- `useList` / `useOne` -- Ad-hoc data fetching
- `useCreate` / `useUpdate` -- Programmatic mutations
- `useLogin` / `useLogout` -- Auth actions

### Mantine Components
Use Mantine v8 components for all UI:
- Layout: `Box`, `Group`, `Stack`, `SimpleGrid`, `Center`
- Data display: `Card`, `Text`, `Title`, `Badge`
- Forms: `TextInput`, `PasswordInput`, `NumberInput`, `Select`, `Textarea`
- Navigation: `NavLink`, `Tabs`, `Breadcrumbs`
- Feedback: `Button`, `ActionIcon`, `Notifications`
- Overlay: `Modal`, `Drawer`

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

Each resource follows a standard four-page pattern inside its own directory:

```
pages/{section}/{resource}/
├── list.tsx     # Table/list view with pagination, sorting, search, archive filter
├── create.tsx   # Form to create a new record
├── edit.tsx     # Form to edit an existing record (pre-populated)
└── show.tsx     # Read-only detail view of a single record
```

### List Pages
- Use `useTable` hook for server-side data fetching
- Default `pageSize: 20` on all list pages
- Include search input for text filtering via `ListToolbar` component
- Include archive status segmented control (Active/All/Archived)
- Paginate with Refine's built-in pagination
- Clickable name column navigates to show page (`cursor: pointer`, `onClick → show(resource, id)`)
- Row actions: Edit button only (no View button) + PlatformLinks for songs -- never Delete
- Use `ArchiveBadge` in Status column (shows green "Active" or red "Archived")

### Create Pages
- Use `useForm` hook with validation
- Match the Zod schema from the API for field requirements
- Submit via POST to the resource endpoint
- Redirect to show page on success

### Edit Pages
- Use `useForm` hook with `refineCoreProps: { action: "edit" }`
- Pre-populate fields from existing record
- Use `FileUpload` + `ImagePreview` for image fields (not TextInput)
- Button layout: `[ArchiveButton]` on left, `[Save] [Cancel]` on right (`Group justify="space-between"`)
- `ArchiveButton` calls `onFinish({ archived: newValue })` directly with confirmation modal
- Submit via PUT to the resource endpoint
- Redirect to show page on success

### Show Pages
- Use `useShow` hook to fetch record by ID
- Display all fields in a readable layout
- Include navigation to edit page
- Show archive status prominently with `ArchiveBadge`
- Song show pages use two-column layout: main content (flex:1) + right panel (300px) with `MediaEmbeds`
- Platform IDs (Spotify, Apple Music, YouTube) displayed as clickable links to external URLs

## Validation

Client-side validation mirrors the Zod schemas defined on the API side. Use Mantine form validation or the Refine form integration to validate before submission:
- Required fields match the API's `.min(1)` constraints
- Format patterns (ISRC, ISNI, EAN, social usernames) should match the API regex patterns
- Numeric ranges (ratings 0-5) should be enforced in the UI

## No Delete Buttons

There are no delete buttons, delete actions, or delete confirmation dialogs anywhere in the UI. To archive a record, use the archive toggle on the edit page (sets `archived = true` via PUT). List pages can filter by archive status to show/hide archived records.

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
