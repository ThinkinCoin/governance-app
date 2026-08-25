# Vite Migration Plan

## Status

- **State:** planned; implementation not started
- **Recorded on:** 2026-08-25
- **Baseline:** `origin/develop` at `0f5d1ce76bb81af5fb65ef8e251384b7159b55b1`
- **Implementation branch:** create `feat/vite-migration` from the latest `develop` when implementation is authorized
- **Excluded base:** the `rollback` branch is temporary and must not be used as the migration base

This document records the agreed direction for a future migration. The documentation branch does not authorize or start
the implementation.

## Decision

Migrate the application from the Next.js App Router to **React Router Framework Mode powered by Vite**, while retaining
a small Node server/BFF for server-owned responsibilities.

A browser-only Vite SPA is not an acceptable target while the application depends on private backend URLs, RPC keys,
admin authorization forwarding, request cookies, dynamic metadata, CSP nonces, and server-side monitoring. These
contracts must stay outside the browser bundle.

## Goals

- Make local startup and hot updates materially faster and more predictable.
- Preserve all user-visible routes, wallet flows, DAO/plugin behavior, and React Query semantics.
- Preserve server-side security boundaries for backend, admin-backend, and RPC traffic.
- Preserve SSR where it provides metadata, cookie hydration, initial data, or security value.
- Reduce framework coupling so that application modules remain portable React code.

## Non-goals

- Redesigning the UI or changing product behavior.
- Changing backend or smart-contract APIs as part of the framework migration.
- Moving server-only environment variables into `VITE_*` variables or the client bundle.
- Rewriting AppKit, Wagmi, React Query, Tailwind, or the plugin registry without a demonstrated compatibility need.
- Removing the Next.js application before parity and rollback evidence exist.

## Current Baseline

The inventory below is a point-in-time sizing aid, not a fixed scope contract:

| Area                         | Baseline |
| ---------------------------- | -------: |
| Files under `src/app`        |       32 |
| Page routes                  |       15 |
| App Router layouts           |        6 |
| API route handlers           |        3 |
| Files importing Next.js APIs |      152 |
| Files marked `use client`    |      163 |

The UI is already predominantly client-side and the code under `src/modules`, `src/plugins`, and `src/shared` is highly
reusable. The main migration cost is concentrated in routing and server contracts rather than in visual components.

## Target Architecture

```text
Browser
  React 19 + React Router route modules + React Query + AppKit/Wagmi
      |
      | same-origin HTTP
      v
Node application server / BFF
  SSR, loaders, resource routes, cookies, CSP/security headers, monitoring
      |
      +--> Governance backend
      +--> Admin backend
      +--> Private RPC providers
```

Use React Router route modules for pages, nested layouts, loaders, actions, metadata, errors, and resource routes. Keep
the BFF in the same deployable application unless deployment constraints discovered during the spike justify a separate
service.

## Contract Mapping

| Current Next.js contract             | Target contract                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| `src/app/**/page.tsx`                | React Router route module component                                                |
| `layout.tsx`                         | Nested route layout with `Outlet`                                                  |
| Async Server Component prefetch      | Route `loader` plus React Query dehydration/hydration                              |
| `generateMetadata` / static metadata | Route `meta`/head contract backed by loader data                                   |
| `next/navigation`                    | React Router navigation, params, location, and search-param APIs                   |
| `next/link`                          | React Router `Link` through the existing shared link abstraction                   |
| `next/image`                         | Shared image component using native responsive images or an approved image service |
| `next/headers`                       | Loader/action request headers and cookies                                          |
| `src/app/api/**/route.ts`            | Same-origin resource routes/BFF handlers                                           |
| Next middleware CSP nonce            | Node request middleware and SSR nonce propagation                                  |
| `next.config.mjs` headers/redirects  | Server middleware/configuration and router redirects                               |
| `@sentry/nextjs` instrumentation     | Sentry browser and Node integrations for the selected runtime                      |

## Server Contracts That Must Remain Intact

1. `/api/backend/**` must continue proxying the governance API without exposing `ARAGON_BACKEND_URL` unnecessarily.
2. `/api/admin-backend/**` must continue forwarding admin requests and authorization safely.
3. `/api/rpc/:chainId` must keep all private RPC provider keys server-only.
4. Wagmi must receive its initial state from request cookies without hydration mismatches.
5. Feature-flag overrides must continue resolving from request cookies on the server.
6. DAO and proposal metadata must remain correct for direct navigation and link previews.
7. CSP, security headers, redirects, CORS behavior, and CSP reporting must retain equivalent protection.
8. Sentry release, error, trace, replay-worker, and source-map behavior must be explicitly revalidated.

## Delivery Plan

### Phase 0 - Measured Spike (3-5 working days)

- Create `feat/vite-migration` from the latest `develop`.
- Scaffold React Router Framework Mode with the intended production adapter/runtime.
- Reuse the existing root CSS and prefer the UI kit's precompiled `@aragon/gov-ui-kit/build.css` to avoid rescanning its
  full Tailwind source during every development compilation.
- Implement the root shell, providers, `/`, one DAO dashboard route, and `/api/backend/**`.
- Prove AppKit/Wagmi cookie hydration, React Query loader hydration, dynamic metadata, CSP, and error monitoring.
- Benchmark cold start, first usable page, and one representative CSS/TSX hot update on the same machine and storage.

**Spike exit:** proceed only if the vertical slice has functional parity and development feedback is at least 3x faster
than the measured Next.js baseline. Record filesystem type with the benchmark.

### Phase 1 - Runtime Foundation

- Define the route manifest and nested layout tree.
- Add browser and server entry points, environment validation, aliases, CSS/Tailwind integration, and static assets.
- Port shared `Link`, `Image`, navigation, redirect, and error-boundary abstractions before leaf components.
- Establish request-scoped React Query, feature-flag, Wagmi, locale, and plugin-registry initialization.
- Add server middleware for security headers, CSP nonce propagation, redirects, and CORS.

### Phase 2 - Server Boundary

- Port backend, admin-backend, and RPC proxies to resource routes.
- Refactor proxy utilities from `NextRequest`/`NextResponse` to Web `Request`/`Response` where possible.
- Preserve header sanitization, response streaming/no-content behavior, status codes, and authorization forwarding.
- Replace Next-specific proxy test generators with standard Request/Response fixtures.

### Phase 3 - Route Migration

Migrate in vertical slices so each batch remains testable:

1. Explore/home and create-DAO entry.
2. DAO shell and dashboard.
3. Assets and transactions.
4. Members and member details.
5. Proposals, proposal details, and create-proposal wizard.
6. Settings and plugin catch-all routes.
7. Policy/process flows and remaining plugin-specific pages.

For every slice, port route params, search params, loader prefetch, hydration, metadata, navigation, errors, loading
states, and relevant unit/integration tests together.

### Phase 4 - Observability and Build Pipeline

- Replace Next-specific Sentry configuration and verify source-map upload in a non-production deployment.
- Replace Next lint/build scripts and remove obsolete Next mocks only after their consumers are migrated.
- Decide whether existing Jest tests remain on Jest or move incrementally to Vitest; do not combine a full test-runner
  rewrite with the first routing slice.
- Update CI, preview deployment, environment setup, bundle analysis, and release documentation.

### Phase 5 - Parity, Cutover, and Removal

- Run the complete route/API/security acceptance matrix against Next and Vite builds.
- Capture browser evidence for wallet connect, DAO navigation, proposal actions, admin flows, and RPC-backed operations.
- Exercise deployment rollback before changing the default production entry point.
- Switch traffic only after acceptance and rollback evidence are approved.
- Remove Next.js dependencies, configuration, mocks, and `src/app` only after the cutover is stable.

## Verification Gates

The migration is not complete until all of the following are evidenced:

- All 15 current page routes and redirects have behavior parity on direct load and client navigation.
- The three same-origin proxy families pass contract/integration tests and do not expose server secrets in built assets.
- Wallet reconnect and cookie hydration work without React hydration warnings.
- React Query initial data, pagination, mutations, invalidation, and error states remain correct.
- Dynamic DAO/proposal metadata is correct in server-rendered HTML.
- Production CSP has no unexplained violations; security headers and CSP reporting are present.
- Sentry captures browser and server errors with the expected release and readable source maps.
- Unit, integration, type, lint, production build, and critical browser flows pass.
- The Vite development benchmark is captured on the same environment as the Next baseline.
- A tested deployment rollback path exists.

## Risks and Mitigations

| Risk                                              | Mitigation                                                                                     |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Private API/RPC credentials leak into the client  | Keep same-origin BFF routes and fail builds that contain known secret values                   |
| Wallet state hydrates differently                 | Prove cookie-derived Wagmi state in the spike before broad route work                          |
| Server Component behavior is lost                 | Move request data and prefetch into loaders; keep SSR for affected routes                      |
| CSP blocks AppKit, monitoring, or runtime scripts | Implement nonce propagation early and test production headers, not only dev CSP                |
| Dynamic plugin catch-all routes regress           | Migrate plugin resolution as a dedicated vertical slice with route-contract tests              |
| Migration becomes a simultaneous redesign         | Enforce behavior/visual parity and keep UI changes out of migration commits                    |
| Vite remains slow on WSL mounted storage          | Benchmark honestly and prefer WSL ext4 under `/home` or Windows-native execution over `/mnt/d` |
| Dual implementations drift                        | Keep the overlap time-boxed and merge small vertical slices with explicit parity evidence      |

## Estimate

For one engineer familiar with the application:

- Spike: 3-5 working days.
- Parity implementation: approximately 3-4 weeks.
- Stabilization, deployment, and cutover: approximately 1-2 weeks.
- Expected total: approximately 4-6 weeks, adjusted after the spike.

The estimate excludes feature work, visual redesign, backend contract changes, and delays caused by deployment-platform
decisions.

## Open Decisions for the Spike

- Confirm the production Node runtime/hosting adapter and its support for SSR, resource routes, streaming, and headers.
- Confirm whether all routes remain SSR-enabled or only routes needing metadata, cookies, or initial server data.
- Confirm whether the BFF stays inside the React Router deployable or becomes a separately deployed Node service.
- Confirm the image optimization replacement and caching contract.
- Confirm Jest retention versus incremental Vitest adoption.

## Branch and Commit Strategy

- Keep this plan on `docs/vite-migration-plan`.
- Start implementation later on `feat/vite-migration`, based on the latest `develop`, never on `rollback`.
- Use scoped commits per phase/vertical slice and keep the application runnable at each checkpoint.
- Do not push, merge, deploy, or remove the Next.js implementation without explicit authorization.
