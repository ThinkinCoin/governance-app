# [PLAN] HarmonyVoting Frontend Fixes

**Repository:** aragon-app (Axodus/aragon-app)  
**Slug:** `PLAN-HarmonyVotingFE`  
**Related:** [PLAN-HarmonyVoting (Contracts)](../../../osx-plugin-foundry/docs/plans/PLAN_HARMONYVOTING_FIXES.md)  
**End Date Goal:** 2026-02-15  
**Priority:** HIGH  
**Estimative Hours:** 28h  
**Status:** COMPLETED

---

## Executive Summary

This plan addresses frontend-specific issues affecting the HarmonyVoting plugins installation and display. The main problems are: `processKey` form field not being transmitted, plugin names showing as UNKNOWN, validator/delegator data not displayed, and proposals not listed despite successful on-chain creation.

### Problem Summary (Frontend Scope)

| Issue | Symptom | Root Cause Hypothesis |
|-------|---------|----------------------|
| processKey ignored | Custom key not reflected after install | Form doesn't include field in SDK call |
| UNKNOWN name | Plugin displays without proper name | Missing metadata mapping in networkDefinitions |
| Validator not shown | Address provided but not displayed | No UI component to render validator data |
| Proposals missing | Created successfully but not listed | Wrong query/endpoint for HarmonyVoting proposals |

---

## Hierarchy Overview

```
[PLAN] HarmonyVoting Frontend Fixes (this document)
├── [PLAN-HarmonyVotingFE | SPRINT-001] Diagnosis & Form Audit
│   ├── TASK-001: Trace processKey form submission flow
│   ├── TASK-002: Audit networkDefinitions addresses
│   └── TASK-003: Identify proposal query endpoints
└── [PLAN-HarmonyVotingFE | SPRINT-002] Implementation & Testing
    ├── BUG-001: Fix processKey form submission
    ├── BUG-002: Add plugin metadata mappings
    ├── TASK-001: Add validator display component
    ├── TASK-002: Fix proposal list query
    └── TASK-003: E2E validation tests
```

---

## Sprints (Linked)

### [PLAN-HarmonyVotingFE | SPRINT-001] Diagnosis & Form Audit

- [x] [PLAN-HarmonyVotingFE | SPRINT-001 | TASK-001] Trace processKey form submission flow [key:01JK8FE00001] [status:COMPLETED] [priority:HIGH] [estimate:4h]
- [x] [PLAN-HarmonyVotingFE | SPRINT-001 | TASK-002] Audit networkDefinitions addresses [key:01JK8FE00002] [status:COMPLETED] [priority:HIGH] [estimate:2h]
- [x] [PLAN-HarmonyVotingFE | SPRINT-001 | TASK-003] Identify proposal query endpoints [key:01JK8FE00003] [status:COMPLETED] [priority:HIGH] [estimate:3h]

### [PLAN-HarmonyVotingFE | SPRINT-002] Implementation & Testing

- [x] [PLAN-HarmonyVotingFE | SPRINT-002 | BUG-001] Fix processKey form submission [key:01JK8FE00004] [status:COMPLETED] [priority:HIGH] [estimate:6h]
- [x] [PLAN-HarmonyVotingFE | SPRINT-002 | BUG-002] Add plugin metadata mappings [key:01JK8FE00005] [status:COMPLETED] [priority:HIGH] [estimate:4h]
- [x] [PLAN-HarmonyVotingFE | SPRINT-002 | TASK-001] Add validator display component [key:01JK8FE00006] [status:COMPLETED] [priority:MEDIUM] [estimate:4h]
- [x] [PLAN-HarmonyVotingFE | SPRINT-002 | TASK-002] Fix proposal list query [key:01JK8FE00007] [status:COMPLETED] [priority:URGENT] [estimate:4h]
- [x] [PLAN-HarmonyVotingFE | SPRINT-002 | TASK-003] E2E validation tests [key:01JK8FE00008] [status:COMPLETED] [priority:HIGH] [estimate:4h]

---

## Key Files to Investigate/Modify

```typescript
// Network definitions & addresses
src/shared/constants/networkDefinitions.ts

// Plugin installation flow
src/modules/**/PrepareProcessDialog*
src/plugins/**/harmonyVoting*
src/**/installPlugin*

// Proposal display
src/modules/**/proposals**
src/modules/**/ProposalList*

// SDK integration
src/shared/**/*sdk*
src/hooks/**/usePlugin*
```

---

## Dependencies

| Dependency | Repo | Status |
|------------|------|--------|
| Setup contracts emit correct metadata | osx-plugin-foundry | Required for BUG-002 |
| Subgraph indexes proposals | AragonOSX | Required for TASK-002 |
| Backend API returns proposals | Aragon-app-backend | Required for TASK-002 |

---

## Harmony API Integration

**Reference:** [HARMONY_API_REFERENCE.md](../../../osx-plugin-foundry/docs/plans/HARMONY_API_REFERENCE.md)

Use the Harmony Node API (https://api.hmny.io/) for displaying validator/delegator info:

| Feature | API Method | UI Component |
|---------|------------|--------------|
| Validator details | `hmyv2_getValidatorInformation` | Plugin details page |
| Delegators list | `hmyv2_getDelegationsByValidator` | Members tab |
| User voting power | `hmyv2_getBalance` + `hmyv2_getDelegationsByDelegator` | Voting dialog |

### JavaScript SDK

```bash
pnpm add @harmony-js/core @harmony-js/crypto @harmony-js/utils
```

```typescript
// src/shared/services/harmonyApi.ts
import { Harmony } from '@harmony-js/core';
import { ChainID, ChainType } from '@harmony-js/utils';

const hmy = new Harmony('https://api.harmony.one', {
  chainType: ChainType.Harmony,
  chainId: ChainID.HmyMainnet,
});

export async function getValidatorInfo(validatorAddress: string) {
  return hmy.blockchain.getValidatorInformation({ validatorAddress });
}

export async function getDelegations(validatorAddress: string) {
  return hmy.blockchain.getDelegationsByValidator({ validatorAddress });
}
```

### Address Conversion

Harmony uses `one1...` (bech32) for display and `0x...` (hex) for contracts:

```typescript
import { toBech32, fromBech32 } from '@harmony-js/crypto';

// Show in UI
const displayAddress = toBech32(hexAddress); // one1...

// Send to contract
const contractAddress = fromBech32(oneAddress); // 0x...
```

---

## Commands Reference

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Type check
pnpm type-check

# Tests
pnpm test

# Build
pnpm build

# Clear cache (if address issues persist)
rm -rf .next && pnpm build
```

---

## Definition of Done

- [x] processKey from form is transmitted and stored on-chain
- [x] Plugin names display correctly (not UNKNOWN)
- [x] Validator address shown in plugin details
- [x] Proposals listed after creation
- [x] All type checks pass
- [x] E2E tests pass

**Notes:** Evidence collected (backend logs, frontend start logs, and E2E artifacts). See repository `tmp/evidence/` for saved logs and screenshots when available.
