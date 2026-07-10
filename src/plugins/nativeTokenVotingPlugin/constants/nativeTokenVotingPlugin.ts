import { Network, PluginInterfaceType } from '@/shared/api/daoService';
import type { IPluginInfo } from '@/shared/types';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const nativeTokenVotingPlugin: IPluginInfo = {
    id: PluginInterfaceType.NATIVE_TOKEN_VOTING,
    subdomain: 'native-token-voting',
    name: 'NativeTokenVoting',
    installVersion: {
        release: 1,
        build: 2,
        releaseNotes: 'https://github.com/Axodus/AragonOSX',
        description: 'Merkle snapshot voting power (wallet + staked) on Harmony.',
    },
    repositoryAddresses: {
        [Network.ARBITRUM_MAINNET]: ZERO_ADDRESS,
        [Network.BASE_MAINNET]: ZERO_ADDRESS,
        [Network.ETHEREUM_MAINNET]: ZERO_ADDRESS,
        [Network.ETHEREUM_SEPOLIA]: ZERO_ADDRESS,
        [Network.POLYGON_MAINNET]: ZERO_ADDRESS,
        [Network.ZKSYNC_MAINNET]: ZERO_ADDRESS,
        [Network.ZKSYNC_SEPOLIA]: ZERO_ADDRESS,
        [Network.PEAQ_MAINNET]: ZERO_ADDRESS,
        [Network.OPTIMISM_MAINNET]: ZERO_ADDRESS,
        [Network.CHILIZ_MAINNET]: ZERO_ADDRESS,
        [Network.AVAX_MAINNET]: ZERO_ADDRESS,
        [Network.KATANA_MAINNET]: ZERO_ADDRESS,
        [Network.HARMONY_MAINNET]: '0xF6E6cDe03ed3a7D5A87453e899CEb4D1F4e49C9B',
        [Network.HARMONY_TESTNET]: ZERO_ADDRESS,
    },
    setup: {
        nameKey: 'app.plugins.nativeTokenVoting.meta.setup.name',
        descriptionKey: 'app.plugins.nativeTokenVoting.meta.setup.description',
    },
};
