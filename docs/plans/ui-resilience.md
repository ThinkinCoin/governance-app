# UI Resilience & Fallbacks Plan

## Goal
Ensure robust UI that gracefully handles missing metadata, API failures, and plugin state changes.

## Current Status
- [x] Basic proposal creation UI with validator input
- [x] Proposal display using processKey prefix
- [ ] Metadata fallback implementation
- [ ] API failure handling
- [ ] Uninstall UX with state cleanup
- [ ] Loading states and error boundaries

## Task Breakdown

### 1. Metadata Fallback System
- [ ] Implement deterministic fallback order:
  1. Backend API (primary)
  2. Direct IPFS fetch (if hash format is valid)
  3. On-chain metadata registry (future)
  4. Placeholder display
- [ ] Add metadata validation (schema, size limits)
- [ ] Cache successful fetches locally
- [ ] Display "metadata unavailable" state gracefully

### 2. API Failure Resilience
- [ ] Implement retry logic with exponential backoff
- [ ] Show cached data when API is unreachable
- [ ] Add offline mode indicator
- [ ] Graceful degradation (show core data, hide optional fields)
- [ ] User-friendly error messages

### 3. Uninstall UX
- [ ] Pre-uninstall warnings (active proposals, pending votes)
- [ ] Post-uninstall state cleanup (remove from UI)
- [ ] Handle uninstall failures gracefully
- [ ] Prevent stale plugin data after uninstall
- [ ] Re-install flow without cache issues

### 4. Loading States & Error Boundaries
- [ ] Skeleton loaders for all data fetching
- [ ] Error boundaries around plugin components
- [ ] Network operation indicators (transaction pending, indexing)
- [ ] Progress indicators for multi-step flows

### 5. Network Switching
- [ ] Clear plugin cache on network switch
- [ ] Reload plugin configurations
- [ ] Validate addresses for new network
- [ ] Handle missing deployments gracefully

## Implementation Steps

1. **Metadata Service** (new: src/modules/metadata/metadataService.ts)
   ```typescript
   interface MetadataFallbackConfig {
     sources: MetadataSource[];
     timeout: number;
     cacheEnabled: boolean;
   }
   ```

2. **Error Boundary** (src/shared/components/ErrorBoundary.tsx)
   ```tsx
   <ErrorBoundary fallback={<FallbackUI />}>
     <PluginContent />
   </ErrorBoundary>
   ```

3. **Uninstall Hook** (src/plugins/hooks/usePluginUninstall.ts)
   ```typescript
   const { uninstall, isUninstalling, error } = usePluginUninstall({
     onSuccess: () => clearCache(),
     onError: (err) => showError(err)
   });
   ```

## Testing Strategy
- [ ] E2E test: API down, UI shows placeholder
- [ ] E2E test: Network switch, plugin reloads
- [ ] E2E test: Uninstall → reinstall cycle
- [ ] Unit test: Metadata fallback order
- [ ] Unit test: Error boundary isolation

## Acceptance Criteria
- UI never crashes due to missing data
- Proposals display even when metadata fetch fails
- User can navigate and view core governance data offline
- Uninstall removes plugin from UI without stale entries
- Error messages are actionable (e.g., "Retry", "Switch Network")
- Network switching reloads plugins within 2 seconds

## Dependencies
- Backend API contracts (endpoints, response schemas)
- IPFS gateway configuration
- Network definitions (networkDefinitions.ts)

## Related
- Parent Epic: [AragonOSX PLAN.md](../../AragonOSX/PLAN.md)
- Backend: [Aragon-app-backend plans/indexing-backfill.md](../../Aragon-app-backend/plans/indexing-backfill.md)
- Contracts: [osx-plugin-foundry PLAN.md](../../osx-plugin-foundry/PLAN.md)
