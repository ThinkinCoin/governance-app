'use client';

import { GovernanceDialogId } from '@/modules/governance/constants/governanceDialogId';
import { GovernanceSlotId } from '@/modules/governance/constants/moduleSlots';
import type { ISelectPluginDialogParams } from '@/modules/governance/dialogs/selectPluginDialog';
import { usePermissionCheckGuard } from '@/modules/governance/hooks/usePermissionCheckGuard';
import { type IDaoPlugin, type Network, useDao, useDaoPolicies } from '@/shared/api/daoService';
import { useDialogContext } from '@/shared/components/dialogProvider';
import { Page } from '@/shared/components/page';
import { PluginFilterComponent } from '@/shared/components/pluginFilterComponent';
import { PolicyDataListItem } from '@/shared/components/policyDataListItem';
import { ProcessDataListItem } from '@/shared/components/processDataListItem';
import { useTranslations } from '@/shared/components/translationsProvider';
import { useDaoPlugins } from '@/shared/hooks/useDaoPlugins';
import { PluginType } from '@/shared/types';
import { daoUtils } from '@/shared/utils/daoUtils';
import { versionComparatorUtils } from '@/shared/utils/versionComparatorUtils';
import { Button, IconType } from '@aragon/gov-ui-kit';
import { useRouter } from 'next/navigation';
import { CapitalFlowDialogId } from '../../../capitalFlow/constants/capitalFlowDialogId';
import { CreateDaoDialogId } from '../../../createDao/constants/createDaoDialogId';
import type { ICreateProcessDetailsDialogParams } from '../../../createDao/dialogs/createProcessDetailsDialog';
import { DaoHierarchy } from '../../components/daoHierarchy';
import { DaoSettingsInfo } from '../../components/daoSettingsInfo';
import { DaoVersionInfo } from '../../components/daoVersionInfo';
import { DaoPrimaryNameCard } from '../../components/daoPrimaryNameCard';
import { UpdateDaoContracts } from '../../components/updateDaoContracts';
import { SettingsSlotId } from '../../constants/moduleSlots';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface IDaoSettingsPageClientProps {
    /**
     * ID of the Dao
     */
    daoId: string;
    /**
     * Whether SubDAO feature is enabled.
     */
    isSubDaoEnabled?: boolean;
}

export const DaoSettingsPageClient: React.FC<IDaoSettingsPageClientProps> = (props) => {
    const { daoId, isSubDaoEnabled } = props;

    const { t } = useTranslations();
    const { open } = useDialogContext();
    const router = useRouter();

    const daoParams = { urlParams: { id: daoId } };
    const { data: dao } = useDao(daoParams);

    const isRootModeEnabled = process.env.NEXT_PUBLIC_FEAT_ROOT === 'true';
    const queryClient = useQueryClient();

    const { data: visibilityStatus } = useQuery({
        queryKey: ['daoVisibilityStatus', dao?.network, dao?.address],
        enabled: isRootModeEnabled && dao != null,
        queryFn: async (): Promise<{ status: boolean }> => {
            const response = await fetch(`/api/admin-backend/dao/status/${dao?.address}/${dao?.network}`, {
                cache: 'no-store',
            });

            if (!response.ok) {
                throw new Error(response.statusText);
            }

            return (await response.json()) as { status: boolean };
        },
    });

    const { mutate: toggleDaoVisibility, isPending: isTogglingVisibility } = useMutation({
        mutationFn: async (nextStatus: boolean) => {
            const response = await fetch(
                `/api/admin-backend/dao/set-status/${dao?.address}/${dao?.network}/${nextStatus ? 'true' : 'false'}`,
                { method: 'POST', cache: 'no-store' },
            );

            if (!response.ok) {
                throw new Error(response.statusText);
            }

            return (await response.json()) as boolean;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['daoVisibilityStatus', dao?.network, dao?.address] });
        },
    });

    const processPlugins = useDaoPlugins({ daoId, type: PluginType.PROCESS })!;

    const { data: policies = [] } = useDaoPolicies(
        { urlParams: { network: dao?.network as Network, daoAddress: dao?.address as string } },
        { enabled: isSubDaoEnabled && dao != null },
    );

    const hasSupportedPlugins = daoUtils.hasSupportedPlugins(dao);

    const { check: createProposalGuard } = usePermissionCheckGuard({
        permissionNamespace: 'proposal',
        slotId: GovernanceSlotId.GOVERNANCE_PERMISSION_CHECK_PROPOSAL_CREATION,
        plugin: processPlugins[0]?.meta,
        daoId,
    });

    ////////////////
    // NEW PROCESS
    ////////////////

    const handleNewProcessPermissionGuardSuccess = (plugin: IDaoPlugin) =>
        router.push(daoUtils.getDaoUrl(dao, `create/${plugin.address}/process`)!);

    const handleNewProcessPluginSelected = (plugin: IDaoPlugin) => {
        createProposalGuard({
            plugin,
            onSuccess: () => handleNewProcessPermissionGuardSuccess(plugin),
            // on error, go back to the plugin selection
            onError: handleNewProcessCreationConfirm,
        });
    };

    const handleNewProcessCreationConfirm = () => {
        // Select a plugin (a process to use to create a new process). If there is only 1 plugin, skip selection step.
        if (processPlugins.length === 1) {
            handleNewProcessPluginSelected(processPlugins[0].meta);
            return;
        }

        const params: ISelectPluginDialogParams = {
            daoId,
            onPluginSelected: handleNewProcessPluginSelected,
            variant: 'process',
        };
        open(GovernanceDialogId.SELECT_PLUGIN, { params });
    };

    const handleAddProcess = () => {
        const params: ICreateProcessDetailsDialogParams = { onActionClick: handleNewProcessCreationConfirm };
        open(CreateDaoDialogId.CREATE_PROCESS_DETAILS, { params });
    };

    // Adding processes to a DAO is only supported on OSx versions equal or greater to 1.4
    const supportsAddProcess = versionComparatorUtils.isGreaterOrEqualTo(dao?.version, '1.4');
    const addProcessAction = {
        onClick: handleAddProcess,
        label: t('app.settings.daoSettingsPage.main.governanceAction'),
        iconLeft: IconType.PLUS,
        variant: 'secondary',
    };

    //////////////
    // NEW POLICY
    //////////////

    const handleNewPolicyPermissionGuardSuccess = (plugin: IDaoPlugin) =>
        router.push(daoUtils.getDaoUrl(dao, `create/${plugin.address}/policy`)!);

    const handleNewPolicyPluginSelected = (plugin: IDaoPlugin) => {
        createProposalGuard({
            plugin,
            onSuccess: () => handleNewPolicyPermissionGuardSuccess(plugin),
            // on error, go back to the plugin selection
            onError: handleNewPolicyCreationConfirm,
        });
    };

    const handleNewPolicyCreationConfirm = () => {
        // Select a plugin (a process to use to create a new policy). If there is only 1 plugin, skip selection step.
        if (processPlugins.length === 1) {
            handleNewPolicyPluginSelected(processPlugins[0].meta);
            return;
        }

        const params: ISelectPluginDialogParams = {
            daoId,
            onPluginSelected: handleNewPolicyPluginSelected,
            variant: 'process',
        };
        open(GovernanceDialogId.SELECT_PLUGIN, { params });
    };

    const handleAddPolicy = () => {
        const params: ICreateProcessDetailsDialogParams = { onActionClick: handleNewPolicyCreationConfirm };
        open(CapitalFlowDialogId.CREATE_POLICY_DETAILS, { params });
    };

    const addPolicyAction = {
        onClick: handleAddPolicy,
        label: t('app.settings.daoSettingsPage.main.automationAction'),
        iconLeft: IconType.PLUS,
        variant: 'secondary',
    };

    if (!dao) {
        return null;
    }

    return (
        <>
            <Page.Main title={t('app.settings.daoSettingsPage.main.title')}>
                <PluginFilterComponent
                    plugins={processPlugins}
                    slotId={SettingsSlotId.SETTINGS_PANEL}
                    daoId={daoId}
                    searchParamName="settingsPanel"
                />
                <Page.MainSection title={t('app.settings.daoSettingsPage.main.settingsInfoTitle')}>
                    {isSubDaoEnabled ? <DaoHierarchy dao={dao} currentDaoId={daoId} /> : <DaoSettingsInfo dao={dao} />}
                </Page.MainSection>
                {isRootModeEnabled && dao && (
                    <Page.MainSection title={t('app.settings.daoSettings.primaryName.title')} inset={false}>
                        <DaoPrimaryNameCard
                            dao={dao}
                            onSuccess={() => {
                                void queryClient.invalidateQueries({ queryKey: ['dao', daoId] });
                            }}
                        />
                    </Page.MainSection>
                )}
                {hasSupportedPlugins && (
                    <Page.MainSection
                        id="governance"
                        className="gap-3"
                        inset={false}
                        title={t('app.settings.daoSettingsPage.main.governanceInfoTitle')}
                        action={supportsAddProcess ? addProcessAction : undefined}
                    >
                        {processPlugins.map((process) => (
                            <ProcessDataListItem
                                key={process.uniqueId}
                                process={process.meta}
                                href={daoUtils.getDaoUrl(dao, `/settings/${process.meta.slug}`)}
                            />
                        ))}
                    </Page.MainSection>
                )}
                {isSubDaoEnabled && (
                    <Page.MainSection
                        className="gap-3"
                        inset={false}
                        title={t('app.settings.daoSettingsPage.main.automationInfoTitle')}
                        action={addPolicyAction}
                    >
                        {policies.map((policy) => (
                            <PolicyDataListItem key={policy.address} policy={policy} />
                        ))}
                    </Page.MainSection>
                )}
            </Page.Main>
            <Page.Aside>
                <Page.AsideCard title={t('app.settings.daoSettingsPage.aside.versionInfoTitle')}>
                    <DaoVersionInfo dao={dao} />
                    <UpdateDaoContracts dao={dao} />
                    {isRootModeEnabled && (
                        <div className="mt-3">
                            <Button
                                variant="secondary"
                                size="md"
                                disabled={isTogglingVisibility || visibilityStatus == null}
                                onClick={() => {
                                    const currentIsVisible = visibilityStatus?.status;
                                    const nextStatus = currentIsVisible === false;
                                    toggleDaoVisibility(nextStatus);
                                }}
                            >
                                {visibilityStatus?.status === false
                                    ? t('app.settings.daoSettingsPage.rootActions.restore')
                                    : t('app.settings.daoSettingsPage.rootActions.archive')}
                            </Button>
                        </div>
                    )}
                </Page.AsideCard>
            </Page.Aside>
        </>
    );
};
