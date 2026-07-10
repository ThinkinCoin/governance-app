'use client';

import type { ICreateProposalEndDateForm } from '@/modules/governance/utils/createProposalUtils';
import { AdvancedDateInput } from '@/shared/components/forms/advancedDateInput';
import { useTranslations } from '@/shared/components/translationsProvider';
import { useFormField } from '@/shared/hooks/useFormField';
import { dateUtils } from '@/shared/utils/dateUtils';
import { InputContainer, InputNumber } from '@aragon/gov-ui-kit';
import { DateTime } from 'luxon';
import { useId } from 'react';
import { useWatch } from 'react-hook-form';
import { useEffect } from 'react';
import { useBlockNumber, usePublicClient } from 'wagmi';

export interface IHarmonyVotingCreateProposalSettingsForm extends ICreateProposalEndDateForm {
    /**
     * Snapshot block used to compute validator/delegator weights.
     */
    snapshotBlock?: number;
}

export const HarmonyVotingCreateProposalSettingsForm: React.FC = () => {
    const { t } = useTranslations();
    const containerId = useId();
    const recommendedMinDays = 3;

    const startTimeFixed = useWatch<ICreateProposalEndDateForm, 'startTimeFixed'>({ name: 'startTimeFixed' });
    const minEndTime = startTimeFixed ? dateUtils.parseFixedDate(startTimeFixed) : DateTime.now();

    const {
        value: snapshotBlock,
        onChange: onSnapshotBlockChange,
        ...snapshotField
    } = useFormField<IHarmonyVotingCreateProposalSettingsForm, 'snapshotBlock'>('snapshotBlock', {
        label: t('app.plugins.harmonyVoting.createProposalSettingsForm.snapshotBlock.label'),
        rules: {
            required: true,
            min: 1,
            validate: (value?: number) => value != null && Number.isFinite(value) && value >= 1,
        },
    });

    const publicClient = usePublicClient();
    const { data: latestBlockNumber } = useBlockNumber({ watch: true });

    const snapshotConfirmations = BigInt(30);

    useEffect(() => {
        if (snapshotBlock != null) {
            return;
        }

        let cancelled = false;

        const setDefaultSnapshotBlock = async () => {
            // Prefer 'safe' block tag when supported by the RPC.
            if (publicClient) {
                try {
                    const safeBlock = await publicClient.getBlock({ blockTag: 'safe' });
                    const safeBlockNumber = safeBlock.number;

                    if (!cancelled && safeBlockNumber != null && safeBlockNumber > BigInt(0)) {
                        onSnapshotBlockChange(Number(safeBlockNumber));
                        return;
                    }
                } catch {
                    // Ignore and fall back to latest - confirmations.
                }
            }

            if (latestBlockNumber != null) {
                const latest = BigInt(latestBlockNumber);
                const fallback = latest > snapshotConfirmations ? latest - snapshotConfirmations : latest;
                if (!cancelled) {
                    onSnapshotBlockChange(Number(fallback));
                }
            }
        };

        void setDefaultSnapshotBlock();

        return () => {
            cancelled = true;
        };
    }, [snapshotBlock, latestBlockNumber, onSnapshotBlockChange, publicClient]);

    return (
        <div className="flex flex-col gap-6 md:gap-12">
            <AdvancedDateInput
                label={t('app.plugins.harmonyVoting.createProposalSettingsForm.startTime.label')}
                helpText={t('app.plugins.harmonyVoting.createProposalSettingsForm.startTime.helpText')}
                field="startTime"
                minTime={DateTime.now()}
            />
            <AdvancedDateInput
                label={t('app.plugins.harmonyVoting.createProposalSettingsForm.endTime.label')}
                helpText={t('app.plugins.harmonyVoting.createProposalSettingsForm.endTime.helpText')}
                field="endTime"
                useDuration={true}
                minTime={minEndTime}
                minDuration={{ days: recommendedMinDays, hours: 0, minutes: 0 }}
            />
            <InputContainer
                id={containerId}
                label={t('app.plugins.harmonyVoting.createProposalSettingsForm.snapshotBlock.label')}
                helpText={t('app.plugins.harmonyVoting.createProposalSettingsForm.snapshotBlock.helpText')}
                useCustomWrapper={true}
            >
                <InputNumber
                    value={snapshotBlock}
                    min={1}
                    onChange={(value) => onSnapshotBlockChange(Number(value))}
                    {...snapshotField}
                />
            </InputContainer>
        </div>
    );
};
