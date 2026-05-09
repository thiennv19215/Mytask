# Project Structure

Last updated: 2026-05-08

This document describes the current project structure and the rules for changing it. When routes, features, navigation, or major folders change, update the Change Log at the bottom of this file.

## Stack

- Framework: Next.js App Router
- UI: React components with CSS Modules
- Styling entry: `app/globals.css`
- Shared types/icons: `shared`
- Main validation command: `npm run build`

## Root Layout

```text
ntw-next-app/
  app/                  Next.js routes and route entry files
  docs/                 Project documentation and execution plans
  features/             Feature-owned UI, data, and tool screens
  public/               Static assets
  shared/               Shared types and reusable UI primitives
  package.json          Scripts and dependencies
  tsconfig.json         TypeScript config
```

Generated or dependency folders such as `.next/`, `node_modules/`, and `output/` should not be treated as source architecture.

## Route Structure

Routes live in `app/`. Route files should stay thin and delegate UI to `features/`.

```text
app/
  layout.tsx
  page.tsx                         Home route `/`
  about/page.tsx                   `/about`
  apps/page.tsx                    `/apps`
  apps/image-generator/page.tsx    `/apps/image-generator`
  apps/product-video/page.tsx      `/apps/product-video`
  apps/script-analyzer/page.tsx    `/apps/script-analyzer`
  apps/video-generator/page.tsx    `/apps/video-generator`
  chatbot/page.tsx                 `/chatbot`
  pricing/page.tsx                 `/pricing`
  prompts/page.tsx                 `/prompts`
  resources/page.tsx               `/resources`
```

Removed routes:

- `/templates` was removed from route, navigation, and feature code.
- `/history` was replaced by `/resources` and removed from route, feature code, navigation types, and icon types.

## Feature Structure

Feature code lives in `features/`.

```text
features/
  app-shell/             Global app shell, sidebar, top nav, navigation data
  apps/                  App library and individual AI tool screens
  home/                  Home page data/UI
  placeholder-pages/     Shared preview pages for about, pricing, prompts, chatbot, resources
```

### `features/app-shell`

Owns the persistent shell around pages.

Important files:

- `components/app-shell.tsx`: root shell wrapper, sidebar collapsed state.
- `components/sidebar.tsx`: left navigation and collapse control.
- `components/top-nav.tsx`: top navigation and mobile menu.
- `components/app-shell.module.css`: shell, sidebar, and top nav styles.
- `shell-navigation.ts`: source of navigation items.

Navigation rules:

- `navItems` drives the sidebar.
- `topNavItems` drives the top nav.
- Keep top nav focused on primary routes.
- If a route is removed, remove it from `shell-navigation.ts`, `shared/types/navigation.ts`, and any page/feature folders.

### `features/apps`

Owns `/apps` and all app/tool screens.

```text
features/apps/
  apps.data.ts
  components/
    apps-library.tsx
    apps-library.module.css
    apps-icons.tsx
  tools/
    image-generator/components/
    product-video/components/
    script-analyzer/components/
    video-generator/components/
```

To add a new AI app:

1. Add the tool metadata in `features/apps/apps.data.ts`.
2. Add a route under `app/apps/<slug>/page.tsx`.
3. Add the screen under `features/apps/tools/<slug>/components/`.
4. Use a CSS Module beside the component.
5. Run `npm run build`.

Current app cards:

- `Tạo ảnh AI` -> `/apps/image-generator`
- `Tạo video AI` -> `/apps/video-generator`
- `Làm video product` -> `/apps/product-video`
- `Phân tích kịch bản` -> `/apps/script-analyzer`

### `features/placeholder-pages`

Provides shared page bodies for routes that do not yet have a dedicated feature folder.

Current consumers:

- `/about`
- `/chatbot`
- `/pricing`
- `/prompts`
- `/resources`

Note: `/resources` currently represents the media library for generated images and videos. It is no longer a guide/checklist resource page.

## Shared Structure

```text
shared/
  types/navigation.ts    PageKey, IconName, NavItem
  ui/icons.tsx           Reusable inline SVG icons
```

Shared rules:

- Add new navigation keys in `shared/types/navigation.ts`.
- Add icons in `shared/ui/icons.tsx` only when used by shared navigation or reusable components.
- Remove unused keys/icons when routes are deleted.

## Styling Rules

- Use CSS Modules for feature/component styles.
- Keep global tokens and resets in `app/globals.css`.
- Prefer existing CSS variables such as `var(--navy)`, `var(--surface)`, `var(--muted)`, and `var(--active)`.
- Keep operational UI calm, dense, and easy to scan.
- Avoid adding unrelated decorative colors outside the project theme.

## Build Rule

After route, navigation, type, or feature changes, run:

```bash
npm run build
```

Do not consider structural work complete until the build passes.

## Change Log

Record future structural changes here with date, summary, and affected paths.

### 2026-05-08

- Removed `/templates` and `features/templates`.
- Replaced `/history` with `/resources`.
- Removed `/history`, `features/history`, `history` navigation type, and `HistoryIcon`.
- Added `/apps/product-video` and `features/apps/tools/product-video`.
- Updated `/resources` to act as a generated media library for images and videos.
- Kept `/prompts` as a sidebar-accessible prompt library route.
