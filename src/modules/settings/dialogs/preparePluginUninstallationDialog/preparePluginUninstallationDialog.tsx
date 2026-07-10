import { GovernanceDialogId } from '@/modules/governance/constants/governanceDialogId';
import type { IPublishProposalDialogParams } from '@/modules/governance/dialogs/publishProposalDialog';
import { type IDaoPlugin, useDao } from '@/shared/api/daoService';
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
import { type IPluginUninstallSetupData, pluginTransactionUtils } from '@/shared/utils/pluginTransactionUtils';
import { invariant } from '@aragon/gov-ui-kit';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TransactionReceipt } from 'viem';
import { useAccount, usePublicClient } from 'wagmi';
import type { IUninstallPluginAlertDialogParams } from '../uninstallPluginAlertDialog';
import { preparePluginUninstallationDialogUtils } from './preparePluginUninstallationDialogUtils';

export interface IPreparePluginUninstallationDialogParams extends IUninstallPluginAlertDialogParams {
    /**
     * Plugin for creating the uninstall proposal.
     */
    proposalPlugin: IDaoPlugin;
}

export interface IPreparePluginUninstallationDialogProps
    extends IDialogComponentProps<IPreparePluginUninstallationDialogParams> {}

export const PreparePluginUninstallationDialog: React.FC<IPreparePluginUninstallationDialogProps> = (props) => {
    const { location } = props;

    invariant(location.params != null, 'PreparePluginUninstallationDialog: required parameters must be set.');
    const { daoId, uninstallPlugin, proposalPlugin, uninstallationPreparedEventLog } = location.params;

    const { address, chainId } = useAccount();
    invariant(address != null, 'PreparePluginUninstallationDialog: user must be connected.');

    const { t } = useTranslations();
    const { open } = useDialogContext();
    const hasProposalDialogBeenOpened = useRef(false);

    const { data: dao } = useDao({ urlParams: { id: daoId } });

    const { chainId: requiredChainId } = useDaoChain({ network: dao?.network });
    const publicClient = usePublicClient({ chainId: requiredChainId });

    const [gasEstimate, setGasEstimate] = useState<bigint | undefined>();

    const initialStep = TransactionDialogStep.PREPARE;
    const stepper = useStepper<ITransactionDialogStepMeta, TransactionDialogStep>({ initialActiveStep: initialStep });

    const handlePrepareTransaction = async () => {
        invariant(dao != null, 'PreparePluginUninstallationDialog: DAO not found.');

        if (chainId != null && requiredChainId != null && chainId !== requiredChainId) {
            const requiredNetworkName = networkDefinitions[dao.network]?.name ?? 'the correct network';
            throw new Error(`Please switch your wallet to ${requiredNetworkName} before preparing the installation.`);
        }

        const transaction = await preparePluginUninstallationDialogUtils.buildPrepareUninstallationTransaction(
            dao,
            uninstallPlugin,
        );

        if (publicClient != null && address != null) {
            try {
                const estimatedGas = await publicClient.estimateGas({
                    account: address,
                    to: transaction.to,
                    data: transaction.data,
                    value: transaction.value,
                });
                setGasEstimate(estimatedGas);
            } catch {
                setGasEstimate(undefined);
            }
        }

        return transaction;
    };

    const transactionInfo = useMemo(
        () => ({
            title: t('app.settings.preparePluginUninstallationDialog.transactionInfoTitle'),
            current: 1,
            total: 2,
            details: gasEstimate ? `Estimated gas: ${gasEstimate.toString()}` : undefined,
        }),
        [t, gasEstimate],
    );

    const handlePrepareUninstallationSuccess = (txReceipt: TransactionReceipt) => {
        const setupData = pluginTransactionUtils.getPluginUninstallSetupData(txReceipt);
        openProposalPublishDialog(setupData);
    };

    const openProposalPublishDialog = useCallback(
        (setupData: IPluginUninstallSetupData) => {
            invariant(dao != null, 'PreparePluginUninstallationDialog: DAO not found.');

            const proposalActions = pluginTransactionUtils.buildApplyPluginUninstallationAction({ dao, setupData });

            const proposalMetadata = preparePluginUninstallationDialogUtils.prepareApplyUninstallationProposalMetadata(
                uninstallPlugin,
                proposalPlugin,
            );
            const translationNamespace = 'app.settings.preparePluginUninstallationDialog.publishUninstallProposal';

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
        [dao, daoId, open, proposalPlugin, t, uninstallPlugin],
    );

    useEffect(() => {
        if (!uninstallationPreparedEventLog || hasProposalDialogBeenOpened.current) {
            return;
        }

        // Quando a desinstalação já foi preparada (por outra sessão), precisamos garantir que o
        // Apply aponte para o *mesmo* PSP que gerou o preparedSetupId (em Harmony isso pode variar).
        void (async () => {
            if (dao == null) {
                return;
            }

            const { pluginAddress, pluginSetupRepo, permissions, build, release } = uninstallationPreparedEventLog;
            const pluginSetupProcessorAddress =
                await preparePluginUninstallationDialogUtils.resolvePluginSetupProcessorAddress(dao);

            const setupData: IPluginUninstallSetupData = {
                pluginSetupRepo,
                pluginAddress,
                permissions,
                versionTag: {
                    build: Number(build),
                    release: Number(release),
                },
                pluginSetupProcessorAddress,
            };

            openProposalPublishDialog(setupData);
        })();
    }, [dao, openProposalPublishDialog, uninstallationPreparedEventLog]);

    if (uninstallationPreparedEventLog) {
        return null;
    }

    return (
        <TransactionDialog
            title={t('app.settings.preparePluginUninstallationDialog.title')}
            description={t('app.settings.preparePluginUninstallationDialog.description')}
            submitLabel={t('app.settings.preparePluginUninstallationDialog.button.submit')}
            onSuccess={handlePrepareUninstallationSuccess}
            transactionInfo={transactionInfo}
            stepper={stepper}
            prepareTransaction={handlePrepareTransaction}
            network={dao?.network}
        />
    );
};
