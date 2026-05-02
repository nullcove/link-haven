# Link Haven

## Overview

A full-stack Raindrop.io clone bookmark manager called "Link Haven". Users can save, organize, and rediscover links, articles, images, videos, and documents.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/link-haven), TailwindCSS, Framer Motion, shadcn/ui, Wouter routing
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Features

- **Landing page** — Rich marketing page with scroll animations, features, hero image
- **Terminal auth** — macOS/kitty terminal-styled login and signup pages with typewriter animations
- **Guest mode** — "Try without login" goes directly to the main app
- **Bookmark manager** — Full Raindrop.io-like UI with sidebar, collections, tags, search, filters
- **Collections** — Colored, icon-tagged folders for organizing bookmarks
- **Tags** — Tag-based filtering and management
- **Views** — All, Favorites, Archive, Unsorted, by collection/tag
- **Stats dashboard** — Totals, type breakdown, recent activity

## Demo Account

- Email: `demo@linkhaven.app`
- Password: `demo123`
- Pre-seeded with 18 bookmarks across 5 collections

## Auth

Session-based auth using tokens stored in localStorage as `link_haven_token`. Bearer token passed in Authorization header. Guest accounts auto-created on guest login.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## DB Schema

Tables: `users`, `sessions`, `collections`, `bookmarks`

## API Routes

All under `/api`:
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/guest`
- `GET/POST /collections`, `GET/PATCH/DELETE /collections/:id`
- `GET/POST /bookmarks`, `GET/PATCH/DELETE /bookmarks/:id`, `PATCH /bookmarks/:id/favorite`, `PATCH /bookmarks/:id/archive`
- `GET /tags`, `DELETE /tags/:name`
- `GET /stats`, `GET /stats/recent`, `GET /stats/by-type`

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
