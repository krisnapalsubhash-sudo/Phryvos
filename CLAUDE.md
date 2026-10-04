# Phryvos Next.js — AI Assistant Context

## Project Overview
Phryvos is a global social discovery platform (formerly "Ideavo") built with Next.js 15, React 19, TypeScript, and Tailwind CSS v3. The core feature is real-time stranger matching via a "Radar" interface with SSE-based matchmaking.

## Architecture

### Key Directories
- `src/app/` — Next.js App Router pages
- `src/components/` — React components (ui/, layout/, effects/, chat/, feed/, activities/, etc.)
- `src/store/` — Zustand stores (auth, posts, realtime, connections, theme, ui, stories, features)
- `src/lib/` — Core libraries (realtime engine, safety engine, sound, mock data)
- `src/design-system/` — Design tokens and theme provider
- `src/hooks/` — Custom React hooks
- `src/types/` — TypeScript type definitions

### Realtime System
- **SSE-based** via `/api/realtime/stream` (GET) and `/api/realtime/action` (POST)
- `RealtimeServerEngine` (in-memory singleton) manages:
  - Matchmaking queue
  - Active rooms
  - Client connections
  - Message broadcasting
- `SafetyEngine` enforces:
  - Rate limiting (12 msgs / 5 sec)
  - Profanity masking
  - Blocklist enforcement
  - Report collection

### State Management
8 Zustand stores with localStorage persistence:
- `auth.ts` — User auth & profile
- `posts.ts` — Feed posts
- `realtime.ts` — Matchmaking state, chat messages
- `connections.ts` — Friend connections
- `theme.ts` — Light/dark theme
- `ui.ts` — UI state (modals, drawers)
- `stories.ts` — Stories hub
- `features.ts` — Feature flags

## Design System
- **Tokens**: `src/design-system/tokens.ts` — colors, spacing, typography, motion, shadows, breakpoints
- **CSS Variables**: Injected via `theme-provider.tsx` at runtime
- **Tailwind Utilities**: Defined in `tailwind.config.js` plugin:
  - `.phryvos-gradient`, `.phryvos-gradient-text`, `.phryvos-glow`
  - `.glass-panel`, `.glass-surface`, `.interactive-surface`
  - `.hero-glow-mesh`, `.btn-icon`, `.no-scrollbar`
  - Custom border-radius: `br-xs`, `bl-xs`

## Branding
- **Canonical name**: "Phryvos" (not "Ideavo")
- **Tagline**: "Where Strangers Become Stories"
- **Gradient**: `#3B82F6 → #6366F1 → #8B5CF6`

## Development Commands
```bash
pnpm install        # Install dependencies
pnpm dev --port 4000  # Dev server
pnpm typecheck      # TypeScript check
pnpm test           # Run tests (vitest)
```

## Deployment
- **Docker**: `docker compose up -d` (requires `.env` with `CLOUDFLARE_TUNNEL_TOKEN`)
- **Services**: Next.js (port 4000), Redis, PostgreSQL, Cloudflare Tunnel
- **Environment**: See `.env.example`

## Testing
- **Framework**: Vitest + React Testing Library
- **Tests**: `src/lib/safety/engine.test.ts`, `src/lib/realtime/engine.test.ts`
- **Setup**: `vitest.config.ts`, `vitest.setup.ts`

## Known Issues / TODOs
1. **In-memory realtime** — Replace with Redis for horizontal scaling
2. **Mock auth** — Replace with NextAuth.js + database
3. **Mock data** — Replace with API + Prisma + seed scripts
4. **No CI/CD** — Add GitHub Actions workflow
5. **Accessibility** — Add ARIA attributes, focus management
6. **Performance** — Lazy-load heavy components (TiltedSolarCanvas, GalaxyCanvas)
7. **Bundle audit** — Some unused deps may remain

## Code Conventions
- TypeScript strict mode enabled
- Functional components with hooks
- Tailwind utility-first styling
- Framer Motion for animations
- Sonner for toasts
- Radix UI (via `radix-ui` meta-package) for primitives