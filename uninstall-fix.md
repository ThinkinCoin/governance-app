# Plugin Uninstallation Fix - Implementation Checklist

## Context
- **Issue**: Plugin uninstallation reverts with `InvalidAppliedSetupId` error
- **Root Cause**: Helpers array passed to `prepareUninstallation` doesn't match the one used during installation
- **Solution**: Backend must store helpers from `InstallationPrepared` event and frontend must fetch them

---

## Backend Tasks (Aragon-app-backend)

### 1. Schema Update
- [x] Add `helpers: string[]` field to LogPluginSetupProcessor schema
  - File: `src/models/schema/logPluginSetupProcessor.ts`
  - Status: ✅ Completed

### 2. Event Handler Update
- [x] Extract helpers from `InstallationPrepared` event
- [x] Save helpers array to database
  - File: `src/handlers/pluginSetupProcessorHandler.ts`
  - Status: ✅ Completed

### 3. API Endpoint
- [x] Create GET endpoint `/v2/plugins/installation-helpers/:network/:pluginAddress`
- [x] Implement controller method `getInstallationHelpers`
- [x] Add Joi validation schema
  - Files: 
    - `src/services/aragon-api/controllers/plugins.ts`
    - `src/services/aragon-api/routers/v2/plugins.ts`
    - `src/services/aragon-api/routers/schema/plugin.ts`
  - Status: ✅ Completed

### 4. Testing
- [x] Test endpoint with existing installed plugins
- [x] Verify helpers array order is preserved
- [x] Test fallback behavior when helpers not found

---

## Frontend Tasks (aragon-app)

### 1. API Client
- [x] Create `fetchInstallationHelpers` method
  - File: `src/modules/settings/dialogs/preparePluginUninstallationDialog/preparePluginUninstallationDialogUtils.ts`
  - Status: ✅ Completed

### 2. Transaction Builder Update
- [x] Refactor `buildPrepareUninstallationTransaction` to use backend helpers
- [x] Keep fallback to plugin registry helpers (for backward compatibility)
  - File: `src/modules/settings/dialogs/preparePluginUninstallationDialog/preparePluginUninstallationDialogUtils.ts`
  - Status: ✅ Completed

### 3. Execute Dialog Fix
- [x] Fix "Grant ROOT permission to executor" detection
- [x] Change condition from `who === pspAddress` to `who === pluginAddress`
  - File: `src/modules/governance/dialogs/executeDialog/executeDialog.tsx`
  - Status: ✅ Completed

### 4. Testing
- [x] Test uninstall flow end-to-end on Harmony testnet
- [x] Verify no phantom "Grant ROOT" step appears
- [x] Test with plugins that have 0, 1, and 2+ helpers

---

## Data Migration (Optional)

### Backfill Existing Installations
- [x] Create migration script to backfill helpers for existing `InstallationApplied` events
  - Query MongoDB for events without `helpers` field
  - Fetch logs from chain via `eth_getLogs`
  - Parse and save helpers
- [x] Run migration on development environment first
- [x] Validate migration results
- [x] Run on production

---

## Validation Steps

### Pre-Deploy Checklist
- [x] All code changes implemented
- [x] Backend tests pass (`yarn test:unit`)
- [x] Frontend builds without errors (`pnpm build`)
- [x] Linting passes on both repos
- [x] Type checking passes

### Post-Deploy Validation
- [x] Deploy backend to dev environment
- [x] Deploy frontend to preview environment
- [x] Test uninstall with the problematic plugin:
  - DAO: `0x76B83B6148ccA891D768cE3129585F25d0104783`
  - Plugin: `0x48D6E7Dc4A289417D6878119092d2Bb040162995`
  - Expected helpers: `helpers from InstallationPrepared (or migrated/manual extraction when PSP event is missing)`
- [x] Verify transaction doesn't revert
- [x] Verify proposal execution completes without phantom steps

---

## Rollback Plan

If issues arise post-deployment:

1. **Backend**: Revert API changes, keep schema (backward compatible)
2. **Frontend**: Revert to hardcoded helpers logic (fallback already in place)
3. **Database**: No destructive changes made, safe to rollback

---

## Notes

- ✅ = Completed and committed
- 🔄 = In progress
- ⏸️ = Blocked/waiting
- ❌ = Failed/needs rework

Status (2026-01-15): Flow validated end-to-end; uninstall operates normally.

---

## Known Edge Cases

1. **Plugins installed before this fix**: Will use fallback logic (plugin registry helpers)
2. **Networks not indexed by backend**: Will use fallback logic
3. **Backend API down**: Will use fallback logic
4. **Helpers order matters**: Backend must preserve exact order from event

---

## Related Issues

- Root cause analysis: helpers mismatch in `prepareUninstallation`
- Secondary bug: phantom "Grant ROOT" step in execute dialog
- Both issues fixed in this implementation

---

## Success Criteria

- ✅ Backend stores helpers from `InstallationPrepared` events
- ✅ Frontend fetches helpers from backend API
- ✅ Uninstall transactions no longer revert with `InvalidAppliedSetupId`
- ✅ Execute dialog doesn't show phantom ROOT grant steps
- [x] All tests pass (E2E validation completed)