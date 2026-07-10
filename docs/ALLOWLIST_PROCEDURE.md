# HIP Plugin Allowlist Procedure

This document describes how to request and grant access to the HIP Voting Plugin via the Management DAO allowlist.

## Overview

The HIP (Harmony Improvement Proposal) Voting Plugin requires prior authorization before installation. DAOs must be explicitly added to an allowlist managed by the Management DAO.

## Technical Details

| Item | Value |
|------|-------|
| HIPPluginAllowlist Proxy | `0x8D151e5021F495e23FbBC3180b4EeA1a6B251Fd0` |
| Management DAO | `0x700cBBB4881D286628ca9aD3d9DF390D9c0840a2` |
| Permission ID | `keccak256("MANAGE_ALLOWLIST_PERMISSION")` |
| Network | Harmony Mainnet |

## How to Request Access

### For DAO Members

1. **Gather your DAO information:**
   - DAO contract address on Harmony Mainnet
   - Brief description of your DAO's use case

2. **Submit a request via one of these channels:**
   - **GitHub Issue**: Create an issue in the [AragonOSX repository](https://github.com/Axodus/AragonOSX/issues/new) with the title `[Allowlist Request] <Your DAO Name>`
   - **Discord/Forum**: Post in the dedicated allowlist request channel

3. **Wait for Management DAO review:**
   - The Management DAO will review your request
   - If approved, a proposal will be created to add your DAO to the allowlist

4. **Confirmation:**
   - Once the proposal passes and is executed, you'll be notified
   - Your DAO can then install the HIP Voting Plugin

## How to Verify Authorization

You can verify if a DAO is authorized by calling the `isDAOAllowed` function:

```solidity
// Using ethers.js or viem
const allowlist = new ethers.Contract(
  "0x8D151e5021F495e23FbBC3180b4EeA1a6B251Fd0",
  ["function isDAOAllowed(address dao) view returns (bool)"],
  provider
);

const isAllowed = await allowlist.isDAOAllowed(daoAddress);
console.log(`DAO ${daoAddress} is ${isAllowed ? "allowed" : "not allowed"}`);
```

Or via Harmony Explorer:
1. Go to https://explorer.harmony.one/address/0x8D151e5021F495e23FbBC3180b4EeA1a6B251Fd0
2. Click "Read Contract"
3. Call `isDAOAllowed` with your DAO address

## For Management DAO Members

### How to Process an Allowlist Request

**Requirements:**
- Be a member of the Management DAO
- Have `MANAGE_ALLOWLIST_PERMISSION` granted

**Steps:**

1. **Verify the requesting DAO:**
   - Confirm the DAO address is valid
   - Review the use case and ensure it aligns with governance standards

2. **Create a proposal in the Management DAO:**
   
   ```solidity
   // Proposal action
   target: 0x8D151e5021F495e23FbBC3180b4EeA1a6B251Fd0 // HIPPluginAllowlistProxy
   value: 0
   data: abi.encodeWithSelector(
       bytes4(keccak256("allowDAO(address)")),
       daoAddress // Address of the requesting DAO
   )
   ```

3. **Vote on the proposal:**
   - Follow standard Management DAO voting procedures

4. **After execution:**
   - The `DAOAllowed(address indexed dao)` event is emitted
   - Notify the requesting DAO that they are now authorized

### How to Remove a DAO from the Allowlist

If needed, a DAO can be removed from the allowlist:

```solidity
// Proposal action
target: 0x8D151e5021F495e23FbBC3180b4EeA1a6B251Fd0
value: 0
data: abi.encodeWithSelector(
    bytes4(keccak256("disallowDAO(address)")),
    daoAddress
)
```

## Request Flow Diagram

```
┌─────────────────────┐
│  Requesting DAO     │
│  submits request    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Management DAO     │
│  reviews request    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Create allowDAO    │
│  proposal           │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Management DAO     │
│  votes on proposal  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Proposal executed  │
│  DAO is allowlisted │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  DAO can install    │
│  HIP Voting Plugin  │
└─────────────────────┘
```

## FAQ

**Q: Why is the HIP Plugin behind an allowlist?**
A: The HIP Voting Plugin integrates with Harmony's native staking and governance mechanisms. The allowlist ensures only properly vetted DAOs can access these sensitive features.

**Q: How long does the approval process take?**
A: Typically 3-7 days, depending on Management DAO voting periods and proposal queue.

**Q: Can I install other Harmony plugins without allowlist?**
A: Some plugins may be available without allowlist. Check the plugin's `requiresAllowlist` flag in the UI.

**Q: What happens if my request is denied?**
A: You'll receive feedback on why the request was denied and what steps you can take to reapply.

## Related Resources

- [HIP Plugin Technical Documentation](../packages/contracts/src/plugins/harmony/)
- [Management DAO Dashboard](https://app.aragon.org/#/daos/harmony/0x700cBBB4881D286628ca9aD3d9DF390D9c0840a2)
- [Aragon OSx Documentation](https://devs.aragon.org/)
