# Environment Configuration

## Runtime Environment
- **Sandbox**: This application runs in an E2B sandbox environment
- **Preview Access**: The application preview is accessible to users via an E2B-exposed URL embedded within an iframe.

## Development Server
- **Port**: The development server runs on port 4000
- **Default State**: The dev server is already running
- **Important**: Do NOT start the dev server unless explicitly requested by the user
- **If Starting**: When starting a dev server:
  1. First kill any existing process on port 4000
  2. Then start the new server instance using `bun run dev --port 4000`

## Memory Safety (earlyoom)
- **Watchdog**: The sandbox may run `earlyoom`, which monitors free memory and kills a process once free memory drops below ~5%
- **Likely target**: `next-server` is typically the largest memory consumer, so it's the most likely process to get killed — this can happen mid-session for reasons unrelated to the code just written
- **Diagnosing a kill**: If the dev server appears down, run `journalctl -u earlyoom > <scratch-path>` and check it for a kill event around that time to confirm whether earlyoom was the cause
- **No auto-restart**: earlyoom does not restart what it kills. Do NOT attempt to restart the dev server yourself
- **If it happened**: Stop running further live checks immediately. Report to the user right away instead of continuing — e.g. "next-server was not running, it needs a restart on your end. Once it's back up, I'll continue with the remaining checks."

## Package Management
- **Package Manager**: Use `bun` for all package management operations
- **Installation**: `bun install`
- **Running Scripts**: `bun run <script-name>`

## Quality Checks
- **Type Checking**: After completing tasks, run `bun run typecheck` to verify type safety
- **Build Command**: Do NOT run the build command unless the user explicitly requests it
- **Default Verification**: Use typecheck as the standard post-completion verification step

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->