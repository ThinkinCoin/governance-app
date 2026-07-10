import type { ISetupBodyFormMembership } from '@/modules/createDao/dialogs/setupBodyDialog';
import type { IPluginSetupMembershipParams } from '@/modules/createDao/types';

export interface IHarmonyVotingSetupMembershipForm extends ISetupBodyFormMembership {
    /**
     * Validator address required for Harmony Delegation voting.
     */
    validatorAddress?: string;

    /**
     * Process key to be encoded as bytes32 for Harmony Delegation voting.
     * Following the Aragon pattern, this is usually a short uppercase string.
     */
    processKey?: string;
}

export interface IHarmonyVotingSetupMembershipProps extends IPluginSetupMembershipParams {
    daoId?: string;
}
