# Copilot Instructions — Aragon App (Next.js)

These notes make AI agents productive in this repo fast. Focus on conventions, commands, and where things live.

## Big Picture
- Frontend app for managing DAOs on Aragon OSx using Next.js 16 + React 19 + TypeScript.
- Talks to Aragon OSx via the Aragon SDK/subgraph and uses the Aragon Governance UI Kit.
- Wallet/chain stack: `wagmi` + `viem` + Reown AppKit; data via TanStack Query.
- Harmony support exists; update addresses in `src/shared/constants/networkDefinitions.ts`.

## Planning & Issue Tracking Workflow

**CRITICAL: After completing planning and BEFORE starting implementation:**

1. **Generate Plan Document**: Create `PLAN.md` at repository root containing:
   - [ ] Clear task breakdown with checkboxes
   - [ ] Implementation steps and guidelines
   - [ ] Dependencies and integration points
   - [ ] Expected outcomes and acceptance criteria

2. **Sync with GitHub Project**: Using GitHub CLI (`gh` - already authenticated as mzfshark):
   ```bash
   # Create issue from PLAN.md
   gh issue create --title "[Plan] <descriptive-title>" --body-file PLAN.md --project "https://github.com/users/mzfshark/projects/15"
   ```

3. **Update Plan Progress**: As tasks complete, update checkboxes in `PLAN.md` and sync with issue:
   ```bash
   # Update the issue body with current PLAN.md
   gh issue edit <issue-number> --body-file PLAN.md
   ```

**IMPORTANT**: Never run `git commit` or `git push` automatically. Always ask the user before any git operations.

**Never start implementation without a documented plan in `PLAN.md` and corresponding GitHub issue.**

## Tool Restrictions

**FORBIDDEN: Do NOT use `codacy_get_pattern` tool** — This tool is incompatible with WSL environments and will fail. Use alternative Codacy tools for code quality analysis.

## Language Standards

**MANDATORY: All public-facing content MUST be in English:**

- **Code comments**: All comments in source code must be written in English
- **Logs and console output**: All log messages, debug output, and error messages must be in English
- **GitHub Issues**: All issue titles, descriptions, and comments must be in English
- **Commit messages**: All git commit messages must be in English following conventional commits format
- **Documentation**: All README files, inline docs, and API documentation must be in English
- **Variable/function names**: Use English for all identifiers in code

**Examples:**
```bash
# ✅ CORRECT
git commit -m "fix: resolve action composer validation for .country domains"

# ❌ INCORRECT
git commit -m "corrige validação do action composer para domínios .country"
```

**Note**: This standard ensures international collaboration and maintainability. Internal planning documents (like `PLAN.md` for local work) may use Portuguese if needed, but all published content must be English.

## Key Paths
- App router pages: `src/app/**` (Next 16).
- Shared constants/utilities: `src/shared/**` (e.g., `featureFlags`, `constants`, helpers).
- Plugins/features modules: `src/plugins/**`, `src/modules/**`, `src/daos/**`.
- Global setup: `initPluginRegistry.ts`, `instrumentation.ts`, `middleware.ts`.
- Config: `next.config.mjs`, `eslint.config.js`, `prettier.config.js`, `postcss.config.js`.

## Environment/Envs
- Use `.env.*` per environment (see table in `README.md`). Local dev reads `.env.local`.
- The `dev` script runs `scripts/setupEnv.sh` to prepare env values (`pnpm run setup local`).
- Sentry config files: `sentry.edge.config.ts`, `sentry.server.config.ts` (only active if DSN is set).

## Install, Run, Test
- Package manager: `pnpm` with Corepack. Commands:
  - Install: `pnpm install`
  - Dev server: `pnpm dev` (uses Turbopack)
  - Build: `pnpm build`
  - Start: `pnpm start`
  - Lint/format: `pnpm lint`, `pnpm lint:fix`, `pnpm prettify`, `pnpm prettify:fix`
  - Types: `pnpm type-check`
  - Tests: `pnpm test`, `pnpm test:watch`, `pnpm test:coverage`

## Terminal Timing (tests/build/type-check)

After running `test`, `type-check`, or `build` commands, wait 120 seconds before attempting to read terminal output.
- Troubleshooting (from README): `pnpm approve-builds`, `pnpm store prune`, and ensure `corepack enable`.

## Patterns & Conventions
- Data fetching: TanStack Query (+ devtools) with hooks colocated near features; prefer server components where possible, mark client components explicitly.
- Forms: `react-hook-form` (+ devtools), validation done at component boundaries.
- UI: Aragon Governance UI Kit + Tailwind v4; keep styles utility-first and avoid ad-hoc globals.
- Web3: `wagmi` connectors via Reown AppKit; ensure chain IDs map to `networkDefinitions.ts`.
- Security: Sanitize user HTML with `isomorphic-dompurify`; never render untrusted HTML without sanitation.

## Cross-Repo Integration
- OSx contract addresses must match deployed networks; update `networkDefinitions.ts` when deploying OSx.
- Backend API endpoints are consumed by modules in `src/**` (check `backendApiMocks.ts` during local dev).

## Example Tasks (Do It This Way)
- Add a network: extend `src/shared/constants/networkDefinitions.ts` (rpcUrls, contracts addresses, explorer URLs), then expose it in the selector.
- Add a feature flag: create flag in `src/shared/featureFlags`, wire in `README.md` example there, and guard the UI/route.
- Add a data view: create a `src/modules/<feature>` folder with a server component for data loading and a client component for interactivity; use a TanStack Query key scoped to the feature.

## CI/Deploy Notes
- Env-driven deployments (Preview/Develop/Staging/Prod) per README; local is `.env.local`.
- `vercel.json` config is present; ensure build uses `next build --no-lint` as per scripts.

## wsl Notes
- do not use wsl paths in any configuration or script.
- never try to run commands wsl terminal that interact with codacy cli.
