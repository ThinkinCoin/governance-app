import { Network } from '@/shared/api/daoService';
import type { Chain, Hex } from 'viem';
import {
    arbitrum,
    avalanche,
    base,
    chiliz,
    katana,
    mainnet,
    optimism,
    peaq,
    polygon,
    sepolia,
    zksync,
    zksyncSepoliaTestnet,
} from 'wagmi/chains';
import type { IContractVersionInfo } from '../types';

export interface INetworkDefinitionAddresses {
    /**
     * Address of the base DAO contract used for OSx updates.
     */
    dao: Hex;
    /**
     * Factory address used for deploying DAOs.
     */
    daoFactory: Hex;
    /**
     * Address of the plugin setup processor.
     */
    pluginSetupProcessor: Hex;
    /**
     * Executor address for SPP sub-plugins.
     */
    globalExecutor: Hex;
    /**
     * Address of the condition factory.
     */
    conditionFactory: Hex;
}

export interface ICountryIntegrationAddresses {
    /**
     * TLD label (e.g. "country").
     */
    tld: string;
    /**
     * 1.country RegistrarController.
     */
    registrarController: Hex;
    /**
     * ENS-like registry contract (DC).
     */
    registry: Hex;
    /**
     * Public resolver address used by the registrar controller.
     */
    publicResolver: Hex;

    /**
     * BaseRegistrar (ERC-721) for second-level .country names.
     */
    baseRegistrar?: Hex;

    /**
     * Optional TLD name wrapper (if deployed/used by the integration).
     */
    tldNameWrapper?: Hex;
}

export interface IHarmonyPluginAddresses {
    /**
     * Address of the HIP Voting Plugin Repository.
     */
    hipVotingPluginRepo: Hex;
    /**
     * Address of the Delegation Voting Plugin Repository.
     */
    delegationVotingPluginRepo: Hex;
    /**
     * Address of the Validator OptIn Registry.
     */
    validatorOptInRegistry: Hex;
    /**
     * Address of the HIP Plugin Allowlist (controls HIP access).
     */
    hipPluginAllowlist: Hex;
}

export interface INetworkDefinition extends Chain {
    /**
     * Name of the network.
     */
    name: string;
    /**
     * Logo of the network.
     */
    logo: string;
    /**
     * Configuration for the private RPC endpoint to use.
     */
    privateRpcConfig?: {
        /**
         * RPC provider to use.
         */
        rpcProvider: RpcProvider;
        /**
         * URL of the private RPC endpoint to use.
         */
        rpcUrl: string;
    };
    /**
     * Addresses for the network.
     */
    addresses: INetworkDefinitionAddresses;

    /**
     * Optional 1.country integration configuration.
     */
    country?: ICountryIntegrationAddresses;
    /**
     * Optional Harmony-specific plugin addresses.
     */
    harmonyPlugins?: IHarmonyPluginAddresses;
    /**
     * Latest version of the OSx framework.
     */
    protocolVersion: IContractVersionInfo;
    /**
     * Order of the network in the network selection.
     */
    order: number;
    /**
     * Whether the network has beta support or not.
     */
    beta?: boolean;
    /**
     * Whether the network is disabled in DAO creation.
     */
    disabled?: boolean;
    /**
     * Whether the network is supported by Tenderly.
     */
    tenderlySupport: boolean;
}

export enum RpcProvider {
    ALCHEMY = 'alchemy',
    ANKR = 'ankr',
    DRPC = 'drpc',
    PEAQ = 'peaq',
}

const latestProtocolVersion: IContractVersionInfo = {
    release: 1,
    build: 4,
    patch: 0,
    releaseNotes: 'https://github.com/aragon/osx/releases/tag/v1.4.0',
    description:
        "This optional upgrade introduces minor features that make the DAO compatible with the StagedProposalProcessor plugin, enabling complex multi-body governance structures. The upgrade also includes minor bug fixes and ensures full compatibility with Aragon's governance features.",
};

// Harmony chains (not provided by wagmi in this app)
const parseOptionalIntEnv = (value: string | undefined): number | undefined => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const harmonyMainnetChainId = parseOptionalIntEnv(process.env.NEXT_PUBLIC_HARMONY_CHAIN_ID) ?? 1666600000;
const harmonyMainnetRpcUrl = process.env.NEXT_PUBLIC_HARMONY_RPC_URL ?? 'https://api.harmony.one';

const harmonyChain: Chain = {
    id: harmonyMainnetChainId,
    name: 'Harmony',
    nativeCurrency: { name: 'Harmony', symbol: 'ONE', decimals: 18 },
    rpcUrls: {
        default: { http: [harmonyMainnetRpcUrl] },
        public: { http: [harmonyMainnetRpcUrl] },
    },
    blockExplorers: {
        default: { name: 'Harmony Explorer', url: 'https://explorer.harmony.one' },
    },
};

const harmonyTestnetChain: Chain = {
    id: 1666700000,
    name: 'Harmony Testnet',
    nativeCurrency: { name: 'Harmony', symbol: 'ONE', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://api.s0.b.hmny.io'] },
        public: { http: ['https://api.s0.b.hmny.io'] },
    },
    blockExplorers: {
        default: { name: 'Harmony Explorer', url: 'https://explorer.testnet.harmony.one' },
    },
};

export const networkDefinitions: Record<Network, INetworkDefinition> = {
    // Mainnets
    [Network.ETHEREUM_MAINNET]: {
        ...mainnet,
        name: 'Ethereum',
        logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
        privateRpcConfig: {
            rpcProvider: RpcProvider.ALCHEMY,
            rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/',
        },
        order: 1,
        protocolVersion: latestProtocolVersion,
        tenderlySupport: true,
        disabled: true,
        addresses: {
            dao: '0x58C1F7Bc62Bb63fb137bc8F6d8ea6321a0501d29',
            daoFactory: '0x246503df057A9a85E0144b6867a828c99676128B',
            pluginSetupProcessor: '0xE978942c691e43f65c1B7c7F8f1dc8cDF061B13f',
            globalExecutor: '0x56ce4D8006292Abf418291FaE813C1E3769240A4',
            conditionFactory: '0x988B0e1542d5e9494897778ebc444E9FfDa58Ddb',
        },
    },
    [Network.POLYGON_MAINNET]: {
        ...polygon,
        name: 'Polygon',
        logo: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png',
        privateRpcConfig: {
            rpcProvider: RpcProvider.ALCHEMY,
            rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/',
        },
        order: 2,
        protocolVersion: latestProtocolVersion,
        tenderlySupport: true,
        disabled: true,
        addresses: {
            dao: '0xDC5E714720797Fa0B453Bc9eF5049548C79031C3',
            daoFactory: '0x9BC7f1dc3cFAD56a0EcD924D1f9e70f5C7aF0039',
            pluginSetupProcessor: '0x879D9dfe3F36d7684BeC1a2bB4Aa8E8871A7245B',
            globalExecutor: '0xD24Bdf1573605C3Df87430F240cB580015f197B5',
            conditionFactory: '0x988B0e1542d5e9494897778ebc444E9FfDa58Ddb',
        },
    },
    [Network.BASE_MAINNET]: {
        ...base,
        name: 'Base',
        logo: 'https://mirror-media.imgix.net/publication-images/cgqxxPdUFBDjgKna_dDir.png?h=250&w=250',
        privateRpcConfig: {
            rpcProvider: RpcProvider.ALCHEMY,
            rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/',
        },
        order: 3,
        protocolVersion: latestProtocolVersion,
        tenderlySupport: true,
        disabled: true,
        addresses: {
            dao: '0xBeb2271224D22BdA388B513268873387E5BfC27f',
            daoFactory: '0xcc602EA573a42eBeC290f33F49D4A87177ebB8d2',
            pluginSetupProcessor: '0x91a851E9Ed7F2c6d41b15F76e4a88f5A37067cC9',
            globalExecutor: '0x304eBcA6a98F3a2d4424388814ddbFf8904Bd1cE',
            conditionFactory: '0x988B0e1542d5e9494897778ebc444E9FfDa58Ddb',
        },
    },
    [Network.ARBITRUM_MAINNET]: {
        ...arbitrum,
        name: 'Arbitrum',
        logo: 'https://docs.arbitrum.io/img/logo.svg',
        privateRpcConfig: {
            rpcProvider: RpcProvider.ALCHEMY,
            rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/',
        },
        order: 4,
        protocolVersion: latestProtocolVersion,
        tenderlySupport: true,
        disabled: true,
        addresses: {
            dao: '0xc3F1f4d3B4E24b6F019120205e12A01D733BEb55',
            daoFactory: '0x49e04AB7af7A263b8ac802c1cAe22f5b4E4577Cd',
            pluginSetupProcessor: '0x308a1DC5020c4B5d992F5543a7236c465997fecB',
            globalExecutor: '0x198b64a53b39f454e56626d9262cBf67E7C13138',
            conditionFactory: '0x988B0e1542d5e9494897778ebc444E9FfDa58Ddb',
        },
    },
    [Network.OPTIMISM_MAINNET]: {
        ...optimism,
        name: 'Optimism',
        logo: 'https://altcoinsbox.com/wp-content/uploads/2023/03/optimism-logo.svg',
        privateRpcConfig: {
            rpcProvider: RpcProvider.ALCHEMY,
            rpcUrl: 'https://opt-mainnet.g.alchemy.com/v2/',
        },
        order: 5,
        protocolVersion: latestProtocolVersion,
        tenderlySupport: true,
        disabled: true,
        addresses: {
            dao: '0x42D24803D8697050CA59f6E306322eC9fce8D7e9',
            daoFactory: '0xB001Bd6A21056c2a7FB5A5b9005cf896b181e74d',
            pluginSetupProcessor: '0x2379Dc18B4A939a2B76F5c79f58aa49193DA56C2',
            globalExecutor: '0x3A8bd3C4Dd02340868c75b5B671673EA094a75bB',
            conditionFactory: '0x988B0e1542d5e9494897778ebc444E9FfDa58Ddb',
        },
    },
    [Network.AVAX_MAINNET]: {
        ...avalanche,
        name: 'Avalanche',
        logo: 'https://assets.coingecko.com/coins/images/12559/standard/Avalanche_Circle_RedWhite_Trans.png',
        privateRpcConfig: {
            rpcProvider: RpcProvider.ALCHEMY,
            rpcUrl: 'https://avax-mainnet.g.alchemy.com/v2/',
        },
        order: 6,
        protocolVersion: latestProtocolVersion,
        tenderlySupport: true,
        disabled: true,
        addresses: {
            dao: '0x9b8B929b961C53168B0321540005bE7F1b47FD8c',
            daoFactory: '0xb393ED8e7ACDe6bC3d38a8d3548B99c152AaC912',
            pluginSetupProcessor: '0x95902780BD390A32f2E1EDf02623F8e636CEE518',
            globalExecutor: '0xAcdA1352B005031ffFaa80A8B16f8fDC91fbF5F1',
            conditionFactory: '0x3AB0866601fD82f255432D2Bb78E37C115537aB5',
        },
    },
    [Network.KATANA_MAINNET]: {
        ...katana,
        name: 'Katana',
        logo: 'https://assets.coingecko.com/asset_platforms/images/32239/large/katana.jpg',
        privateRpcConfig: {
            rpcProvider: RpcProvider.DRPC,
            rpcUrl: 'https://lb.drpc.live/katana/',
        },
        order: 7,
        protocolVersion: latestProtocolVersion,
        beta: false,
        tenderlySupport: true,
        disabled: true,
        addresses: {
            dao: '0xb8Be55076350164C62aE0CFB69560B0f0A9B8a33',
            daoFactory: '0xd59D2bEF6465cC71efEc40afd2D72901470Dd835',
            pluginSetupProcessor: '0xfD4dBD760e253b7ee0CE81d47946DAdd2531F1fC',
            globalExecutor: '0x7b73F551167AbFE2585a6baE6def948489c1855C',
            conditionFactory: '0xE22884A20f9aCECB5174Cb55F6AA36600C13E87a',
        },
    },
    [Network.ZKSYNC_MAINNET]: {
        ...zksync,
        name: 'zkSync',
        logo: 'https://assets.coingecko.com/coins/images/38043/large/ZKTokenBlack.png',
        privateRpcConfig: {
            rpcProvider: RpcProvider.ALCHEMY,
            rpcUrl: 'https://zksync-mainnet.g.alchemy.com/v2/',
        },
        order: 8,
        protocolVersion: latestProtocolVersion,
        tenderlySupport: true,
        disabled: true,
        addresses: {
            dao: '0x9B43625b28fa32CaB68d84F1B46E2721DD70Ba42',
            daoFactory: '0x01019505E3B87340d7Fa69EF3E2510A7642f067A',
            pluginSetupProcessor: '0x8E3e98ECF5CdBF2bEcCD91d3BA580D472df5A0cB',
            globalExecutor: '0x581F87d3d3aE015c912Cb6E7B521A130493Cc497',
            conditionFactory: '0x988B0e1542d5e9494897778ebc444E9FfDa58Ddb',
        },
    },
    [Network.CHILIZ_MAINNET]: {
        ...chiliz,
        name: 'Chiliz',
        logo: 'https://assets.coingecko.com/coins/images/8834/large/CHZ_Token_updated.png',
        privateRpcConfig: {
            rpcProvider: RpcProvider.ANKR,
            rpcUrl: 'https://rpc.ankr.com/chiliz/',
        },
        order: 9,
        protocolVersion: latestProtocolVersion,
        beta: true,
        tenderlySupport: false,
        disabled: true,
        addresses: {
            dao: '0x221B2d4fF2dEf7Bb1Da68460760B299e4c2D8AdD',
            daoFactory: '0xdD68D6b46b887AcB795eCC3Fc7bb3fEf2Dfebf8f',
            pluginSetupProcessor: '0xD39Fd78987000C1aa96209d76bec576F31DbC9bE',
            globalExecutor: '0xcF34b77813f5d5daBa0A6F085bf0911e00E7b99A',
            conditionFactory: '0x988B0e1542d5e9494897778ebc444E9FfDa58Ddb',
        },
    },
    [Network.PEAQ_MAINNET]: {
        ...peaq,
        name: 'Peaq',
        logo: 'https://assets.coingecko.com/coins/images/51415/large/peaq-token-brand-icon_%281%29.png',
        privateRpcConfig: {
            rpcProvider: RpcProvider.PEAQ,
            rpcUrl: 'https://responsive-powerful-mansion.peaq-mainnet.quiknode.pro/',
        },
        order: 10,
        protocolVersion: latestProtocolVersion,
        beta: true,
        tenderlySupport: true,
        disabled: true,
        addresses: {
            dao: '0xa8a4Dc9B6f16BEe4E527CEA47FBeb6e0802030e1',
            daoFactory: '0x35B62715459cB60bf6dC17fF8cfe138EA305E7Ee',
            pluginSetupProcessor: '0x08633901DdF9cD8e2DC3a073594d0A7DaD6f3f57',
            globalExecutor: '0x07f49c49Ce2A99CF7C28F66673d406386BDD8Ff4',
            conditionFactory: '0xdFc18C8Cd61f6cfD0A3B0aF0C0f9a752e2BF1515',
        },
    },
    [Network.HARMONY_MAINNET]: {
        ...harmonyChain,
        name: 'Harmony',
        logo: 'https://assets.coingecko.com/coins/images/4344/large/Y88JAze.png',
        order: 11,
        protocolVersion: latestProtocolVersion,
        tenderlySupport: false,
        country: {
            tld: 'country',
            registrarController: '0x76c6fE3aEe636f88d01De64931514e8CD64D94Fb',
            registry: '0x547942748Cc8840FEc23daFdD01E6457379B446D',
            publicResolver: '0x46E37034Ffc87a969d1a581748Acf6a94Bc7415D',
            baseRegistrar: '0x4D64B78eAf6129FaC30aB51E6D2D679993Ea9dDD',
            tldNameWrapper: '0x4Cd2563118e57B19179d8DC033f2B0C5B5D69ff5',
        },
        addresses: {
            // NOTE: 'dao' must point to the base DAO implementation (DAOFactory.daoBase).
            dao: '0x14B83cf98a6a311D8ff3c311D781ac392348316b',
            daoFactory: '0xBbfff9D297762931ae7Dc37F0cc33a397bC50Ba0',
            pluginSetupProcessor: '0x6300477942944d2501db08cD5b7e37DC6423E77C',
            globalExecutor: '0xC5066174C2ED21acbdcAd9Bb4d3BdeeDdd56CE37',
            conditionFactory: '0x7992fbe76bD9B007AB165Af04Be09BC0F6C89aF6',
        },
        harmonyPlugins: {
            hipVotingPluginRepo: '0xe155d19e0acd3c209173fe78c105287f75a4d4bd',
            delegationVotingPluginRepo: '0x5fc989f79f34be026385645d0650687c96a41638',
            validatorOptInRegistry: '0xefd431a6c97bff60dd60eeadedee3ce38e561180',
            hipPluginAllowlist: '0xe7b0445369b7a653ad4f05f79b5797bc3fefcef7',
        },
    },

    // Testnets
    [Network.ETHEREUM_SEPOLIA]: {
        ...sepolia,
        name: 'Ethereum Sepolia',
        logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
        privateRpcConfig: {
            rpcProvider: RpcProvider.ALCHEMY,
            rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/',
        },
        order: 0,
        protocolVersion: latestProtocolVersion,
        tenderlySupport: true,
        disabled: true,
        addresses: {
            dao: '0x824d4AAD1cbF2327c4C429E3c97F968Ee19344F8',
            daoFactory: '0xB815791c233807D39b7430127975244B36C19C8e',
            pluginSetupProcessor: '0xC24188a73dc09aA7C721f96Ad8857B469C01dC9f',
            globalExecutor: '0x7a20760b89EF507759DD2c5A0d1f1657614341A9',
            conditionFactory: '0x988B0e1542d5e9494897778ebc444E9FfDa58Ddb',
        },
    },
    [Network.ZKSYNC_SEPOLIA]: {
        ...zksyncSepoliaTestnet,
        name: 'zkSync Sepolia',
        logo: 'https://assets.coingecko.com/coins/images/38043/large/ZKTokenBlack.png',
        privateRpcConfig: {
            rpcProvider: RpcProvider.ALCHEMY,
            rpcUrl: 'https://zksync-sepolia.g.alchemy.com/v2/',
        },
        order: 12,
        protocolVersion: latestProtocolVersion,
        tenderlySupport: true,
        disabled: true,
        addresses: {
            dao: '0x39e836A6c32163733929B213965e3feC0007914a',
            daoFactory: '0xee321f16f7F0a0F0d8b850E70c4eAde4A288ECd7',
            pluginSetupProcessor: '0xe2Ef39f1be2269644cBfa9b70003A143bF1fdf4d',
            globalExecutor: '0x0ED69b3b690e10Fb509FA1b081C1b74EF3FeB36D',
            conditionFactory: '0x988B0e1542d5e9494897778ebc444E9FfDa58Ddb',
        },
    },
    [Network.HARMONY_TESTNET]: {
        ...harmonyTestnetChain,
        name: 'Harmony Testnet',
        logo: 'https://assets.coingecko.com/coins/images/4344/large/Y88JAze.png',
        order: 13,
        protocolVersion: latestProtocolVersion,
        tenderlySupport: false,
        beta: true,
        addresses: {
            dao: '0x0000000000000000000000000000000000000000',
            daoFactory: '0x0000000000000000000000000000000000000000',
            pluginSetupProcessor: '0x0000000000000000000000000000000000000000',
            globalExecutor: '0x0000000000000000000000000000000000000000',
            conditionFactory: '0x0000000000000000000000000000000000000000',
        },
    },
};
