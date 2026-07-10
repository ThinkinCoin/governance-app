import type { QueryOptions, SharedQueryOptions } from '@/shared/types';
import { useQuery } from '@tanstack/react-query';
import { pluginsService } from '../../pluginsService';
import type { IGetHarmonyValidatorInfoParams, IHarmonyValidatorInfo } from '../../pluginsService.api';
import { pluginsServiceKeys } from '../../pluginsServiceKeys';

export const harmonyValidatorInfoOptions = (
    params: IGetHarmonyValidatorInfoParams,
    options?: QueryOptions<IHarmonyValidatorInfo>,
): SharedQueryOptions<IHarmonyValidatorInfo> => ({
    queryKey: pluginsServiceKeys.harmonyValidatorInfo(params),
    queryFn: () => pluginsService.getHarmonyValidatorInfo(params),
    ...options,
});

export const useHarmonyValidatorInfo = (
    params: IGetHarmonyValidatorInfoParams,
    options?: QueryOptions<IHarmonyValidatorInfo>,
) => {
    return useQuery(harmonyValidatorInfoOptions(params, options));
};
