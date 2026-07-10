import type { IDialogComponentDefinitions } from '@/shared/components/dialogProvider';
import { GovernanceProcessRequiredDialog } from '../dialogs/governanceProcessRequiredDialog';
import { InstallHarmonyVotingDialog } from '../dialogs/installHarmonyVotingDialog';
import { PrepareHarmonyVotingInstallationDialog } from '../dialogs/prepareHarmonyVotingInstallationDialog';
import { PrepareDaoContractsUpdateDialog } from '../dialogs/prepareDaoContractsUpdateDialog';
import { PreparePluginUninstallationDialog } from '../dialogs/preparePluginUninstallationDialog';
import { UninstallPluginAlertDialog } from '../dialogs/uninstallPluginAlertDialog';
import { UpdateDaoContractsListDialog } from '../dialogs/updateDaoContractsListDialog';
import { SettingsDialogId } from './settingsDialogId';

export const settingsDialogDefinitions: Record<SettingsDialogId, IDialogComponentDefinitions> = {
    [SettingsDialogId.UPDATE_DAO_CONTRACTS_LIST]: { Component: UpdateDaoContractsListDialog, size: 'lg' },
    [SettingsDialogId.PREPARE_DAO_CONTRACTS_UPDATE]: { Component: PrepareDaoContractsUpdateDialog },
    [SettingsDialogId.GOVERNANCE_PROCESS_REQUIRED]: {
        Component: GovernanceProcessRequiredDialog,
        size: 'lg',
        hiddenDescription: 'app.settings.governanceProcessRequiredDialog.a11y.description',
    },
    [SettingsDialogId.UNINSTALL_PLUGIN_ALERT]: {
        Component: UninstallPluginAlertDialog,
        size: 'lg',
        hiddenDescription: 'app.settings.uninstallPluginAlertDialog.a11y.description',
        variant: 'critical',
    },
    [SettingsDialogId.PREPARE_PLUGIN_UNINSTALLATION]: { Component: PreparePluginUninstallationDialog },
    [SettingsDialogId.INSTALL_HARMONY_VOTING]: { Component: InstallHarmonyVotingDialog, size: 'lg' },
    [SettingsDialogId.PREPARE_HARMONY_VOTING_INSTALLATION]: { Component: PrepareHarmonyVotingInstallationDialog },
};
