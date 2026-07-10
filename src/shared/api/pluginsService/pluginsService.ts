import { AragonBackendService } from '../aragonBackendService';
import type { IDaoPlugin } from '../daoService';
import type {
    IGetHarmonyDelegationsByValidatorParams,
    IGetHarmonyValidatorConfigParams,
    IGetHarmonyValidatorInfoParams,
    IGetPluginsByDaoParams,
    IHarmonyDelegation,
    IHarmonyValidatorConfig,
    IHarmonyValidatorInfo,
} from './pluginsService.api';

class PluginsService extends AragonBackendService {
    private urls = {
        pluginsByDao: '/v2/plugins/by-dao/:network/:address',
        harmonyValidatorConfig: '/v2/plugins/harmony-config/:network/:pluginAddress',
        harmonyValidatorInfo: '/v2/plugins/harmony/validator/:network/:validatorAddress',
        harmonyDelegationsByValidator: '/v2/plugins/harmony/delegations/validator/:network/:validatorAddress',
    };

    getPluginsByDao = async (params: IGetPluginsByDaoParams): Promise<IDaoPlugin[]> => {
        const result = await this.request<IDaoPlugin[]>(this.urls.pluginsByDao, params);

        return result;
    };

    getHarmonyValidatorConfig = async (params: IGetHarmonyValidatorConfigParams): Promise<IHarmonyValidatorConfig> => {
        const result = await this.request<IHarmonyValidatorConfig>(this.urls.harmonyValidatorConfig, params);
        return result;
    };

    getHarmonyValidatorInfo = async (params: IGetHarmonyValidatorInfoParams): Promise<IHarmonyValidatorInfo> => {
        const result = await this.request<IHarmonyValidatorInfo>(this.urls.harmonyValidatorInfo, params);
        return result;
    };

    getHarmonyDelegationsByValidator = async (
        params: IGetHarmonyDelegationsByValidatorParams,
    ): Promise<IHarmonyDelegation[]> => {
        const result = await this.request<IHarmonyDelegation[]>(this.urls.harmonyDelegationsByValidator, params);
        return result;
    };
}

export const pluginsService = new PluginsService();
