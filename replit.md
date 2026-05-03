# Link Haven
<!-- Clay 3D Icon System: src/components/ui/clay-icon.tsx — ClayIcon, ClayBarIcon, ClayDot. CSS in index.css.  -->
<!-- Test account: test@nullcove.com / nullcove2024 -->

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

## Features (20+ beyond Raindrop.io)

**Core:**
- Save, organize, and rediscover bookmarks by type (link, article, video, image, document, audio)
- Collections with custom colors, icons, and bookmark counts
- Tags with sidebar navigation and tag cloud
- Full-text search and semantic AI search
- Grid / List / Domain-grouping view modes

**AI (Gemini):**
- Full Gemini AI chat panel (⌘J) — full library context, action suggestions
- Auto-tag generation, bookmark summarization, organize suggestions
- Semantic search via AI Ask panel
- Gemini API key stored server-side, never returned to frontend

**Management:**
- Pin bookmarks to top (Speed Dial, priority display)
- Bulk select/archive/delete/tag/move actions
- Import (Netscape HTML) and Export (JSON/HTML)
- Duplicate detection and broken link checker
- Note-taking per bookmark, highlight storage

**Productivity:**
- Command Palette (⌘K) for fast navigation and actions
- Advanced Filters panel (type, date, domain, tags, notes, pinned)
- Focus Mode / Reading List (clean reading UX, mark as read)
- Reading time estimation per bookmark
- Domain grouping view

**Analytics:**
- Analytics dashboard (daily/weekly activity charts, top domains, top tags, content types)
- Usage stats in Settings (total, favorites, archived, this month)
- Recent Activity panel

**Settings:**
- Gemini API key (hidden/masked input, test button, server-side only)
- Keyboard shortcuts reference
- Profile and preferences section

## Routes

- `/` — Landing page
- `/login` — Login / Signup
- `/app` — Main library (supports `?view=favorites|archive|pinned|recent|domains`, `?tag=...`)
- `/app/collection/:id` — Collection view
- `/settings` — Settings (Gemini key, profile, stats, shortcuts)
- `/analytics` — Analytics dashboard

## API Endpoints

- `GET/PUT /api/settings` — User settings (Gemini key stored masked)
- `DELETE /api/settings/gemini-key` — Remove Gemini key
- `POST /api/gemini/test` — Test Gemini connection
- `POST /api/gemini/chat` — Chat with AI (full bookmark context)
- `POST /api/gemini/summarize` — Summarize a bookmark
- `POST /api/gemini/auto-tag` — Auto-generate tags
- `POST /api/gemini/organize` — Get organization suggestions

## Keyboard Shortcuts

- `⌘K` — Command palette
- `⌘N` — Add new bookmark
- `⌘J` — Toggle Gemini AI chat
- `ESC` — Close dialogs

## DB Schema Key Tables

- `bookmarks` — id, userId, collectionId, url, title, type, tags[], isFavorite, isArchived, isPinned, note, highlight, readingTime, summary
- `collections` — id, userId, name, color, icon
- `user_settings` — id, userId, geminiApiKey, theme, defaultView, language
- `sessions` — id, userId, token, expiresAt

## Demo Credentials

- Email: demo@linkhaven.app
- Password: demo123
- Test mode: VITE_TEST_MODE=true (skips login)

## Key Files

- `artifacts/link-haven/src/pages/app/index.tsx` — Main library page
- `artifacts/link-haven/src/components/app-sidebar.tsx` — Sidebar with logo, nav, AI button
- `artifacts/link-haven/src/components/layout/app-layout.tsx` — Layout with Gemini chat
- `artifacts/link-haven/src/features/gemini-chat.tsx` — Full AI chat panel
- `artifacts/link-haven/src/features/command-palette.tsx` — ⌘K palette
- `artifacts/link-haven/src/features/advanced-filters.tsx` — Filter panel
- `artifacts/link-haven/src/features/analytics-dashboard.tsx` — Charts/stats
- `artifacts/link-haven/src/features/focus-mode.tsx` — Reading list mode
- `artifacts/link-haven/src/features/speed-dial.tsx` — Pinned bookmarks quick access
- `artifacts/link-haven/src/features/domain-grouping.tsx` — Group by domain view
- `artifacts/link-haven/src/features/tag-cloud.tsx` — Visual tag cloud
- `artifacts/link-haven/src/pages/analytics.tsx` — Analytics page
- `artifacts/link-haven/src/pages/settings.tsx` — Settings with Gemini key UI
- `artifacts/api-server/src/routes/settings.ts` — Settings API (key masking)
- `artifacts/api-server/src/routes/gemini.ts` — Gemini proxy routes
- `artifacts/link-haven/src/lib/api.ts` — Direct API call utility (auth token)
