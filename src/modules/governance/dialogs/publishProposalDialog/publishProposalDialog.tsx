import { Network, PluginInterfaceType, useDao } from '@/shared/api/daoService';
import { usePinJson } from '@/shared/api/ipfsService/mutations';
import { TransactionType } from '@/shared/api/transactionService';
import { useBlockNavigationContext } from '@/shared/components/blockNavigationContext';
import {
    type IBuildTransactionDialogSuccessLinkHref,
    type ITransactionDialogActionParams,
    type ITransactionDialogStep,
    type ITransactionDialogStepMeta,
    TransactionDialog,
    type TransactionDialogStep,
} from '@/shared/components/transactionDialog';
import { useTranslations } from '@/shared/components/translationsProvider';
import { useStepper } from '@/shared/hooks/useStepper';
import { daoUtils } from '@/shared/utils/daoUtils';
import { networkDefinitions } from '@/shared/constants/networkDefinitions';
import { permissionManagerAbi } from '@/shared/utils/permissionTransactionUtils/abi/permissionManagerAbi';
import { permissionTransactionUtils } from '@/shared/utils/permissionTransactionUtils';
import { AlertInline, invariant, ProposalDataListItem, ProposalStatus } from '@aragon/gov-ui-kit';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useBalance, useReadContract, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import type { IProposalCreateAction, IPublishProposalDialogProps } from './publishProposalDialog.api';
import { publishProposalDialogUtils } from './publishProposalDialogUtils';
import { decodeFunctionData, encodeFunctionData, keccak256, toBytes, type Hex, zeroHash } from 'viem';

export enum PublishProposalStep {
    GRANT_PSP_ROOT_PERMISSION = 'GRANT_PSP_ROOT_PERMISSION',
    PIN_METADATA = 'PIN_METADATA',
}

export const PublishProposalDialog: React.FC<IPublishProposalDialogProps> = (props) => {
    const { location } = props;

    invariant(location.params != null, 'PublishProposalDialog: required parameters must be set.');

    const { address } = useAccount();
    invariant(address != null, 'PublishProposalDialog: user must be connected.');

    const { daoId, plugin, proposal, prepareActions, translationNamespace, transactionInfo } = location.params;

    const { title, summary } = proposal;

    const { t } = useTranslations();
    const { setIsBlocked } = useBlockNavigationContext();

    const { data: dao } = useDao({ urlParams: { id: daoId } });

    const isHarmonyNetwork = dao?.network === Network.HARMONY_MAINNET || dao?.network === Network.HARMONY_TESTNET;
    const isHarmonyVotingPlugin =
        plugin.interfaceType === PluginInterfaceType.HARMONY_HIP_VOTING ||
        plugin.interfaceType === PluginInterfaceType.HARMONY_DELEGATION_VOTING;

    const harmonyChainId = useMemo(() => {
        if (dao?.network == null) return undefined;
        return networkDefinitions[dao.network as Network]?.id;
    }, [dao?.network]);

    const minProposerBalanceWei = BigInt('1000000000000000000');
    const { data: proposerBalance, isLoading: isBalanceLoading } = useBalance({
        address,
        chainId: harmonyChainId,
        query: { enabled: isHarmonyNetwork && isHarmonyVotingPlugin && harmonyChainId != null },
    });

    const hasEnoughProposerBalance = useMemo(() => {
        if (!isHarmonyNetwork || !isHarmonyVotingPlugin) return true;
        const bal = proposerBalance?.value;
        return bal != null && bal >= minProposerBalanceWei;
    }, [isHarmonyNetwork, isHarmonyVotingPlugin, proposerBalance?.value]);

    const stepper = useStepper<ITransactionDialogStepMeta, PublishProposalStep | TransactionDialogStep>({
        initialActiveStep: PublishProposalStep.PIN_METADATA,
    });

    const { data: pinJsonData, status, mutate: pinJson } = usePinJson({ onSuccess: stepper.nextStep });

    const [grantRootTxHash, setGrantRootTxHash] = useState<Hex | undefined>(undefined);
    const { sendTransaction, status: grantRootSendStatus } = useSendTransaction({
        mutation: {
            onSuccess: (hash: Hex) => setGrantRootTxHash(hash),
        },
    });
    const { status: grantRootWaitStatus, error: grantRootWaitError } = useWaitForTransactionReceipt({
        hash: grantRootTxHash,
    });

    const rootPermissionId = useMemo(
        () => keccak256(toBytes(permissionTransactionUtils.permissionIds.rootPermission)),
        [],
    );

    const proposalNeedsPspRootGrant = useMemo(() => {
        if (dao == null || dao.network !== Network.HARMONY_MAINNET) {
            return false;
        }

        const daoAddress = dao.address as Hex;
        const pspAddress = networkDefinitions[dao.network as Network].addresses.pluginSetupProcessor as Hex;

        if (!daoAddress?.startsWith('0x') || !pspAddress?.startsWith('0x')) {
            return false;
        }

        return proposal.actions.some((action: IProposalCreateAction) => {
            if (action.to == null || action.data == null) {
                return false;
            }

            // Ações de grant/revoke no DAO são a causa raiz do revert no Step 2 (Harmony)
            // quando executadas por um Admin plugin que ainda não tem ROOT no DAO.
            try {
                const decoded = decodeFunctionData({ abi: permissionManagerAbi, data: action.data as Hex });

                if (decoded.functionName !== 'grant') {
                    return false;
                }

                const [where, who, permissionId] = decoded.args as readonly [Hex, Hex, Hex];
                return (
                    where.toLowerCase() === daoAddress.toLowerCase() &&
                    who.toLowerCase() === pspAddress.toLowerCase() &&
                    permissionId.toLowerCase() === rootPermissionId.toLowerCase()
                );
            } catch {
                return false;
            }
        });
    }, [dao, proposal.actions, rootPermissionId]);

    const shouldWrapActionsInDaoExecute =
        dao?.network === Network.HARMONY_MAINNET && plugin.interfaceType === PluginInterfaceType.ADMIN;

    const shouldHandleHarmonyAdminRootGrant =
        !shouldWrapActionsInDaoExecute &&
        dao?.network === Network.HARMONY_MAINNET &&
        plugin.interfaceType === PluginInterfaceType.ADMIN &&
        proposalNeedsPspRootGrant;

    const pspAddress = useMemo(() => {
        if (dao == null) {
            return undefined;
        }

        return networkDefinitions[dao.network as Network].addresses.pluginSetupProcessor as Hex;
    }, [dao]);

    const { data: isPspRootGranted } = useReadContract({
        address: dao?.address as Hex,
        abi: permissionManagerAbi,
        functionName: 'isGranted',
        args: [dao?.address as Hex, pspAddress as Hex, rootPermissionId, '0x'],
        query: {
            enabled:
                shouldHandleHarmonyAdminRootGrant &&
                dao?.address?.startsWith('0x') &&
                pspAddress != null &&
                (pspAddress as string).startsWith('0x'),
        },
    });

    const grantPspRootStepState = useMemo(() => {
        if (!shouldHandleHarmonyAdminRootGrant) {
            return 'success' as const;
        }

        if (isPspRootGranted === true) {
            return 'success' as const;
        }

        if (grantRootSendStatus === 'error' || grantRootWaitStatus === 'error') {
            return 'error' as const;
        }

        if (grantRootSendStatus === 'pending' || grantRootWaitStatus === 'pending') {
            return 'pending' as const;
        }

        return 'idle' as const;
    }, [shouldHandleHarmonyAdminRootGrant, isPspRootGranted, grantRootSendStatus, grantRootWaitStatus]);

    const handlePinJson = useCallback(
        (params: ITransactionDialogActionParams) => {
            const proposalMetadata = publishProposalDialogUtils.prepareMetadata(proposal);
            pinJson({ body: proposalMetadata }, params);
        },
        [pinJson, proposal],
    );

    const handleGrantPspRootPermission = useCallback(
        (params: ITransactionDialogActionParams) => {
            invariant(dao != null, 'PublishProposalDialog: DAO must be loaded.');
            invariant(pspAddress != null, 'PublishProposalDialog: PSP address must be loaded.');

            // Se já tem ROOT, segue o fluxo.
            if (!shouldHandleHarmonyAdminRootGrant || isPspRootGranted === true) {
                stepper.nextStep();
                return;
            }

            const transaction = permissionTransactionUtils.buildGrantPermissionTransaction({
                where: dao.address as Hex,
                who: pspAddress,
                what: permissionTransactionUtils.permissionIds.rootPermission,
                to: dao.address as Hex,
            });

            sendTransaction(transaction, params);
        },
        [dao, pspAddress, shouldHandleHarmonyAdminRootGrant, isPspRootGranted, stepper, sendTransaction],
    );

    useEffect(() => {
        if (!shouldHandleHarmonyAdminRootGrant) {
            return;
        }

        if (grantRootWaitError) {
            // O TransactionDialog já faz monitoramento de erro por stepId; aqui só evitamos loop.
            return;
        }

        if (grantRootWaitStatus === 'success') {
            stepper.nextStep();
        }
    }, [shouldHandleHarmonyAdminRootGrant, grantRootWaitStatus, grantRootWaitError, stepper]);

    useEffect(() => {
        if (!shouldHandleHarmonyAdminRootGrant) {
            return;
        }

        if (isPspRootGranted === true) {
            stepper.nextStep();
        }
    }, [shouldHandleHarmonyAdminRootGrant, isPspRootGranted, stepper]);

    const daoExecuteAbi = useMemo(
        () =>
            [
                {
                    type: 'function',
                    name: 'execute',
                    stateMutability: 'nonpayable',
                    inputs: [
                        { name: '_callId', type: 'bytes32' },
                        {
                            name: '_actions',
                            type: 'tuple[]',
                            components: [
                                { name: 'to', type: 'address' },
                                { name: 'value', type: 'uint256' },
                                { name: 'data', type: 'bytes' },
                            ],
                        },
                        { name: '_allowFailureMap', type: 'uint256' },
                    ],
                    outputs: [
                        { name: 'execResults', type: 'bytes[]' },
                        { name: 'failureMap', type: 'uint256' },
                    ],
                },
            ] as const,
        [],
    );

    const handlePrepareTransaction = async () => {
        invariant(pinJsonData != null, 'PublishProposalDialog: metadata not pinned for prepare transaction step.');
        const { IpfsHash: metadataCid } = pinJsonData;

        // HarmonyVoting requires the proposer wallet to have at least 1 ONE.
        // Failing this would revert on-chain, so we block early with a clear error.
        if (isHarmonyNetwork && isHarmonyVotingPlugin) {
            if (isBalanceLoading) {
                throw new Error('Loading wallet balance. Please wait a moment and try again.');
            }

            if (!hasEnoughProposerBalance) {
                throw new Error('You need at least 1 ONE in your wallet to create a Harmony voting proposal.');
            }
        }

        const { actions } = proposal;

        const processedActions = await publishProposalDialogUtils.prepareActions({ actions, prepareActions });

        const wrappedActions = shouldWrapActionsInDaoExecute
            ? ([
                  {
                      to: dao?.address as Hex,
                      value: BigInt(0),
                      data: encodeFunctionData({
                          abi: daoExecuteAbi,
                          functionName: 'execute',
                          args: [
                              zeroHash,
                              processedActions.map((a) => ({
                                  to: a.to as Hex,
                                  value: typeof a.value === 'bigint' ? a.value : BigInt(a.value),
                                  data: a.data as Hex,
                              })),
                              BigInt(0),
                          ],
                      }),
                  },
              ] satisfies IProposalCreateAction[])
            : processedActions;

        const processedProposal = { ...proposal, actions: wrappedActions };

        return publishProposalDialogUtils.buildTransaction({
            proposal: processedProposal,
            metadataCid,
            plugin,
        });
    };

    // Handler function to disable the navigation block when the transaction is needed.
    // We can't simply just pass the href to the TransactionDialog
    const getProposalsLink = ({ slug }: IBuildTransactionDialogSuccessLinkHref) => {
        setIsBlocked(false);

        return daoUtils.getDaoUrl(dao, `proposals/${slug!.toUpperCase()}`)!;
    };

    const customSteps: Array<ITransactionDialogStep<PublishProposalStep>> = useMemo(
        () => [
            ...(shouldHandleHarmonyAdminRootGrant
                ? [
                      {
                          id: PublishProposalStep.GRANT_PSP_ROOT_PERMISSION,
                          order: 0,
                          meta: {
                              label: t(
                                  `app.governance.publishProposalDialog.step.${PublishProposalStep.GRANT_PSP_ROOT_PERMISSION}.label`,
                              ),
                              errorLabel: t(
                                  `app.governance.publishProposalDialog.step.${PublishProposalStep.GRANT_PSP_ROOT_PERMISSION}.errorLabel`,
                              ),
                              state: grantPspRootStepState,
                              action: handleGrantPspRootPermission,
                              auto: true,
                          },
                      },
                  ]
                : []),
            {
                id: PublishProposalStep.PIN_METADATA,
                order: shouldHandleHarmonyAdminRootGrant ? 1 : 0,
                meta: {
                    label: t(`app.governance.publishProposalDialog.step.${PublishProposalStep.PIN_METADATA}.label`),
                    errorLabel: t(
                        `app.governance.publishProposalDialog.step.${PublishProposalStep.PIN_METADATA}.errorLabel`,
                    ),
                    state: status,
                    action: handlePinJson,
                    auto: true,
                },
            },
        ],
        [
            shouldHandleHarmonyAdminRootGrant,
            grantPspRootStepState,
            handleGrantPspRootPermission,
            status,
            handlePinJson,
            t,
        ],
    );

    const namespace = translationNamespace ?? 'app.governance.publishProposalDialog';

    return (
        <TransactionDialog<PublishProposalStep>
            title={t(`${namespace}.title`)}
            description={t(`${namespace}.description`)}
            submitLabel={t(`${namespace}.button.submit`)}
            successLink={{ label: t('app.governance.publishProposalDialog.button.success'), href: getProposalsLink }}
            stepper={stepper}
            customSteps={customSteps}
            prepareTransaction={handlePrepareTransaction}
            autoApprove={dao?.network === Network.HARMONY_MAINNET}
            network={dao?.network}
            transactionType={TransactionType.PROPOSAL_CREATE}
            indexingFallbackUrl={daoUtils.getDaoUrl(dao, 'proposals')}
            transactionInfo={transactionInfo}
        >
            {isHarmonyNetwork && isHarmonyVotingPlugin && !hasEnoughProposerBalance && (
                <AlertInline
                    variant="critical"
                    message="You need at least 1 ONE in your wallet to create a Harmony voting proposal."
                />
            )}
            {plugin.interfaceType !== PluginInterfaceType.ADMIN && (
                <ProposalDataListItem.Structure
                    title={title}
                    summary={summary}
                    publisher={{ address }}
                    status={ProposalStatus.DRAFT}
                />
            )}
        </TransactionDialog>
    );
};
