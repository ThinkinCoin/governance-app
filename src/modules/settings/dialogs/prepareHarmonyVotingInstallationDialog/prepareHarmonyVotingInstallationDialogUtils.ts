import type { IDao, IDaoPlugin } from '@/shared/api/daoService';
import { networkDefinitions } from '@/shared/constants/networkDefinitions';
import { daoUtils } from '@/shared/utils/daoUtils';
import { getPublicClient } from '@/shared/utils/networkUtils/publicClient';
import type { ITransactionRequest } from '@/shared/utils/transactionUtils';
import type { Hash, Hex } from 'viem';
import { BodyType } from '@/modules/createDao/types/enum/bodyType';
import type { ISetupBodyFormNew } from '@/modules/createDao/dialogs/setupBodyDialog';
import { PluginInterfaceType } from '@/shared/api/daoService';
import type { IPluginInfo } from '@/shared/types';
import { buildPrepareHarmonyVotingInstallData } from '@/plugins/harmonyVotingPlugin/utils/harmonyVotingTransactionUtils';
import type { IHarmonyVotingSetupMembershipForm } from '@/plugins/harmonyVotingPlugin/components/harmonyVotingSetupMembership';
import type { ICompositeAddress } from '@aragon/gov-ui-kit';

const daoFactoryAbi =
    [
        {
            type: 'function',
            name: 'pluginSetupProcessor',
            stateMutability: 'view',
            inputs: [],
            outputs: [{ name: '', type: 'address' }],
        },
    ] as const;

class PrepareHarmonyVotingInstallationDialogUtils {
    resolvePluginSetupProcessorAddress = async (dao: IDao): Promise<Hex> => {
        const fallback = networkDefinitions[dao.network].addresses.pluginSetupProcessor as Hex;

        const txHash = dao.transactionHash as Hash;
        if (!txHash?.startsWith('0x')) {
            return fallback;
        }

        try {
            const client = getPublicClient(dao.network);
            const tx = await client.getTransaction({ hash: txHash });

            const daoFactoryAddress = tx.to as Hex | null | undefined;
            if (!daoFactoryAddress) {
                return fallback;
            }

            const pspAddress = await client.readContract({
                address: daoFactoryAddress,
                abi: daoFactoryAbi,
                functionName: 'pluginSetupProcessor',
            });

            return (pspAddress as Hex) ?? fallback;
        } catch {
            return fallback;
        }
    };

    buildPrepareInstallationTransaction = async (
        dao: IDao,
        installPlugin: IPluginInfo,
        validatorAddress?: string,
        processKey?: string,
    ): Promise<{ tx: ITransactionRequest; pluginSetupProcessor: Hex }> => {
        const pluginSetupProcessor = await this.resolvePluginSetupProcessorAddress(dao);

        const body: ISetupBodyFormNew<Record<string, never>, ICompositeAddress, IHarmonyVotingSetupMembershipForm> = {
            internalId: 'harmony-voting-install',
            type: BodyType.NEW,
            plugin: installPlugin.id,
            canCreateProposal: true,
            name: installPlugin.name,
            description: undefined,
            resources: [],
            governance: {},
            membership: { members: [], validatorAddress, processKey },
        };

        const data = buildPrepareHarmonyVotingInstallData(installPlugin, {
            dao,
            body,
            metadata: '0x',
            stageVotingPeriod: undefined,
        });

        return { tx: { to: pluginSetupProcessor, data, value: BigInt(0) }, pluginSetupProcessor };
    };

    prepareApplyInstallationProposalMetadata = (installType: PluginInterfaceType, proposalPlugin: IDaoPlugin) => {
        const installPluginInfo = `${installType} (${installType.toUpperCase()})`;
        const proposalPluginInfo = `${daoUtils.getPluginName(proposalPlugin)} (${proposalPlugin.slug.toUpperCase()})`;

        const title = `Install ${installPluginInfo} process`;
        const summary = [
            `If approved, this proposal will install the ${installPluginInfo} plugin.`,
            `The installation will be executed via the current ${proposalPluginInfo} process.`,
        ].join(' ');

        return { title, summary };
    };
}

export const prepareHarmonyVotingInstallationDialogUtils = new PrepareHarmonyVotingInstallationDialogUtils();
