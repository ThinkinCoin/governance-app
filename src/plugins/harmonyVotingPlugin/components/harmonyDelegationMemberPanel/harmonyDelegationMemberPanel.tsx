'use client';

import type { Network } from '@/shared/api/daoService';
import { useDao, type IDaoPlugin } from '@/shared/api/daoService';
import { useHarmonyValidatorConfig, useHarmonyValidatorInfo } from '@/shared/api/pluginsService';
import { Page } from '@/shared/components/page';
import * as GovUiKit from '@aragon/gov-ui-kit';

const DefinitionList = (GovUiKit as any).DefinitionList as any;
const addressUtils = (GovUiKit as any).addressUtils as any;
const formatterUtils = (GovUiKit as any).formatterUtils as any;
const NumberFormat = (GovUiKit as any).NumberFormat as any;

export interface IHarmonyDelegationMemberPanelProps {
    /**
     * DAO plugin to display validator info for.
     */
    plugin: IDaoPlugin;
    /**
     * ID of the DAO.
     */
    daoId: string;
}

const getNetworkAndEnabled = (dao: { network?: Network } | null | undefined) => {
    if (dao == null || dao.network == null) {
        return { enabled: false, network: '' as Network };
    }
    return { enabled: true, network: dao.network as Network };
};

const formatValidatorAddress = (validatorAddress: string | null | undefined) => {
    if (validatorAddress == null) {
        return { copyValue: undefined as string | undefined, display: '—' };
    }

    const copyValue = validatorAddress;
    const display = addressUtils?.truncateAddress?.(validatorAddress) ?? validatorAddress;

    return { copyValue, display };
};

const formatStakeAmount = (amount?: string | null) => {
    if (amount == null) {
        return '—';
    }

    try {
        const raw = BigInt(amount);
        const base = BigInt('1000000000000000000');
        const whole = raw / base;
        const frac = raw % base;

        const fracTrimmed = frac
            .toString()
            .padStart(18, '0')
            .slice(0, 4)
            .replace(/0+$/, '');

        const parsed = fracTrimmed.length ? `${whole.toString()}.${fracTrimmed}` : whole.toString();
        return formatterUtils?.formatNumber?.(parsed, { format: NumberFormat?.TOKEN_AMOUNT_SHORT }) ?? parsed;
    } catch {
        return '—';
    }
};

export const HarmonyDelegationMemberPanel = (props: IHarmonyDelegationMemberPanelProps) => {
    const { daoId, plugin } = props;

    const { data: dao } = useDao({ urlParams: { id: daoId } });
    const { enabled, network } = getNetworkAndEnabled(dao);

    const { data: cfg } = useHarmonyValidatorConfig(
        {
            urlParams: {
                network,
                pluginAddress: plugin.address,
            },
        },
        { enabled },
    );

    const validatorAddress = cfg?.validatorAddress ?? null;

    const { data: validatorInfo } = useHarmonyValidatorInfo(
        {
            urlParams: {
                network,
                validatorAddress: validatorAddress ?? '',
            },
        },
        { enabled: enabled && validatorAddress != null },
    );

    const { copyValue: validatorCopyValue, display: validatorDisplay } = formatValidatorAddress(validatorAddress);

    const commissionRateNumber = validatorInfo?.rate ? Number(validatorInfo.rate) : NaN;
    const formattedCommissionRate = Number.isFinite(commissionRateNumber)
        ? `${(commissionRateNumber * 100).toFixed(2)}%`
        : '—';

    const formattedTotalDelegation = formatStakeAmount(validatorInfo?.totalDelegation ?? null);

    const activeStatus = validatorInfo?.activeStatus ?? '—';
    const committeeStatus = validatorInfo?.currentlyInCommittee == null ? '—' : validatorInfo.currentlyInCommittee ? 'Yes' : 'No';

    const validatorName = validatorInfo?.name?.trim().length ? validatorInfo.name : 'Validator';

    return (
        <Page.AsideCard title={validatorName}>
            <DefinitionList.Container>
                <DefinitionList.Item term="Status" description={activeStatus} />
                <DefinitionList.Item term="In committee" description={committeeStatus} />
                <DefinitionList.Item term="Commission rate" description={formattedCommissionRate} />
                <DefinitionList.Item term="Total staking" description={formattedTotalDelegation} />
                <DefinitionList.Item term="Validator address" copyValue={validatorCopyValue}>
                    {validatorDisplay}
                </DefinitionList.Item>
            </DefinitionList.Container>
        </Page.AsideCard>
    );
};
