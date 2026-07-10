import { GovernanceDialogId } from '@/modules/governance/constants/governanceDialogId';
import type { IPublishProposalDialogParams } from '@/modules/governance/dialogs/publishProposalDialog';
import { PluginInterfaceType, type IDaoPlugin, useDao } from '@/shared/api/daoService';
import { type IDialogComponentProps, useDialogContext } from '@/shared/components/dialogProvider';
import {
    type ITransactionDialogStepMeta,
    TransactionDialog,
    TransactionDialogStep,
} from '@/shared/components/transactionDialog';
import { useTranslations } from '@/shared/components/translationsProvider';
import { networkDefinitions } from '@/shared/constants/networkDefinitions';
import { useDaoChain } from '@/shared/hooks/useDaoChain';
import { useStepper } from '@/shared/hooks/useStepper';
import { monitoringUtils } from '@/shared/utils/monitoringUtils';
import { pluginTransactionUtils } from '@/shared/utils/pluginTransactionUtils';
import { invariant } from '@aragon/gov-ui-kit';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Hex, TransactionReceipt } from 'viem';
import { useAccount, usePublicClient } from 'wagmi';
import { harmonyDelegationVotingPlugin, harmonyHipVotingPlugin } from '@/plugins/harmonyVotingPlugin/constants/harmonyVotingPlugins';
import { prepareHarmonyVotingInstallationDialogUtils } from './prepareHarmonyVotingInstallationDialogUtils';

export interface IPrepareHarmonyVotingInstallationDialogParams {
    daoId: string;
    proposalPlugin: IDaoPlugin;
    installType: PluginInterfaceType.HARMONY_HIP_VOTING | PluginInterfaceType.HARMONY_DELEGATION_VOTING;
    validatorAddress?: string;
    processKey?: string;
}

export interface IPrepareHarmonyVotingInstallationDialogProps
    extends IDialogComponentProps<IPrepareHarmonyVotingInstallationDialogParams> {}

export const PrepareHarmonyVotingInstallationDialog: React.FC<IPrepareHarmonyVotingInstallationDialogProps> = (props) => {
    const { location } = props;

    invariant(location.params != null, 'PrepareHarmonyVotingInstallationDialog: required parameters must be set.');
    const { daoId, proposalPlugin, installType, validatorAddress, processKey } = location.params;

    const { address, chainId } = useAccount();
    invariant(address != null, 'PrepareHarmonyVotingInstallationDialog: user must be connected.');

    const { t } = useTranslations();
    const { open } = useDialogContext();
    const hasProposalDialogBeenOpened = useRef(false);

    const { data: dao } = useDao({ urlParams: { id: daoId } });

    const { chainId: requiredChainId } = useDaoChain({ network: dao?.network });
    const publicClient = usePublicClient({ chainId: requiredChainId });

    const [gasEstimate, setGasEstimate] = useState<bigint | undefined>();

    const initialStep = TransactionDialogStep.PREPARE;
    const stepper = useStepper<ITransactionDialogStepMeta, TransactionDialogStep>({ initialActiveStep: initialStep });

    const installPlugin = useMemo(() => {
        return installType === PluginInterfaceType.HARMONY_DELEGATION_VOTING
            ? harmonyDelegationVotingPlugin
            : harmonyHipVotingPlugin;
    }, [installType]);

    useEffect(() => {
        monitoringUtils.logMessage('HarmonyVoting: Prepare installation dialog opened', {
            context: {
                daoId,
                installType,
                installPluginId: installPlugin.id,
                proposalPluginSlug: proposalPlugin.slug,
            },
        });
    }, [daoId, installType, installPlugin.id, proposalPlugin.slug]);

    const handlePrepareTransaction = async () => {
        invariant(dao != null, 'PrepareHarmonyVotingInstallationDialog: DAO not found.');

        monitoringUtils.logMessage('HarmonyVoting: Prepare installation transaction requested', {
            context: {
                daoId,
                installType,
                installPluginId: installPlugin.id,
            },
        });

        if (chainId != null && requiredChainId != null && chainId !== requiredChainId) {
            const requiredNetworkName = networkDefinitions[dao.network]?.name ?? 'the correct network';
            throw new Error(`Please switch your wallet to ${requiredNetworkName} before preparing the installation.`);
        }

        const { tx } = await prepareHarmonyVotingInstallationDialogUtils.buildPrepareInstallationTransaction(
            dao,
            installPlugin,
            validatorAddress,
            processKey,
        );

        if (publicClient != null && address != null) {
            try {
                const estimatedGas = await publicClient.estimateGas({
                    account: address,
                    to: tx.to,
                    data: tx.data,
                    value: tx.value,
                });
                setGasEstimate(estimatedGas);
            } catch {
                setGasEstimate(undefined);
            }
        }

        return tx;
    };

    const transactionInfo = useMemo(
        () => ({
            title: t('app.settings.prepareHarmonyVotingInstallationDialog.transactionInfoTitle'),
            current: 1,
            total: 2,
            details: gasEstimate ? `Estimated gas: ${gasEstimate.toString()}` : undefined,
        }),
        [t, gasEstimate],
    );

    const openProposalPublishDialog = useCallback(
        (setupData: ReturnType<typeof pluginTransactionUtils.getPluginInstallationSetupData>, pluginSetupProcessorAddress: Hex) => {
            invariant(dao != null, 'PrepareHarmonyVotingInstallationDialog: DAO not found.');

            monitoringUtils.logMessage('HarmonyVoting: Opening publish proposal dialog (apply install)', {
                context: {
                    daoId,
                    installType,
                    installPluginId: installPlugin.id,
                    proposalPluginSlug: proposalPlugin.slug,
                },
            });

            const proposalActions = pluginTransactionUtils.buildApplyPluginsInstallationActions({
                dao,
                setupData,
                pluginSetupProcessorAddress,
            });

            const proposalMetadata = prepareHarmonyVotingInstallationDialogUtils.prepareApplyInstallationProposalMetadata(
                installType,
                proposalPlugin,
            );
            const translationNamespace = 'app.settings.prepareHarmonyVotingInstallationDialog.publishInstallProposal';

            const txInfo = { title: t(`${translationNamespace}.transactionInfoTitle`), current: 2, total: 2 };
            const params: IPublishProposalDialogParams = {
                proposal: { ...proposalMetadata, resources: [], actions: proposalActions },
                daoId,
                plugin: proposalPlugin,
                translationNamespace,
                transactionInfo: txInfo,
            };

            open(GovernanceDialogId.PUBLISH_PROPOSAL, { params });
            hasProposalDialogBeenOpened.current = true;
        },
        [dao, daoId, installType, installPlugin.id, open, proposalPlugin.slug, proposalPlugin, t],
    );

    const handlePrepareInstallationSuccess = (txReceipt: TransactionReceipt) => {
        if (hasProposalDialogBeenOpened.current) {
            return;
        }

        invariant(txReceipt.to != null, 'PrepareHarmonyVotingInstallationDialog: PSP address not found on receipt.');

        const setupData = pluginTransactionUtils.getPluginInstallationSetupData(txReceipt);
        openProposalPublishDialog(setupData, txReceipt.to as Hex);
    };

    if (hasProposalDialogBeenOpened.current) {
        return null;
    }

    return (
        <TransactionDialog
            title={t('app.settings.prepareHarmonyVotingInstallationDialog.title')}
            description={t('app.settings.prepareHarmonyVotingInstallationDialog.description')}
            submitLabel={t('app.settings.prepareHarmonyVotingInstallationDialog.button.submit')}
            onSuccess={handlePrepareInstallationSuccess}
            transactionInfo={transactionInfo}
            stepper={stepper}
            prepareTransaction={handlePrepareTransaction}
            network={dao?.network}
        />
    );
};
