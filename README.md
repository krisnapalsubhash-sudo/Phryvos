# Phryvos Next.js — Social Discovery Platform

A global social discovery & human connection platform. Connect through radar, real-time chat, and shared moments with people around the world.

## Stack Tecnológica

- **Framework**: Next.js 15.5 (App Router)
- **Linguagem**: TypeScript (strict mode)
- **Estilização**: Tailwind CSS v3 + Custom Design System (CSS Variables)
- **Estado**: Zustand v4.5.2 (persistido em localStorage)
- **Animações**: Framer Motion
- **UI Components**: shadcn/ui + Radix UI (via `radix-ui` meta-package)
- **Forms**: React Hook Form + Zod v3.22.4
- **Realtime**: Server-Sent Events (SSE)
- **Package Manager**: pnpm

## Estrutura de Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page (Phryvos branding) |
| `/login` | Autenticação |
| `/register` | Cadastro |
| `/onboarding` | Primeiro acesso |
| `/radar` | Radar discovery & stranger matching |
| `/chat` | Chat lounge & 1-on-1 messaging |
| `/feed` | Feed de posts & stories |
| `/discover` | Descoberta de usuários |
| `/profile/me` | Perfil do usuário |
| `/profile/[id]` | Perfil público |
| `/settings` | Configurações |
| `/search` | Busca global |
| `/notifications` | Notificações |

## Design System

- Tokens de cores light/dark em `src/design-system/tokens.ts`
- Gradiente Phryvos: `#3B82F6 → #6366F1 → #8B5CF6`
- Theme provider em `src/design-system/theme-provider.tsx`
- CSS utilities em `tailwind.config.js` (`.phryvos-gradient`, `.glass-panel`, `.btn-icon`, etc.)

## Stores (Zustand)

- `auth.ts` — Autenticação e perfil do usuário
- `posts.ts` — Feed de posts
- `theme.ts` — Tema claro/escuro
- `ui.ts` — Estado da interface
- `connections.ts` — Conexões e amigos
- `realtime.ts` — Estado realtime (matchmaking, chat)
- `stories.ts` — Stories hub
- `features.ts` — Feature flags

## Realtime Architecture

- **SSE-based** via Next.js API routes (`/api/realtime/stream`, `/api/realtime/action`)
- **Matchmaking queue** with blocklist enforcement
- **Rate limiting** (12 messages / 5 seconds per user)
- **Content sanitization** (profanity masking)
- **Safety engine** (block, report, mute)

## Como Rodar (Desenvolvimento)

```bash
cd /root/projects/phryvos
pnpm install
pnpm run dev --port 4000
```

## Verificação de Tipo

```bash
pnpm run typecheck
```

## Docker (Produção)

```bash
# Build
docker compose build

# Run (requires .env with CLOUDFLARE_TUNNEL_TOKEN)
docker compose up -d
```

## Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

## Arquivos Principais

- `src/app/page.tsx` — Landing page
- `src/app/layout.tsx` — Layout raiz
- `src/components/layout/AppShell.tsx` — Shell do app (sidebar + feed)
- `src/store/auth.ts` — Auth store
- `src/design-system/tokens.ts` — Design tokens
- `src/lib/realtime/engine.ts` — Servidor realtime (em memória)
- `src/lib/safety/engine.ts` — Engine de segurança
- `src/app/(app)/radar/page.tsx` — Radar page (matchmaking + chat)
- `src/app/(app)/chat/page.tsx` — Chat lounge page
- `src/app/(app)/feed/page.tsx` — Feed page

## Próximos Passos (Roadmap)

- [ ] Migrar realtime engine para Redis (escala horizontal)
- [x] Adicionar autenticação real com NextAuth.js
- [x] Adicionar banco de dados PostgreSQL com Prisma
- [ ] Testes unitários (Vitest) para safety/realtime engines
- [ ] Testes de integração para API routes
- [ ] Substituir dados mock por API + seed de desenvolvimento
- [ ] Accessibility improvements (ARIA, focus management)
- [ ] Performance: lazy-load heavy components (TiltedSolarCanvas, GalaxyCanvas)