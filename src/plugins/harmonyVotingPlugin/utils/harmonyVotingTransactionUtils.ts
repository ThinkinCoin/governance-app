import type { IBuildPreparePluginInstallDataParams } from '@/modules/createDao/types';
import { PluginInterfaceType } from '@/shared/api/daoService';
import { pluginTransactionUtils } from '@/shared/utils/pluginTransactionUtils';
import { addressUtils, type ICompositeAddress } from '@aragon/gov-ui-kit';
import { encodeAbiParameters, encodeFunctionData, stringToHex, type Hex } from 'viem';
import { evmAddressUtils } from '@/shared/utils/evmAddressUtils';
import type { IPluginInfo } from '@/shared/types';
import type { IHarmonyVotingSetupGovernanceForm } from '../components/harmonyVotingSetupGovernance';
import type { IHarmonyVotingSetupMembershipForm } from '../components/harmonyVotingSetupMembership';
import type { IProposalCreate } from '@/modules/governance/dialogs/publishProposalDialog';
import type { IBuildCreateProposalDataParams, IBuildVoteDataParams } from '@/modules/governance/types';
import { createProposalUtils, type ICreateProposalEndDateForm } from '@/modules/governance/utils/createProposalUtils';

export interface ICreateHarmonyVotingProposalFormData extends IProposalCreate, Partial<ICreateProposalEndDateForm> {
    /**
     * Snapshot block used to compute validator/delegator weights.
     */
    snapshotBlock?: number;
}

export type IPrepareHarmonyVotingInstallDataParams = IBuildPreparePluginInstallDataParams<
    IHarmonyVotingSetupGovernanceForm,
    ICompositeAddress,
    IHarmonyVotingSetupMembershipForm
>;

const harmonyVotingAbi = [
    {
        type: 'function',
        name: 'createProposal',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_metadata', type: 'bytes' },
            { name: '_startDate', type: 'uint64' },
            { name: '_endDate', type: 'uint64' },
            { name: '_snapshotBlock', type: 'uint64' },
        ],
        outputs: [{ name: 'proposalId', type: 'uint256' }],
    },
    {
        type: 'function',
        name: 'castVote',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_proposalId', type: 'uint256' },
            { name: '_option', type: 'uint8' },
        ],
        outputs: [],
    },
] as const;

export const buildPrepareHarmonyVotingInstallData = (
    plugin: IPluginInfo,
    params: IPrepareHarmonyVotingInstallDataParams,
): Hex => {
    const { dao, body, metadata, stageVotingPeriod } = params;

    const repositoryAddress = plugin.repositoryAddresses[dao.network];

    // Harmony Voting plugins have strict install params expectations:
    // - HIP voting: no installation params are supported (must be empty bytes)
    // - Delegation voting: expects `abi.encode(address validatorAddress, bytes32 processKey)`
    //
    // Passing metadata here would revert (e.g. HIP: `INSTALL_PARAMS_NOT_SUPPORTED`).
    void metadata;
    void stageVotingPeriod;

    let pluginSettingsData: Hex = '0x' as Hex;

    const isDelegation = plugin.id === PluginInterfaceType.HARMONY_DELEGATION_VOTING;

    if (isDelegation) {
        pluginSettingsData = buildDelegationInstallData(body.membership?.validatorAddress, body.membership?.processKey);
    }

    return pluginTransactionUtils.buildPrepareInstallationData(
        repositoryAddress,
        plugin.installVersion,
        pluginSettingsData,
        dao.address as Hex,
    );
};

export const buildCreateHarmonyVotingProposalData = (
    params: IBuildCreateProposalDataParams<ICreateHarmonyVotingProposalFormData>,
): Hex => {
    const { metadata, proposal, actions } = params;

    if (actions.length > 0) {
        throw new Error('Harmony voting proposals do not support onchain actions. Remove all actions and try again.');
    }

    let startDate = createProposalUtils.parseStartDate(proposal);
    let endDate = createProposalUtils.parseEndDate(proposal);

    // Unlike other governance plugins, HarmonyVoting does not support using `0` to let the
    // contract fill startDate at execution time.
    if (startDate === 0) {
        startDate = Math.floor(Date.now() / 1000) + 60;
    }

    if (endDate === 0) {
        endDate = createProposalUtils.createDefaultEndDate();
    }

    if (startDate >= endDate) {
        throw new Error('End date must be later than the start date for Harmony voting proposals.');
    }

    const snapshotBlock = proposal.snapshotBlock;
    if (snapshotBlock == null || !Number.isFinite(snapshotBlock) || snapshotBlock < 1) {
        throw new Error('Snapshot block is required for Harmony voting proposals.');
    }

    return encodeFunctionData({
        abi: harmonyVotingAbi,
        functionName: 'createProposal',
        args: [metadata, BigInt(startDate), BigInt(endDate), BigInt(snapshotBlock)],
    });
};

export const buildHarmonyVotingVoteData = (params: IBuildVoteDataParams): Hex => {
    const { proposalIndex, vote } = params;

    return encodeFunctionData({
        abi: harmonyVotingAbi,
        functionName: 'castVote',
        args: [BigInt(proposalIndex), vote.value],
    });
};

export const buildDelegationInstallData = (validatorAddress?: string, processKey?: string | Hex): Hex => {
    if (validatorAddress == null || validatorAddress.trim().length === 0) {
        throw new Error('Validator address is required for Harmony Delegation voting.');
    }
    const trimmed = validatorAddress.trim();
    const res = evmAddressUtils.validate(trimmed);

    if (!res.ok) {
        throw new Error('Validator address must be a valid address.');
    }

    const normalizedProcessKey = (() => {
        if (processKey == null) {
            return stringToHex('DELEGATION', { size: 32 }) as Hex;
        }

        // Accept raw bytes32 hex.
        if (typeof processKey === 'string' && processKey.startsWith('0x')) {
            return processKey as Hex;
        }

        const trimmedKey = String(processKey).trim();
        if (trimmedKey.length === 0) {
            return stringToHex('DELEGATION', { size: 32 }) as Hex;
        }

        try {
            return stringToHex(trimmedKey.toUpperCase(), { size: 32 }) as Hex;
        } catch {
            throw new Error('Process key must be a valid short string (fits into bytes32).');
        }
    })();

    return encodeAbiParameters(
        [
            { name: 'validatorAddress', type: 'address' },
            { name: 'processKey', type: 'bytes32' },
        ],
        [res.address as Hex, normalizedProcessKey],
    );
};
