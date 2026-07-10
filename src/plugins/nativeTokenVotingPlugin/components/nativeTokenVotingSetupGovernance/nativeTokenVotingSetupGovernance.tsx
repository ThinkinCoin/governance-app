'use client';

import { AdvancedDateInputDuration } from '@/shared/components/forms/advancedDateInput/advancedDateInputDuration';
import { NumberProgressInput } from '@/shared/components/forms/numberProgressInput';
import { useTranslations } from '@/shared/components/translationsProvider';
import { useFormField } from '@/shared/hooks/useFormField';
import { Card, InputContainer, InputNumber } from '@aragon/gov-ui-kit';
import { useWatch } from 'react-hook-form';
import type { INativeTokenVotingSetupGovernanceForm, INativeTokenVotingSetupGovernanceProps } from './nativeTokenVotingSetupGovernance.api';

const voteDurationMin = { days: 0, hours: 1, minutes: 0 };
const voteDurationDefault = { days: 1, hours: 0, minutes: 0 };

const defaultSupportThreshold = 50;
const defaultMinParticipation = 1;

export const NativeTokenVotingSetupGovernance: React.FC<INativeTokenVotingSetupGovernanceProps> = (props) => {
    const { formPrefix, isSubPlugin, showProposalCreationSettings } = props;

    const { t } = useTranslations();

    const supportThresholdFieldName = `${formPrefix}.supportThreshold`;
    const supportThreshold = useWatch<Record<string, INativeTokenVotingSetupGovernanceForm['supportThreshold']>>({
        name: supportThresholdFieldName,
        defaultValue: defaultSupportThreshold,
    });

    const supportContext = supportThreshold >= 50 ? 'majority' : 'minority';

    const minProposerVotingPowerField = useFormField<INativeTokenVotingSetupGovernanceForm, 'minProposerVotingPower'>(
        'minProposerVotingPower',
        {
            fieldPrefix: formPrefix,
            defaultValue: '0',
            label: t('app.plugins.nativeTokenVoting.setupGovernance.minProposerVotingPower.label'),
            rules: {
                validate: (value) => {
                    const numeric = Number(value ?? '');
                    return !isNaN(numeric) && numeric >= 0;
                },
            },
        },
    );

    return (
        <div className="flex w-full flex-col gap-y-6">
            <NumberProgressInput
                fieldName={supportThresholdFieldName}
                label={t('app.plugins.nativeTokenVoting.setupGovernance.supportThreshold.label')}
                helpText={t('app.plugins.nativeTokenVoting.setupGovernance.supportThreshold.helpText')}
                valueLabel={`> ${supportThreshold.toString()} %`}
                min={1}
                total={99}
                prefix=">"
                suffix="%"
                alert={{
                    message: t(`app.plugins.nativeTokenVoting.setupGovernance.supportThreshold.alert.${supportContext}`),
                    variant: supportContext === 'majority' ? 'success' : 'warning',
                }}
                defaultValue={defaultSupportThreshold}
                tags={[
                    {
                        label: t('app.plugins.nativeTokenVoting.setupGovernance.supportThreshold.tag.yes'),
                        variant: 'primary',
                    },
                    {
                        label: t('app.plugins.nativeTokenVoting.setupGovernance.supportThreshold.tag.no'),
                        variant: 'neutral',
                    },
                ]}
            />

            <NumberProgressInput
                fieldName={`${formPrefix}.minParticipation`}
                label={t('app.plugins.nativeTokenVoting.setupGovernance.minParticipation.label')}
                helpText={t('app.plugins.nativeTokenVoting.setupGovernance.minParticipation.helpText')}
                min={0}
                total={100}
                defaultValue={defaultMinParticipation}
                prefix="≥"
                suffix="%"
            />

            {!isSubPlugin && (
                <InputContainer
                    className="flex flex-col gap-6"
                    id="minDuration"
                    useCustomWrapper={true}
                    helpText={t('app.plugins.nativeTokenVoting.setupGovernance.minDuration.helpText')}
                    label={t('app.plugins.nativeTokenVoting.setupGovernance.minDuration.label')}
                >
                    <Card className="shadow-neutral-sm flex flex-col gap-6 border border-neutral-100 p-6">
                        <AdvancedDateInputDuration
                            field={`${formPrefix}.minDuration`}
                            label={t('app.plugins.nativeTokenVoting.setupGovernance.minDuration.label')}
                            className="!p-0"
                            minDuration={voteDurationMin}
                            defaultValue={voteDurationDefault}
                            useSecondsFormat={true}
                            validateMinDuration={true}
                            infoText={t('app.plugins.nativeTokenVoting.setupGovernance.minDuration.alertInfo', voteDurationMin)}
                        />
                    </Card>
                </InputContainer>
            )}

            {showProposalCreationSettings && (
                <InputNumber
                    min={0}
                    placeholder={t('app.plugins.nativeTokenVoting.setupGovernance.minProposerVotingPower.placeholder')}
                    helpText={t('app.plugins.nativeTokenVoting.setupGovernance.minProposerVotingPower.helpText')}
                    {...minProposerVotingPowerField}
                />
            )}
        </div>
    );
};
