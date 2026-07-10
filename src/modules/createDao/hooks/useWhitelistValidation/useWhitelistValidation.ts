import { useWhitelistedAddresses } from '@/modules/explore/api/cmsService/queries/useWhitelistedAddresses';
import { useDebugContext } from '@/shared/components/debugProvider';
import { addressUtils } from '@aragon/gov-ui-kit';
import { useAccount } from 'wagmi';
import type { IWhitelistValidationParams, IWhitelistValidationResult } from './useWhiteListValidation.api';

export const useWhitelistValidation = (params: IWhitelistValidationParams): IWhitelistValidationResult => {
    const { plugins } = params;

    const { address } = useAccount();
    const { data } = useWhitelistedAddresses();
    const { values } = useDebugContext<{ enableAllPlugins: boolean }>();

    const enabledPlugins: typeof plugins = [];
    const disabledPlugins: typeof plugins = [];

    const isDebug = !!values.enableAllPlugins;

    for (const plugin of plugins) {
        if (isDebug) {
            enabledPlugins.push(plugin);
            continue;
        }

        const requiresAllowlist = !!plugin.requiresAllowlist;

        if (!address) {
            disabledPlugins.push(plugin);
            continue;
        }

        if (requiresAllowlist) {
            if (data == null) {
                disabledPlugins.push(plugin);
                continue;
            }

            const list = data[plugin.id] ?? [];
            const approved = list.some((whitelistAddress) => addressUtils.isAddressEqual(whitelistAddress, address));

            if (approved) {
                enabledPlugins.push(plugin);
            } else {
                disabledPlugins.push(plugin);
            }

            continue;
        }

        enabledPlugins.push(plugin);
    }

    return { enabledPlugins, disabledPlugins };
};
