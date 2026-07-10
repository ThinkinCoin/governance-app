import { GovernanceDialogId } from '@/modules/governance/constants/governanceDialogId';
import { GovernanceSlotId } from '@/modules/governance/constants/moduleSlots';
import type { ISelectPluginDialogParams } from '@/modules/governance/dialogs/selectPluginDialog';
import { usePermissionCheckGuard } from '@/modules/governance/hooks/usePermissionCheckGuard';
import { PluginInterfaceType, useDao, type IDaoPlugin, Network } from '@/shared/api/daoService';
import { useDialogContext, type IDialogComponentProps } from '@/shared/components/dialogProvider';
import { useTranslations } from '@/shared/components/translationsProvider';
import { networkDefinitions } from '@/shared/constants/networkDefinitions';
import { evmAddressUtils } from '@/shared/utils/evmAddressUtils';
import { daoUtils } from '@/shared/utils/daoUtils';
import { monitoringUtils } from '@/shared/utils/monitoringUtils';
import { AddressInput, AlertInline, Dialog, InputText, RadioCard, RadioGroup, invariant } from '@aragon/gov-ui-kit';
import { useEffect, useMemo, useState } from 'react';
import { harmonyDelegationVotingPlugin, harmonyHipVotingPlugin } from '@/plugins/harmonyVotingPlugin/constants/harmonyVotingPlugins';
import { SettingsDialogId } from '../../constants/settingsDialogId';
import type { IPrepareHarmonyVotingInstallationDialogParams } from '../prepareHarmonyVotingInstallationDialog';
import { sanitizePlainText } from '@/shared/security';

export type HarmonyVotingInstallType =
    | PluginInterfaceType.HARMONY_HIP_VOTING
    | PluginInterfaceType.HARMONY_DELEGATION_VOTING;

export interface IInstallHarmonyVotingDialogParams {
    daoId: string;
}

export interface IInstallHarmonyVotingDialogProps extends IDialogComponentProps<IInstallHarmonyVotingDialogParams> {}

export const InstallHarmonyVotingDialog: React.FC<IInstallHarmonyVotingDialogProps> = (props) => {
    const { location } = props;

    invariant(location.params != null, 'InstallHarmonyVotingDialog: required parameters must be set.');
    const { daoId } = location.params;

    const { t } = useTranslations();
    const { open, close } = useDialogContext();

    const { data: dao } = useDao({ urlParams: { id: daoId } });

    const [installType, setInstallType] = useState<HarmonyVotingInstallType>(PluginInterfaceType.HARMONY_HIP_VOTING);
    const [validatorAddress, setValidatorAddress] = useState<string>('');
    const [processKey, setProcessKey] = useState<string>('');
    const [processKeyTouched, setProcessKeyTouched] = useState<boolean>(false);
    const [validatorAcceptedOnce, setValidatorAcceptedOnce] = useState<boolean>(false);
    const [addressInput, setAddressInput] = useState<string | undefined>('');
    const [validatorCustomError, setValidatorCustomError] = useState<string | undefined>(undefined);
    const [proposalPlugin, setProposalPlugin] = useState<IDaoPlugin | undefined>(undefined);

    const processKeyMaxLength = 5;
    const processKeyPattern = /^[A-Z]+$/;

    const selectedPluginInfo = useMemo(() => {
        return installType === PluginInterfaceType.HARMONY_DELEGATION_VOTING
            ? harmonyDelegationVotingPlugin
            : harmonyHipVotingPlugin;
    }, [installType]);

    useEffect(() => {
        monitoringUtils.logMessage('HarmonyVoting: Install dialog opened', {
            context: { daoId },
        });
    }, [daoId]);

    useEffect(() => {
        monitoringUtils.logMessage('HarmonyVoting: Install type selected', {
            context: { daoId, installType },
        });
    }, [daoId, installType]);

    const selectedRepoAddress = useMemo(() => {
        if (dao == null) return undefined;
        return selectedPluginInfo.repositoryAddresses[dao.network];
    }, [dao, selectedPluginInfo]);

    const isHarmonyDao = dao?.network === Network.HARMONY_MAINNET || dao?.network === Network.HARMONY_TESTNET;

    const validatorErrorKey = useMemo(() => {
        if (installType !== PluginInterfaceType.HARMONY_DELEGATION_VOTING) return undefined;

        const res = evmAddressUtils.validate(validatorAddress);
        if (res.ok) return undefined;

        return `app.plugins.harmonyDelegationVoting.setupMembership.validatorAddress.error.${res.error}`;
    }, [installType, validatorAddress]);

    const normalizedValidator = useMemo(() => {
        if (installType !== PluginInterfaceType.HARMONY_DELEGATION_VOTING) return undefined;
        const res = evmAddressUtils.validate(validatorAddress);
        return res.ok ? res.address : undefined;
    }, [installType, validatorAddress]);

    const normalizedProcessKey = useMemo(() => {
        if (installType !== PluginInterfaceType.HARMONY_DELEGATION_VOTING) return undefined;

        const key = processKey.trim();
        if (key.length === 0) return undefined;
        if (key.length > processKeyMaxLength) return undefined;
        if (!processKeyPattern.test(key)) return undefined;

        return key;
    }, [installType, processKey]);

    // Force mainnet for the input so ENS (*.eth) is supported even when installing on Harmony.
    const validatorInputChainId = networkDefinitions[Network.ETHEREUM_MAINNET].id;

    const isEnsLike = (value: string): boolean => /^(?:[a-z0-9-]+\.)*[a-z0-9-]+\.eth$/i.test(value.trim());

    const isRepoConfigured = selectedRepoAddress != null && selectedRepoAddress !== '0x0000000000000000000000000000000000000000';

    const canContinue =
        dao != null &&
        isHarmonyDao &&
        proposalPlugin != null &&
        isRepoConfigured &&
        (installType !== PluginInterfaceType.HARMONY_DELEGATION_VOTING ||
            (normalizedValidator != null && normalizedProcessKey != null));

    const { check: createProposalGuard } = usePermissionCheckGuard({
        permissionNamespace: 'proposal',
        slotId: GovernanceSlotId.GOVERNANCE_PERMISSION_CHECK_PROPOSAL_CREATION,
        plugin: proposalPlugin,
        daoId,
    });

    const handleProposalPluginSelected = (plugin: IDaoPlugin) => {
        setProposalPlugin(plugin);
        createProposalGuard({ plugin, onSuccess: () => setProposalPlugin(plugin) });
    };

    const handleSelectProposalPluginClick = () => {
        monitoringUtils.logMessage('HarmonyVoting: Select proposal process clicked', {
            context: { daoId, installType },
        });

        const params: ISelectPluginDialogParams = {
            daoId,
            onPluginSelected: handleProposalPluginSelected,
            fullExecuteOnly: true,
        };

        open(GovernanceDialogId.SELECT_PLUGIN, { params });
    };

    const handleContinueClick = () => {
        invariant(dao != null, 'InstallHarmonyVotingDialog: DAO must be loaded.');
        invariant(proposalPlugin != null, 'InstallHarmonyVotingDialog: proposal plugin must be selected.');

        monitoringUtils.logMessage('HarmonyVoting: Continue to prepare installation', {
            context: {
                daoId,
                installType,
                proposalPluginSlug: proposalPlugin.slug,
                proposalPluginAddress: proposalPlugin.address,
            },
        });

        const params: IPrepareHarmonyVotingInstallationDialogParams = {
            daoId,
            proposalPlugin,
            installType,
            validatorAddress: normalizedValidator,
            processKey: normalizedProcessKey,
        };

        open(SettingsDialogId.PREPARE_HARMONY_VOTING_INSTALLATION, { params });
    };

    const handleProcessKeyChange = (value: string) => {
        setProcessKeyTouched(true);
        setProcessKey(sanitizePlainText(value).toUpperCase());
    };

    const handleValidatorChange = (value?: string) => {
        // Keep a best-effort copy of what the user typed.
        setAddressInput(value ?? '');
        setValidatorCustomError(undefined);
    };

    const applyResolvedValidatorAddress = (resolvedAddress?: string, resolvedName?: string) => {
        if (!resolvedAddress) {
            return false;
        }

        const res = evmAddressUtils.validate(resolvedAddress);
        if (!res.ok) {
            return false;
        }

        setValidatorAddress(res.address);
        setAddressInput(resolvedName ?? res.address);
        setValidatorCustomError(undefined);
        return true;
    };

    const applyEnsNotResolvedError = (input: string) => {
        if (input.length === 0 || !isEnsLike(input)) {
            return false;
        }

        setValidatorCustomError(t('app.plugins.harmonyDelegationVoting.setupMembership.validatorAddress.error.ensNotResolved'));
        return true;
    };

    const applyTypedValidatorValue = (input: string) => {
        const res = evmAddressUtils.validate(input);
        if (res.ok) {
            setValidatorAddress(res.address);
            setAddressInput(res.address);
        } else {
            setValidatorAddress(input);
            setAddressInput(input);
        }
        setValidatorCustomError(undefined);
    };

    const handleValidatorAccept = (value?: { address?: string; name?: string }) => {
        const currentInput = (addressInput ?? '').trim();
        const resolvedAddress = value?.address;
        const resolvedName = value?.name;

        setValidatorAcceptedOnce(true);

        if (applyResolvedValidatorAddress(resolvedAddress, resolvedName)) {
            return;
        }

        if (applyEnsNotResolvedError(currentInput)) {
            return;
        }

        applyTypedValidatorValue(currentInput);
    };

    return (
        <>
            <Dialog.Header
                onClose={close}
                title={t('app.settings.installHarmonyVotingDialog.title')}
                description={t('app.settings.installHarmonyVotingDialog.description')}
            />
            <Dialog.Content>
                <div className="flex flex-col gap-6 pb-6">
                    {!isHarmonyDao && (
                        <AlertInline
                            variant="critical"
                            message={t('app.settings.installHarmonyVotingDialog.error.unsupportedNetwork')}
                        />
                    )}

                    {dao != null && isHarmonyDao && !isRepoConfigured && (
                        <AlertInline
                            variant="critical"
                            message={t('app.settings.installHarmonyVotingDialog.error.repoNotConfigured')}
                        />
                    )}

                    <div className="flex flex-col gap-3">
                        <div className="text-sm font-semibold text-neutral-800">
                            {t('app.settings.installHarmonyVotingDialog.field.processToInstall')}
                        </div>
                        <RadioGroup
                            value={String(installType)}
                            onValueChange={(value) =>
                                setInstallType(
                                    value === String(PluginInterfaceType.HARMONY_DELEGATION_VOTING)
                                        ? PluginInterfaceType.HARMONY_DELEGATION_VOTING
                                        : PluginInterfaceType.HARMONY_HIP_VOTING,
                                )
                            }
                        >
                            <RadioCard
                                className="w-full"
                                value={String(PluginInterfaceType.HARMONY_HIP_VOTING)}
                                label={t('app.plugins.harmonyHipVoting.setup.name')}
                                description={t('app.plugins.harmonyHipVoting.setup.description')}
                                tag={{
                                    variant: 'warning',
                                    label: t('app.createDao.setupBodyDialog.select.requiresAllowlist.label'),
                                }}
                            />
                            <RadioCard
                                className="w-full"
                                value={String(PluginInterfaceType.HARMONY_DELEGATION_VOTING)}
                                label={t('app.plugins.harmonyDelegationVoting.setup.name')}
                                description={t('app.plugins.harmonyDelegationVoting.setup.description')}
                                tag={{
                                    variant: 'warning',
                                    label: t('app.createDao.setupBodyDialog.select.requiresAllowlist.label'),
                                }}
                            />
                        </RadioGroup>
                    </div>

                    {installType === PluginInterfaceType.HARMONY_DELEGATION_VOTING && (
                        <div className="flex flex-col gap-2">
                            <AddressInput
                                label={t('app.plugins.harmonyDelegationVoting.setupMembership.validatorAddress.label')}
                                placeholder={t('app.plugins.harmonyDelegationVoting.setupMembership.validatorAddress.placeholder')}
                                helpText={t('app.plugins.harmonyDelegationVoting.setupMembership.validatorAddress.helpText')}
                                value={addressInput}
                                onChange={handleValidatorChange}
                                onAccept={handleValidatorAccept}
                                chainId={validatorInputChainId}
                            />

                            {validatorAcceptedOnce && (validatorCustomError || validatorErrorKey) && (
                                <AlertInline
                                    variant="critical"
                                    message={validatorCustomError ?? (validatorErrorKey ? t(validatorErrorKey) : '')}
                                />
                            )}

                            <InputText
                                label={t('app.createDao.createProcessForm.metadata.processKey.label')}
                                helpText={t('app.createDao.createProcessForm.metadata.processKey.helpText')}
                                placeholder={t('app.createDao.createProcessForm.metadata.processKey.label')}
                                maxLength={processKeyMaxLength}
                                value={processKey}
                                onChange={(event) => handleProcessKeyChange(event.target.value)}
                                onBlur={() => setProcessKeyTouched(true)}
                                variant={processKeyTouched && normalizedProcessKey == null ? 'critical' : 'default'}
                                alert={
                                    processKeyTouched && normalizedProcessKey == null
                                        ? {
                                              variant: 'critical',
                                              message: 'Process key must be 1-5 uppercase letters (A-Z).',
                                          }
                                        : undefined
                                }
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <div className="text-sm font-semibold text-neutral-800">
                            {t('app.settings.installHarmonyVotingDialog.field.proposalProcess')}
                        </div>
                        <div className="text-sm text-neutral-600">
                            {proposalPlugin
                                ? t('app.settings.installHarmonyVotingDialog.value.proposalProcessSelected', {
                                      name: daoUtils.getPluginName(proposalPlugin),
                                      slug: proposalPlugin.slug.toUpperCase(),
                                  })
                                : t('app.settings.installHarmonyVotingDialog.value.proposalProcessNotSelected')}
                        </div>
                    </div>
                </div>
            </Dialog.Content>
            <Dialog.Footer
                primaryAction={{
                    label: t('app.settings.installHarmonyVotingDialog.action.continue'),
                    onClick: handleContinueClick,
                    disabled: !canContinue,
                }}
                secondaryAction={{
                    label: proposalPlugin
                        ? t('app.settings.installHarmonyVotingDialog.action.changeProcess')
                        : t('app.settings.installHarmonyVotingDialog.action.selectProcess'),
                    onClick: handleSelectProposalPluginClick,
                }}
            />
        </>
    );
};
