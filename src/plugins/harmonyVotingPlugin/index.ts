import { CreateDaoSlotId } from '@/modules/createDao/constants/moduleSlots';
import { GovernanceSlotId } from '@/modules/governance/constants/moduleSlots';
import { SettingsSlotId } from '@/modules/settings/constants/moduleSlots';
import { pluginRegistryUtils } from '@/shared/utils/pluginRegistryUtils';
import { HarmonyDelegationMemberList } from './components/harmonyDelegationMemberList';
import { HarmonyDelegationMemberPanel } from './components/harmonyDelegationMemberPanel';
import { HarmonyVotingCreateProposalSettingsForm } from './components/harmonyVotingCreateProposalSettingsForm';
import { HarmonyVotingSetupGovernance } from './components/harmonyVotingSetupGovernance';
import { HarmonyDelegationMemberInfo, HarmonyDelegationVotingSetupMembership, HarmonyVotingSetupMembership } from './components/harmonyVotingSetupMembership';
import { harmonyDelegationVotingPlugin, harmonyHipVotingPlugin } from './constants/harmonyVotingPlugins';
import { useHarmonyDelegationMemberStats } from './hooks/useHarmonyDelegationMemberStats';
import { harmonyProposalUtils } from './utils/harmonyProposalUtils';
import {
    buildCreateHarmonyVotingProposalData,
    buildHarmonyVotingVoteData,
    buildPrepareHarmonyVotingInstallData,
} from './utils/harmonyVotingTransactionUtils';

export const initialiseHarmonyVotingPlugin = () => {
    pluginRegistryUtils
        // Plugin definitions
        .registerPlugin(harmonyHipVotingPlugin)
        .registerPlugin(harmonyDelegationVotingPlugin)

        // Create DAO module slots
        .registerSlotFunction({
            slotId: CreateDaoSlotId.CREATE_DAO_BUILD_PREPARE_PLUGIN_INSTALL_DATA,
            pluginId: harmonyHipVotingPlugin.id,
            function: (params) => buildPrepareHarmonyVotingInstallData(harmonyHipVotingPlugin, params),
        })
        .registerSlotFunction({
            slotId: CreateDaoSlotId.CREATE_DAO_BUILD_PREPARE_PLUGIN_INSTALL_DATA,
            pluginId: harmonyDelegationVotingPlugin.id,
            function: (params) => buildPrepareHarmonyVotingInstallData(harmonyDelegationVotingPlugin, params),
        })
        .registerSlotComponent({
            slotId: CreateDaoSlotId.CREATE_DAO_SETUP_MEMBERSHIP,
            pluginId: harmonyHipVotingPlugin.id,
            component: HarmonyVotingSetupMembership,
        })
        .registerSlotComponent({
            slotId: CreateDaoSlotId.CREATE_DAO_SETUP_MEMBERSHIP,
            pluginId: harmonyDelegationVotingPlugin.id,
            component: HarmonyDelegationVotingSetupMembership,
        })
        .registerSlotComponent({
            slotId: CreateDaoSlotId.CREATE_DAO_SETUP_GOVERNANCE,
            pluginId: harmonyHipVotingPlugin.id,
            component: HarmonyVotingSetupGovernance,
        })
        .registerSlotComponent({
            slotId: CreateDaoSlotId.CREATE_DAO_SETUP_GOVERNANCE,
            pluginId: harmonyDelegationVotingPlugin.id,
            component: HarmonyVotingSetupGovernance,
        })
        // Governance proposal settings + data
        .registerSlotComponent({
            slotId: GovernanceSlotId.GOVERNANCE_CREATE_PROPOSAL_SETTINGS_FORM,
            pluginId: harmonyHipVotingPlugin.id,
            component: HarmonyVotingCreateProposalSettingsForm,
        })
        .registerSlotComponent({
            slotId: GovernanceSlotId.GOVERNANCE_CREATE_PROPOSAL_SETTINGS_FORM,
            pluginId: harmonyDelegationVotingPlugin.id,
            component: HarmonyVotingCreateProposalSettingsForm,
        })
        .registerSlotFunction({
            slotId: GovernanceSlotId.GOVERNANCE_BUILD_CREATE_PROPOSAL_DATA,
            pluginId: harmonyHipVotingPlugin.id,
            function: buildCreateHarmonyVotingProposalData,
        })
        .registerSlotFunction({
            slotId: GovernanceSlotId.GOVERNANCE_BUILD_CREATE_PROPOSAL_DATA,
            pluginId: harmonyDelegationVotingPlugin.id,
            function: buildCreateHarmonyVotingProposalData,
        })
        .registerSlotFunction({
            slotId: GovernanceSlotId.GOVERNANCE_BUILD_VOTE_DATA,
            pluginId: harmonyHipVotingPlugin.id,
            function: buildHarmonyVotingVoteData,
        })
        .registerSlotFunction({
            slotId: GovernanceSlotId.GOVERNANCE_BUILD_VOTE_DATA,
            pluginId: harmonyDelegationVotingPlugin.id,
            function: buildHarmonyVotingVoteData,
        })

        // Governance proposal status (core OSx pattern)
        .registerSlotFunction({
            slotId: GovernanceSlotId.GOVERNANCE_PROCESS_PROPOSAL_STATUS,
            pluginId: harmonyHipVotingPlugin.id,
            function: harmonyProposalUtils.getProposalStatus,
        })
        .registerSlotFunction({
            slotId: GovernanceSlotId.GOVERNANCE_PROCESS_PROPOSAL_STATUS,
            pluginId: harmonyDelegationVotingPlugin.id,
            function: harmonyProposalUtils.getProposalStatus,
        })
        .registerSlotFunction({
            slotId: GovernanceSlotId.GOVERNANCE_PROCESS_PROPOSAL_SUCCEEDED,
            pluginId: harmonyHipVotingPlugin.id,
            function: harmonyProposalUtils.hasSucceeded,
        })
        .registerSlotFunction({
            slotId: GovernanceSlotId.GOVERNANCE_PROCESS_PROPOSAL_SUCCEEDED,
            pluginId: harmonyDelegationVotingPlugin.id,
            function: harmonyProposalUtils.hasSucceeded,
        })

        // Governance members UI (Harmony Delegation)
        .registerSlotComponent({
            slotId: GovernanceSlotId.GOVERNANCE_DAO_MEMBER_LIST,
            pluginId: harmonyDelegationVotingPlugin.id,
            component: HarmonyDelegationMemberList,
        })
        .registerSlotComponent({
            slotId: GovernanceSlotId.GOVERNANCE_MEMBER_PANEL,
            pluginId: harmonyDelegationVotingPlugin.id,
            component: HarmonyDelegationMemberPanel,
        })
        .registerSlotFunction({
            slotId: GovernanceSlotId.GOVERNANCE_MEMBER_STATS,
            pluginId: harmonyDelegationVotingPlugin.id,
            function: useHarmonyDelegationMemberStats,
        })

        // Settings module slots
        .registerSlotComponent({
            slotId: SettingsSlotId.SETTINGS_MEMBERS_INFO,
            pluginId: harmonyDelegationVotingPlugin.id,
            component: HarmonyDelegationMemberInfo,
        });
};
