import type {
    IGetHarmonyDelegationsByValidatorParams,
    IGetHarmonyValidatorConfigParams,
    IGetHarmonyValidatorInfoParams,
    IGetPluginsByDaoParams,
} from './pluginsService.api';

export const pluginsServiceKeys = {
    allPlugins: ['plugins'] as const,
    pluginsByDao: (params: IGetPluginsByDaoParams) =>
        [...pluginsServiceKeys.allPlugins, 'pluginsByDao', params.urlParams] as const,
    harmonyValidatorConfig: (params: IGetHarmonyValidatorConfigParams) =>
        [...pluginsServiceKeys.allPlugins, 'harmonyValidatorConfig', params.urlParams] as const,
    harmonyValidatorInfo: (params: IGetHarmonyValidatorInfoParams) =>
        [...pluginsServiceKeys.allPlugins, 'harmonyValidatorInfo', params.urlParams] as const,
    harmonyDelegationsByValidator: (params: IGetHarmonyDelegationsByValidatorParams) =>
        [...pluginsServiceKeys.allPlugins, 'harmonyDelegationsByValidator', params.urlParams] as const,
};
