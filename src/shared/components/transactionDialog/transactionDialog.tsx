import { Network } from '@/shared/api/daoService';
import { useTransactionStatus } from '@/shared/api/transactionService';
import { useDialogContext } from '@/shared/components/dialogProvider';
import { useDaoChain } from '@/shared/hooks/useDaoChain';
import { ChainEntityType, Dialog, IconType } from '@aragon/gov-ui-kit';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccount, usePublicClient, useSendTransaction, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi';
import {
    TransactionStatus,
    type ITransactionStatusStepMetaAddon,
    type TransactionStatusState,
} from '../transactionStatus';
import { useTranslations } from '../translationsProvider';
import { TransactionDialogStep, type ITransactionDialogProps } from './transactionDialog.api';
import { TransactionDialogFooter } from './transactionDialogFooter';
import { transactionDialogUtils } from './transactionDialogUtils';

const indexingStepInterval = 1_000;

export const TransactionDialog = <TCustomStepId extends string>(props: ITransactionDialogProps<TCustomStepId>) => {
    const {
        title,
        description,
        customSteps,
        transactionInfo,
        stepper,
        submitLabel,
        successLink,
        children,
        prepareTransaction,
        onCancelClick,
        onSuccess,
        autoApprove = false,
        network = Network.ETHEREUM_MAINNET,
        transactionType,
        indexingFallbackUrl,
    } = props;

    const { activeStep, steps, activeStepIndex, nextStep, updateActiveStep, updateSteps } = stepper;
    const activeStepInfo = activeStep != null ? steps[activeStepIndex] : undefined;

    const { t } = useTranslations();
    const { switchChain, status: switchChainStatus } = useSwitchChain();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const { updateOptions } = useDialogContext();

    // Make the onSuccess property stable to only trigger it once on transaction success
    const onSuccessRef = useRef(onSuccess);

    const { chainId, address } = useAccount();
    const { chainId: requiredChainId, buildEntityUrl } = useDaoChain({ network });

    const publicClient = usePublicClient({ chainId: requiredChainId });

    const ensureOnline = useCallback(() => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            throw new Error('You appear to be offline. Please reconnect and try again.');
        }
    }, []);

    const handleTransactionError = useCallback(
        (stepId?: string) => (error: unknown, context?: Record<string, unknown>) =>
            transactionDialogUtils.monitorTransactionError(error, { stepId, from: address, ...context }),
        [address],
    );

    const [prepareErrorMessage, setPrepareErrorMessage] = useState<string | undefined>();

    const {
        mutate: prepareTransactionMutate,
        status: prepareTransactionStatus,
        data: transaction,
    } = useMutation({
        mutationFn: async () => {
            ensureOnline();
            const tx = await prepareTransaction();

            if (tx.gas != null || publicClient == null || address == null) {
                return tx;
            }

            try {
                const estimate = await publicClient.estimateGas({
                    account: address,
                    to: tx.to,
                    data: tx.data,
                    value: tx.value,
                });

                // Apply a small buffer to reduce false OOG on providers with slightly optimistic estimation.
                const gasWithBuffer = (estimate * BigInt(12)) / BigInt(10);
                return { ...tx, gas: gasWithBuffer };
            } catch (error: unknown) {
                // Gas estimation is best-effort; if it fails we rely on wallet/provider defaults.
                handleTransactionError(TransactionDialogStep.PREPARE)(error, { stage: 'estimateGas' });
                return tx;
            }
        },
        onMutate: () => setPrepareErrorMessage(undefined),
        onSuccess: nextStep,
        onError: (error) => {
            if (error instanceof Error && error.message.trim().length > 0) {
                setPrepareErrorMessage(error.message);
            }
        },
    });

    const {
        sendTransaction,
        status: approveTransactionStatus,
        data: transactionHash,
    } = useSendTransaction({ mutation: { onSuccess: nextStep } });

    const {
        data: txReceipt,
        status: waitTxStatus,
        fetchStatus: waitTxFetchStatus,
        error: waitTxError,
    } = useWaitForTransactionReceipt({
        hash: transactionHash,
    });

    const isIndexing = activeStep === TransactionDialogStep.INDEXING;

    const isChainMismatch = requiredChainId != null && chainId != null && requiredChainId !== chainId;

    // Using the `!` operator here as this hook is only enabled when the transactionHash and transactionType are defined
    const indexingUrlParams = { network, transactionHash: transactionHash! };
    const indexingParams = { urlParams: indexingUrlParams, queryParams: { type: transactionType! } };
    const { data: transactionStatus } = useTransactionStatus(indexingParams, {
        enabled: waitTxStatus === 'success' && isIndexing,
        refetchInterval: ({ state }) => (!state.data?.isProcessed ? indexingStepInterval : false),
    });

    const handleSendTransaction = useCallback((params: { onError: (error: unknown) => void }) => {
        const errorHandler = params.onError;

        try {
            ensureOnline();
        } catch (error: unknown) {
            errorHandler(error);
            return;
        }

        if (transaction == null) {
            errorHandler(new Error('TransactionDialog: transaction must be defined.'));
        } else {
            const transactionWithGasOverride =
                // Harmony: alguns RPCs aplicam gascap baixo em eth_call/estimateGas para calldata grande.
                // Para PROPOSAL_CREATE (especialmente multi-etapas), isso pode virar "OutOfGas" na estimativa.
                network === Network.HARMONY_MAINNET && transactionType != null
                    ? { ...transaction, gas: transaction.gas ?? BigInt(12_000_000) }
                    : transaction;

            sendTransaction(transactionWithGasOverride, { onError: errorHandler });
        }
    }, [ensureOnline, transaction, sendTransaction, network, transactionType]);

    const handleSwitchNetwork = useCallback(
        (params: { onError: (error: unknown) => void }) => {
            try {
                ensureOnline();
            } catch (error: unknown) {
                params.onError(error);
                return;
            }

            switchChain(
                { chainId: requiredChainId! },
                {
                    // Switching network should not auto-send the transaction; once chainId updates,
                    // the primary action will become the wallet signature step.
                    onError: params.onError,
                },
            );
        },
        [ensureOnline, switchChain, requiredChainId],
    );

    const handleRetryTransaction = useCallback((params: { onError: (error: unknown) => void }) => {
        updateActiveStep(TransactionDialogStep.APPROVE);
        handleSendTransaction(params);
    }, [updateActiveStep, handleSendTransaction]);

    const approveStepAction = requiredChainId === chainId ? handleSendTransaction : handleSwitchNetwork;
    const transactionStepActions: Record<TransactionDialogStep, (params: { onError: (error: unknown) => void }) => void> =
        useMemo(
        () => ({
            [TransactionDialogStep.PREPARE]: () => prepareTransactionMutate(),
            [TransactionDialogStep.APPROVE]: approveStepAction,
            [TransactionDialogStep.CONFIRM]: handleRetryTransaction,
            [TransactionDialogStep.INDEXING]: () => {
                // noOp needed as react query will refetch the transaction status
            },
        }),
        [prepareTransactionMutate, approveStepAction, handleRetryTransaction],
    );

    const approveStepStatus = chainId === requiredChainId ? approveTransactionStatus : switchChainStatus;
    const indexingStepStatus = transactionStatus?.isProcessed ? 'success' : isIndexing ? 'pending' : 'idle';
    const transactionStepStates: Record<TransactionDialogStep, TransactionStatusState> = useMemo(
        () => ({
            [TransactionDialogStep.PREPARE]: prepareTransactionStatus,
            [TransactionDialogStep.APPROVE]: approveStepStatus,
            [TransactionDialogStep.CONFIRM]: transactionDialogUtils.queryToStepState(waitTxStatus, waitTxFetchStatus),
            [TransactionDialogStep.INDEXING]: indexingStepStatus,
        }),
        [prepareTransactionStatus, approveStepStatus, waitTxStatus, waitTxFetchStatus, indexingStepStatus],
    );

    const transactionStepAddon: Record<TransactionDialogStep, ITransactionStatusStepMetaAddon | undefined> = useMemo(
        () => ({
            [TransactionDialogStep.PREPARE]: undefined,
            [TransactionDialogStep.APPROVE]: {
                label: t(`app.shared.transactionDialog.step.${TransactionDialogStep.APPROVE}.addon`),
                icon: IconType.BLOCKCHAIN_WALLET,
            },
            [TransactionDialogStep.CONFIRM]:
                transactionHash != null
                    ? {
                          label: t(`app.shared.transactionDialog.step.${TransactionDialogStep.CONFIRM}.addon`),
                          href: buildEntityUrl({ type: ChainEntityType.TRANSACTION, id: transactionHash }),
                      }
                    : undefined,
            [TransactionDialogStep.INDEXING]: undefined,
        }),
        [t, buildEntityUrl, transactionHash],
    );

    const transactionSteps = useMemo(() => {
        const stepKeys = Object.keys(TransactionDialogStep) as TransactionDialogStep[];

        const filteredSteps = transactionType
            ? stepKeys
            : stepKeys.filter((step) => step !== TransactionDialogStep.INDEXING);

        return filteredSteps.map((stepId, index) => ({
            id: stepId,
            order: (customSteps?.length ?? 0) + index,
            meta: {
                label: t(`app.shared.transactionDialog.step.${stepId}.label`),
                errorLabel:
                    stepId === TransactionDialogStep.PREPARE && prepareErrorMessage
                        ? prepareErrorMessage
                        : t(`app.shared.transactionDialog.step.${stepId}.errorLabel`),
                state: transactionStepStates[stepId],
                action: transactionStepActions[stepId],
                auto: stepId === TransactionDialogStep.PREPARE || (autoApprove && stepId === TransactionDialogStep.APPROVE),
                addon: transactionStepAddon[stepId],
            },
        }));
    }, [
        transactionType,
        customSteps,
        t,
        transactionStepStates,
        transactionStepActions,
        transactionStepAddon,
        autoApprove,
        prepareErrorMessage,
    ]);

    // Disable outside click for all transaction dialogs
    useEffect(() => updateOptions({ disableOutsideClick: true }), [updateOptions]);

    useEffect(() => {
        const { state, action, auto } = activeStepInfo?.meta ?? {};

        if (action == null || state !== 'idle' || !auto) {
            return;
        }

        // Use setTimeout to avoid double mutation on dev + StrictMode
        // (see https://github.com/TanStack/query/issues/5341)
        const timeout = setTimeout(() => action({ onError: handleTransactionError(activeStepInfo?.id) }), 100);
        return () => clearTimeout(timeout);
    }, [activeStepInfo, handleTransactionError]);

    useEffect(
        () => updateSteps([...(customSteps ?? []), ...transactionSteps]),
        [customSteps, transactionSteps, updateSteps],
    );

    useEffect(() => {
        if (waitTxError) {
            handleTransactionError(TransactionDialogStep.CONFIRM)(waitTxError, { transaction });
        }
    }, [waitTxError, transaction, handleTransactionError]);

    useEffect(() => {
        if (waitTxStatus === 'success') {
            onSuccessRef.current?.(txReceipt);
            nextStep();
        }
    }, [waitTxStatus, nextStep, txReceipt]);

    return (
        <>
            <Dialog.Header title={title} description={description} />
            <Dialog.Content>
                <div className="flex flex-col gap-6 pb-3 md:pb-4">
                    {children}
                    <TransactionStatus.Container steps={steps} transactionInfo={transactionInfo}>
                        {steps.map((step) => (
                            <TransactionStatus.Step key={step.id} {...step} />
                        ))}
                    </TransactionStatus.Container>
                </div>
            </Dialog.Content>
            <TransactionDialogFooter
                submitLabel={submitLabel}
                successLink={successLink}
                txReceipt={txReceipt}
                activeStep={activeStepInfo}
                onError={handleTransactionError(activeStepInfo?.id)}
                onCancelClick={onCancelClick}
                transactionType={transactionType}
                isChainMismatch={isChainMismatch}
                proposalSlug={transactionStatus?.slug}
                indexingFallbackUrl={indexingFallbackUrl}
            />
        </>
    );
};
