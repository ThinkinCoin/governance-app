import type { QueryOptions, SharedQueryOptions } from '@/shared/types';
import { useQuery } from '@tanstack/react-query';
import { pluginsService } from '../../pluginsService';
import type {
    IGetHarmonyDelegationsByValidatorParams,
    IHarmonyDelegation,
} from '../../pluginsService.api';
import { pluginsServiceKeys } from '../../pluginsServiceKeys';

export const harmonyDelegationsByValidatorOptions = (
    params: IGetHarmonyDelegationsByValidatorParams,
    options?: QueryOptions<IHarmonyDelegation[]>,
): SharedQueryOptions<IHarmonyDelegation[]> => ({
    queryKey: pluginsServiceKeys.harmonyDelegationsByValidator(params),
    queryFn: () => pluginsService.getHarmonyDelegationsByValidator(params),
    ...options,
});

export const useHarmonyDelegationsByValidator = (
    params: IGetHarmonyDelegationsByValidatorParams,
    options?: QueryOptions<IHarmonyDelegation[]>,
) => {
    return useQuery(harmonyDelegationsByValidatorOptions(params, options));
};
