import type { Network } from '../daoService';
import type { IRequestUrlParams } from '../httpService';

export interface IGetPluginsByDaoUrlParams {
    /**
     * Network of the DAO.
     */
    network: Network;
    /**
     * Address of the DAO.
     */
    address: string;
}

export interface IGetPluginsByDaoParams extends IRequestUrlParams<IGetPluginsByDaoUrlParams> {}

export interface IGetHarmonyValidatorConfigUrlParams {
    /**
     * Network of the DAO.
     */
    network: Network;
    /**
     * Address of the plugin.
     */
    pluginAddress: string;
}

export interface IHarmonyValidatorConfig {
    pluginAddress: string;
    network: string;
    validatorAddress: string | null;
    processKey: string | null;
    lastUpdateTxHash: string | null;
    lastUpdateBlock: number | null;
    updatedAt: string | null;
    createdAt: string | null;
}

export interface IGetHarmonyValidatorConfigParams extends IRequestUrlParams<IGetHarmonyValidatorConfigUrlParams> {}

export interface IGetHarmonyValidatorInfoUrlParams {
    /**
     * Network of the DAO.
     */
    network: Network;
    /**
     * Validator address (bech32 or 0x).
     */
    validatorAddress: string;
}

export interface IHarmonyValidatorInfo {
    address: string;
    name: string;
    rate: string;
    totalDelegation: string;
    activeStatus: string;
    currentlyInCommittee: boolean;
}

export interface IGetHarmonyValidatorInfoParams extends IRequestUrlParams<IGetHarmonyValidatorInfoUrlParams> {}

export interface IGetHarmonyDelegationsByValidatorUrlParams {
    /**
     * Network of the DAO.
     */
    network: Network;
    /**
     * Validator address (bech32 or 0x).
     */
    validatorAddress: string;
}

export interface IHarmonyDelegation {
    validatorAddress: string;
    delegatorAddress: string;
    amount: string;
    reward: string;
}

export interface IGetHarmonyDelegationsByValidatorParams
    extends IRequestUrlParams<IGetHarmonyDelegationsByValidatorUrlParams> {}
