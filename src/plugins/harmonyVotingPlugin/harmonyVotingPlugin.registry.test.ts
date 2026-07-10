import { CreateDaoSlotId } from '@/modules/createDao/constants/moduleSlots';
import { GovernanceSlotId } from '@/modules/governance/constants/moduleSlots';
import { harmonyDelegationVotingPlugin, harmonyHipVotingPlugin } from './constants/harmonyVotingPlugins';

jest.mock('@/shared/utils/pluginRegistryUtils', () => {
    const chainable = {
        registerPlugin: jest.fn().mockReturnThis(),
        registerSlotFunction: jest.fn().mockReturnThis(),
        registerSlotComponent: jest.fn().mockReturnThis(),
    };

    return {
        pluginRegistryUtils: chainable,
    };
});

describe('harmonyVotingPlugin registry integration', () => {
    it('registers plugins and required slot builders/components', async () => {
        const { initialiseHarmonyVotingPlugin } = await import('./index');
        const { pluginRegistryUtils } = await import('@/shared/utils/pluginRegistryUtils');

        initialiseHarmonyVotingPlugin();

        expect(pluginRegistryUtils.registerPlugin).toHaveBeenCalledWith(harmonyHipVotingPlugin);
        expect(pluginRegistryUtils.registerPlugin).toHaveBeenCalledWith(harmonyDelegationVotingPlugin);

        expect(pluginRegistryUtils.registerSlotFunction).toHaveBeenCalledWith(
            expect.objectContaining({
                slotId: CreateDaoSlotId.CREATE_DAO_BUILD_PREPARE_PLUGIN_INSTALL_DATA,
                pluginId: harmonyHipVotingPlugin.id,
            }),
        );
        expect(pluginRegistryUtils.registerSlotFunction).toHaveBeenCalledWith(
            expect.objectContaining({
                slotId: CreateDaoSlotId.CREATE_DAO_BUILD_PREPARE_PLUGIN_INSTALL_DATA,
                pluginId: harmonyDelegationVotingPlugin.id,
            }),
        );

        expect(pluginRegistryUtils.registerSlotComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                slotId: CreateDaoSlotId.CREATE_DAO_SETUP_MEMBERSHIP,
                pluginId: harmonyHipVotingPlugin.id,
            }),
        );
        expect(pluginRegistryUtils.registerSlotComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                slotId: CreateDaoSlotId.CREATE_DAO_SETUP_MEMBERSHIP,
                pluginId: harmonyDelegationVotingPlugin.id,
            }),
        );

        expect(pluginRegistryUtils.registerSlotFunction).toHaveBeenCalledWith(
            expect.objectContaining({
                slotId: GovernanceSlotId.GOVERNANCE_BUILD_CREATE_PROPOSAL_DATA,
                pluginId: harmonyHipVotingPlugin.id,
            }),
        );
        expect(pluginRegistryUtils.registerSlotFunction).toHaveBeenCalledWith(
            expect.objectContaining({
                slotId: GovernanceSlotId.GOVERNANCE_BUILD_CREATE_PROPOSAL_DATA,
                pluginId: harmonyDelegationVotingPlugin.id,
            }),
        );

        expect(pluginRegistryUtils.registerSlotFunction).toHaveBeenCalledWith(
            expect.objectContaining({
                slotId: GovernanceSlotId.GOVERNANCE_BUILD_VOTE_DATA,
                pluginId: harmonyHipVotingPlugin.id,
            }),
        );
        expect(pluginRegistryUtils.registerSlotFunction).toHaveBeenCalledWith(
            expect.objectContaining({
                slotId: GovernanceSlotId.GOVERNANCE_BUILD_VOTE_DATA,
                pluginId: harmonyDelegationVotingPlugin.id,
            }),
        );

        expect(pluginRegistryUtils.registerSlotComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                slotId: GovernanceSlotId.GOVERNANCE_DAO_MEMBER_LIST,
                pluginId: harmonyDelegationVotingPlugin.id,
            }),
        );

        expect(pluginRegistryUtils.registerSlotComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                slotId: GovernanceSlotId.GOVERNANCE_MEMBER_PANEL,
                pluginId: harmonyDelegationVotingPlugin.id,
            }),
        );

        expect(pluginRegistryUtils.registerSlotFunction).toHaveBeenCalledWith(
            expect.objectContaining({
                slotId: GovernanceSlotId.GOVERNANCE_MEMBER_STATS,
                pluginId: harmonyDelegationVotingPlugin.id,
            }),
        );
    });
});
