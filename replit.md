# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## FSM App — Field Service Management

Multi-tenant FSM web app at `artifacts/fsm-app`. React + Vite + Tailwind, powered by Express 5 + PostgreSQL.

### Roles & Routes
- **Manager** (`/manager`): Dashboard, Leads, Quotes (w/ PDF), Jobs, Users, Settings
- **Sales** (`/sales`): Dashboard, Leads, Quotes
- **Field Staff** (`/field`): Dashboard, Jobs list, Job Completion (photo + signature canvas)

### Key Details
- `AppContext` holds `tenantId=1` (demo) and `user` state (role-based)
- All API routes scoped under `/api/tenants/:tenantId/...`
- Two demo tenants: `Apex Field Services` (USD/Stripe) and `ProServ SA` (ZAR/Paystack)
- Demo seeded: 6 users, 5 leads, 4 jobs, 2 quotes
- Payment provider toggleable in Settings; currency auto-follows provider
- Quote PDF generated via `window.open` print dialog (no external library)
- Job completion captures photo (FileReader data URL) + canvas signature → stored as data URLs

### Packages
- `lib/api-spec` — OpenAPI spec + orval codegen → `lib/api-client-react` + `lib/api-zod`
- `lib/api-client-react` — React Query hooks for all endpoints
- `lib/db` — Drizzle schema: tenants, users, leads, quotes, jobs
- `artifacts/api-server` — Express 5 routes handler (rebuilt with esbuild on each dev start)
