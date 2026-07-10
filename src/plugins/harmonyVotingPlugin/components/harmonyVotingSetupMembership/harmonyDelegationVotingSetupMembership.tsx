'use client';

import { Network } from '@/shared/api/daoService';
import { useTranslations } from '@/shared/components/translationsProvider';
import { networkDefinitions } from '@/shared/constants/networkDefinitions';
import { useFormField } from '@/shared/hooks/useFormField';
import { evmAddressUtils } from '@/shared/utils/evmAddressUtils';
import { AddressInput, type IAddressInputResolvedValue } from '@aragon/gov-ui-kit';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { IHarmonyVotingSetupMembershipForm, IHarmonyVotingSetupMembershipProps } from './harmonyVotingSetupMembership.api';

const isEnsLike = (value: string): boolean => /^(?:[a-z0-9-]+\.)*[a-z0-9-]+\.eth$/i.test(value.trim());

export const HarmonyDelegationVotingSetupMembership = (props: IHarmonyVotingSetupMembershipProps) => {
    const { formPrefix } = props;
    const { t } = useTranslations();

    const [ensResolutionError, setEnsResolutionError] = useState<string | undefined>(undefined);

    const {
        onChange: onValidatorChange,
        value: validatorAddress,
        ...validatorField
    } = useFormField<IHarmonyVotingSetupMembershipForm, 'validatorAddress'>('validatorAddress', {
        label: t('app.plugins.harmonyDelegationVoting.setupMembership.validatorAddress.label'),
        rules: {
            required: {
                value: true,
                message: 'app.plugins.harmonyDelegationVoting.setupMembership.validatorAddress.error.required',
            },
            validate: (value?: string) => {
                if (value == null || value.length === 0) return true;
                if (isEnsLike(value)) return true;
                const res = evmAddressUtils.validate(value);
                if (res.ok) return true;
                return `app.plugins.harmonyDelegationVoting.setupMembership.validatorAddress.error.${res.error}`;
            },
        },
        fieldPrefix: formPrefix,
        sanitizeOnBlur: false,
    });

    const [addressInput, setAddressInput] = useState<string | undefined>(validatorAddress ?? '');

    useEffect(() => {
        setAddressInput(validatorAddress ?? '');
    }, [validatorAddress]);

    const handleAddressChange = useCallback((value?: string) => {
        // Keep a best-effort copy of what the user typed.
        setAddressInput(value ?? '');
        setEnsResolutionError(undefined);
    }, []);

    const handleAddressAccept = useCallback(
        (value?: IAddressInputResolvedValue) => {
            const resolvedAddress = value?.address;
            const resolvedName = value?.name;
            const currentInput = (addressInput ?? '').trim();

            // If the component already resolved to a 0x address, accept it.
            if (resolvedAddress) {
                const res = evmAddressUtils.validate(resolvedAddress);
                if (res.ok) {
                    onValidatorChange(res.address);
                    setAddressInput(resolvedName ?? res.address);
                    setEnsResolutionError(undefined);
                    return;
                }
            }

            // ENS-like input that could not be resolved by the component.
            if (currentInput.length > 0 && isEnsLike(currentInput)) {
                setEnsResolutionError(
                    t('app.plugins.harmonyDelegationVoting.setupMembership.validatorAddress.error.ensNotResolved'),
                );
                return;
            }

            // Fallback: validate as a raw 0x address.
            const res = evmAddressUtils.validate(currentInput);
            if (res.ok) {
                onValidatorChange(res.address);
                setAddressInput(res.address);
                setEnsResolutionError(undefined);
            }
        },
        [addressInput, onValidatorChange, t],
    );

    // Force mainnet for the input so ENS (*.eth) is supported even when installing on Harmony.
    const validatorInputChainId = networkDefinitions[Network.ETHEREUM_MAINNET].id;

    const { alert, variant, ...validatorFieldRest } = validatorField;
    const effectiveVariant = ensResolutionError ? 'critical' : variant;
    const effectiveAlert = ensResolutionError ? { message: ensResolutionError, variant: 'critical' as const } : alert;

    return (
        <div className="flex w-full flex-col gap-3">
            <AddressInput
                {...validatorFieldRest}
                placeholder={t('app.plugins.harmonyDelegationVoting.setupMembership.validatorAddress.placeholder')}
                helpText={t('app.plugins.harmonyDelegationVoting.setupMembership.validatorAddress.helpText')}
                value={addressInput}
                onChange={handleAddressChange}
                onAccept={handleAddressAccept}
                chainId={validatorInputChainId}
                variant={effectiveVariant}
                alert={effectiveAlert}
            />
        </div>
    );
};
