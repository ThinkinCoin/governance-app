# Sprint #2 Plan — Install Flows & UI Resilience [key:01KFZK687WPNTRWNYVBDJWGK96]

## Goals
- Deliver HarmonyVoting install and prepare flows with validation and safety checks.
- Improve UI resilience for RPC failures and offline scenarios.
- Ship tests and documentation to support release readiness.

## Non-Goals
- No contract changes or on-chain permission updates in this sprint.
- No new plugin types beyond HarmonyVoting install/prepare.

## Task Breakdown (Checklist)
- [x] TASK-001: Install Flow — wizard UI, validator address validation, param encoding. (Issue #40) [key:01KFX03B4D8ZZY5AFC06XP78XA] **Status: DONE**
	- [x] Encode installation params matching contract expectations (HIP uses empty bytes; Delegation encodes validator address) [key:01KFX03B4E169ZA7CWJVWST67F]
	- [x] Parameter validation (format, length, checksum) with user-visible errors [key:01KFX03B4FPKZMKSMX79FG361K]
	- [x] Settings install wizard + prepare flow dialogs (Install → Prepare tx → Publish proposal) [key:01KFX03B4FPKZMKSMX79FG361M]
	- [x] Legacy PSP variance support (use PSP address from prepare receipt when building apply actions) [key:01KFX03B4FPKZMKSMX79FG361N]
	- [x] Admin Settings entrypoint button (Harmony-only, hidden if already installed) [key:01KFX03B4FPKZMKSMX79FG361P]
	- [x] Confirm install wizard UX end-to-end on Harmony (including "By Request" label) [key:01KFX03B4FPKZMKSMX79FG361Q]
- [x] TASK-002: Prepare Flow — gas estimation, chain mismatch checks. (Issue #41) [key:01KFX03B4FPKZMKSMX79FG361R] **Status: DONE**
	- [x] Gas estimation using tx gas.limit * 1.2 buffer (BigInt safe calculation) [key:01KFX03B4FPKZMKSMX79FG361R_A]
	- [x] Chain mismatch detection with switchNetwork action (separate from approve) [key:01KFX03B4FPKZMKSMX79FG361R_B]
	- [x] switchNetwork i18n keys + UX flow (idle/pending/error states) [key:01KFX03B4FPKZMKSMX79FG361R_C]
	- [x] Fix advancedDateInputDuration test validation state clearing ✅ [key:01KFX03B4FPKZMKSMX79FG361R_D]
- [x] TASK-003: UI Resilience — retry UX, offline fallback, error messaging. (Issue #42) [key:01KFX03B4FPKZMKSMX79FG361S] **Status: DONE**
	- [x] WalletConnect type drift hardening (structural session typing + metadata narrowing) [key:06DZMG9RB8CM6TRY36171PG1BA]
- [x] TASK-004: Integrations — builder registration, analytics, i18n. (Issue #43) [key:01KFX03B4FPKZMKSMX79FG361T] **Status: DONE**
	- [x] Add missing i18n keys for new Settings dialogs + Admin entrypoint [key:01KFX03B4FPKZMKSMX79FG361V]
	- [x] Add monitoring events for HarmonyVoting install/prepare dialogs [key:01KFX03B4FPKZMKSMX79FG361T_A]
	- [x] Add registry integration test for HarmonyVoting slots/builders [key:01KFX03B4FPKZMKSMX79FG361T_B]
	- [x] Fix AddressInput validator clearing bug in install dialog + membership setup [key:01KFX03B4FPKZMKSMX79FG361T_C]
- [x] TASK-005: Tests & Docs — unit/E2E smoke, update docs. (Issue #44) **Status: DONE** [key:01KFX03B4FPKZMKSMX79FG361W]

## Implementation Steps & Guidelines
1. Scope UI flows and validation rules from existing HarmonyVoting install requirements.
2. Implement install wizard and parameter encoding with unit tests.
3. Implement pre-flight checks for gas and chain mismatch.
4. Add UI resilience and retry UX for RPC failures.
5. Integrate analytics, builders, and i18n keys.
6. Add tests, update documentation, validate acceptance criteria.

## Dependencies & Integration Points
- Aragon Governance UI Kit components
- wagmi/viem + AppKit wallet connection
- HarmonyVoting plugin install parameters
- Existing error handling and analytics utilities

## Acceptance Criteria
- Users can complete install flow with correct parameter encoding.
- Prepare flow blocks invalid installs and shows gas estimates.
- UI retries and error messages are clear for RPC failures.
- Analytics, builder registration, and i18n keys are complete.
- Unit coverage >= 90% on modified modules and E2E smoke passes locally.

## Rollout / Validation
- Validate flows locally with test wallet + mock RPC failure.
- Confirm E2E smoke passes before merging.

## References
- PR #39: Sprint #2 - Install Flows & UI Resilience
- PLAN_SPRINT_2.md: docs/plans/PLAN_SPRINT_2.md
- Admin grant closeout (AragonOSX): tx `0xec054a414b37e912909ed3b571be9d7fd11a320fcdb3004ae39bc4acf346fc47` — runbook in AragonOSX/docs/RUNBOOK_HARMONY_ADMIN_GRANT.md
