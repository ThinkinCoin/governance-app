import type { QueryOptions, SharedQueryOptions } from '@/shared/types';
import { useQuery } from '@tanstack/react-query';
import { pluginsService } from '../../pluginsService';
import type { IGetHarmonyValidatorConfigParams, IHarmonyValidatorConfig } from '../../pluginsService.api';
import { pluginsServiceKeys } from '../../pluginsServiceKeys';

export const harmonyValidatorConfigOptions = (
    params: IGetHarmonyValidatorConfigParams,
    options?: QueryOptions<IHarmonyValidatorConfig>,
): SharedQueryOptions<IHarmonyValidatorConfig> => ({
    queryKey: pluginsServiceKeys.harmonyValidatorConfig(params),
    queryFn: () => pluginsService.getHarmonyValidatorConfig(params),
    ...options,
});

export const useHarmonyValidatorConfig = (
    params: IGetHarmonyValidatorConfigParams,
    options?: QueryOptions<IHarmonyValidatorConfig>,
) => {
    return useQuery(harmonyValidatorConfigOptions(params, options));
};
