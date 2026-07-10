/* eslint-disable complexity */

'use client';

import type { Network } from '@/shared/api/daoService';
import { type IDaoPlugin, useDao } from '@/shared/api/daoService';
import { useHarmonyDelegationsByValidator, useHarmonyValidatorConfig, useHarmonyValidatorInfo } from '@/shared/api/pluginsService';
import { toHarmonyBech32Address, toHarmonyHexAddress } from '@/shared/utils/harmonyAddressUtils';
import * as GovUiKit from '@aragon/gov-ui-kit';
import { useMemo, useState } from 'react';
import { formatUnits } from 'viem';

const DefinitionList = (GovUiKit as any).DefinitionList as any;
const DataListRoot = (GovUiKit as any).DataListRoot as any;
const DataListContainer = (GovUiKit as any).DataListContainer as any;
const DataList = (GovUiKit as any).DataList as any;
const ToggleGroup = (GovUiKit as any).ToggleGroup as any;
const Toggle = (GovUiKit as any).Toggle as any;
const addressUtils = (GovUiKit as any).addressUtils as any;
const formatterUtils = (GovUiKit as any).formatterUtils as any;
const NumberFormat = (GovUiKit as any).NumberFormat as any;

const getNetworkAndEnabled = (dao: { network?: Network } | null | undefined) => {
    if (dao == null || dao.network == null) {
        return { enabled: false, network: '' as Network };
    }
    return { enabled: true, network: dao.network as Network };
};

const resolveMemberInfo = (cfg: { validatorAddress?: string | null; processKey?: string | null } | null | undefined, plugin: IDaoPlugin) => {
    let validatorAddress: string | null = null;
    if (cfg != null) {
        if (cfg.validatorAddress != null) {
            validatorAddress = cfg.validatorAddress;
        }
    }

    let processKey: string | null = null;
    if (cfg != null) {
        if (cfg.processKey != null) {
            processKey = cfg.processKey;
        }
    }

    if (processKey == null && plugin.processKey != null) {
        processKey = plugin.processKey;
    }

    return { validatorAddress, processKey };
};

const formatValidatorAddress = (validatorAddress: string | null) => {
    if (validatorAddress == null) {
        return { copyValue: undefined, display: '—' };
    }

    const copyValue = validatorAddress;
    let display = validatorAddress;
    if (addressUtils != null && typeof addressUtils.truncateAddress === 'function') {
        display = addressUtils.truncateAddress(validatorAddress);
    }

    return { copyValue, display };
};

const formatProcessKey = (processKey: string | null) => {
    if (processKey == null) {
        return '—';
    }
    return processKey;
};

const formatStakeAmount = (amount?: string | null) => {
    if (amount == null) {
        return '—';
    }

    try {
        const parsed = formatUnits(BigInt(amount), 18);
        if (formatterUtils?.formatNumber && NumberFormat) {
            return formatterUtils.formatNumber(parsed, { format: NumberFormat.TOKEN_AMOUNT_SHORT }) ?? parsed;
        }
        return parsed;
    } catch {
        return '—';
    }
};

const safeBigInt = (value?: string | null) => {
    if (value == null) return null;
    try {
        return BigInt(value);
    } catch {
        return null;
    }
};

const formatPercentOfTotal = (amountRaw?: string | null, totalRaw?: string | null) => {
    const amount = safeBigInt(amountRaw);
    const total = safeBigInt(totalRaw);
    const zero = BigInt(0);
    if (amount == null || total == null || total <= zero || amount < zero) {
        return '—';
    }

    // basis points (2 decimals)
    const bps = (amount * BigInt(10_000)) / total;
    const integer = bps / BigInt(100);
    const fraction = bps % BigInt(100);
    const fractionStr = fraction.toString().padStart(2, '0');
    return `${integer.toString()}.${fractionStr}%`;
};

const formatDelegatorAddress = (addr?: string | null) => {
    if (addr == null || addr.trim().length === 0) {
        return '—';
    }
    if (addressUtils != null && typeof addressUtils.truncateAddress === 'function') {
        return addressUtils.truncateAddress(addr);
    }
    return addr;
};

type AddressFormat = 'ETH' | 'ONE';
type SortBy = 'name' | 'percentStaked';

const safeToHarmonyHexAddress = (value: string) => {
    try {
        return toHarmonyHexAddress(value);
    } catch {
        return null;
    }
};

const safeToHarmonyBech32Address = (value: string) => {
    try {
        return toHarmonyBech32Address(value);
    } catch {
        return null;
    }
};

const getDisplayAddresses = (addr: string, format: AddressFormat) => {
    const hex = safeToHarmonyHexAddress(addr);
    const one = safeToHarmonyBech32Address(addr);

    if (format === 'ONE') {
        return {
            primaryFull: one ?? addr,
            secondaryFull: hex ?? addr,
        };
    }

    return {
        primaryFull: hex ?? addr,
        secondaryFull: one ?? addr,
    };
};

const delegationStakeBps = (amountRaw?: string | null, totalRaw?: string | null) => {
    const amount = safeBigInt(amountRaw);
    const total = safeBigInt(totalRaw);
    const zero = BigInt(0);
    if (amount == null || total == null || total <= zero || amount < zero) {
        return null;
    }

    return (amount * BigInt(10_000)) / total;
};

export interface IHarmonyDelegationMemberInfoProps {
    /**
     * ID of the DAO.
     */
    daoId: string;
    /**
     * DAO plugin to display the members info for.
     */
    plugin: IDaoPlugin;
}

export const HarmonyDelegationMemberInfo = (props: IHarmonyDelegationMemberInfoProps) => {
    const { daoId, plugin } = props;

    const [addressFormat, setAddressFormat] = useState<AddressFormat>('ONE');
    const [sortBy, setSortBy] = useState<SortBy>('percentStaked');

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

    const { validatorAddress, processKey } = resolveMemberInfo(cfg, plugin);
    const { copyValue: validatorCopyValue, display: validatorDisplay } = formatValidatorAddress(validatorAddress);
    const processKeyDisplay = formatProcessKey(processKey);

    const validatorInfoParams = {
        urlParams: {
            network,
            validatorAddress: validatorAddress ?? '',
        },
    };

    const delegationsParams = {
        urlParams: {
            network,
            validatorAddress: validatorAddress ?? '',
        },
    };

    const {
        data: validatorInfo,
        status: validatorInfoStatus,
        fetchStatus: validatorInfoFetchStatus,
    } = useHarmonyValidatorInfo(validatorInfoParams, {
        enabled: enabled && validatorAddress != null,
    });

    const {
        data: delegations,
        status: delegationsStatus,
        fetchStatus: delegationsFetchStatus,
    } = useHarmonyDelegationsByValidator(delegationsParams, {
        enabled: enabled && validatorAddress != null,
    });

    const delegatorsCount = delegations?.length ?? 0;
    const formattedTotalDelegation = formatStakeAmount(validatorInfo?.totalDelegation ?? null);
    const rateNumber = validatorInfo?.rate ? Number(validatorInfo.rate) : NaN;
    const formattedCommissionRate = Number.isFinite(rateNumber) ? `${(rateNumber * 100).toFixed(2)}%` : '—';

    const delegatorsState = (() => {
        const status = delegationsStatus;
        if (status === 'pending') return 'loading';
        if (status === 'error') return 'error';
        if (delegationsFetchStatus === 'fetching') return 'loading';
        return 'idle';
    })();

    const validatorState = (() => {
        const status = validatorInfoStatus;
        if (status === 'pending') return 'loading';
        if (status === 'error') return 'error';
        if (validatorInfoFetchStatus === 'fetching') return 'loading';
        return 'idle';
    })();

    const overallState = delegatorsState === 'error' || validatorState === 'error' ? 'error' : delegatorsState === 'loading' || validatorState === 'loading' ? 'loading' : 'idle';

    const emptyState = {
        heading: 'No delegators',
        description: 'This validator has no delegators yet.',
    };

    const errorState = {
        heading: 'Unable to load delegators',
        description: 'Try again later.',
    };

    const delegationsSorted = useMemo(() => {
        if (delegations == null) {
            return delegations;
        }

        const total = validatorInfo?.totalDelegation ?? null;
        const list = delegations.slice();

        if (sortBy === 'name') {
            list.sort((a, b) => {
                const aPrimary = getDisplayAddresses(a.delegatorAddress ?? '', addressFormat).primaryFull.toLowerCase();
                const bPrimary = getDisplayAddresses(b.delegatorAddress ?? '', addressFormat).primaryFull.toLowerCase();
                return aPrimary.localeCompare(bPrimary);
            });
            return list;
        }

        list.sort((a, b) => {
            const aBps = delegationStakeBps(a.amount, total) ?? BigInt(-1);
            const bBps = delegationStakeBps(b.amount, total) ?? BigInt(-1);
            if (aBps === bBps) {
                const aPrimary = getDisplayAddresses(a.delegatorAddress ?? '', addressFormat).primaryFull.toLowerCase();
                const bPrimary = getDisplayAddresses(b.delegatorAddress ?? '', addressFormat).primaryFull.toLowerCase();
                return aPrimary.localeCompare(bPrimary);
            }
            return aBps > bBps ? -1 : 1;
        });

        return list;
    }, [delegations, validatorInfo?.totalDelegation, sortBy, addressFormat]);

    return (
        <div className="flex flex-col gap-6">
            <DefinitionList.Container>
                <DefinitionList.Item term="Eligible voters" description="Delegators of the configured validator" />

                <DefinitionList.Item term="Delegators">
                    {delegatorsCount > 0 ? `${delegatorsCount}` : '—'}
                </DefinitionList.Item>

                <DefinitionList.Item term="Total staking">{formattedTotalDelegation}</DefinitionList.Item>

                <DefinitionList.Item term="Validator commission rate">{formattedCommissionRate}</DefinitionList.Item>

                <DefinitionList.Item term="Validator address" copyValue={validatorCopyValue}>
                    {validatorDisplay}
                </DefinitionList.Item>

                <DefinitionList.Item term="Process key">{processKeyDisplay}</DefinitionList.Item>
            </DefinitionList.Container>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">Address format</p>
                    <ToggleGroup
                        className="flex w-full items-center gap-x-2"
                        isMultiSelect={false}
                        value={addressFormat}
                        onChange={(value: string | null) => {
                            if (value === 'ETH' || value === 'ONE') {
                                setAddressFormat(value);
                            }
                        }}
                    >
                        <Toggle value="ONE" label="ONE" />
                        <Toggle value="ETH" label="ETH" />
                    </ToggleGroup>
                </div>

                <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">Sort by</p>
                    <ToggleGroup
                        className="flex w-full items-center gap-x-2"
                        isMultiSelect={false}
                        value={sortBy}
                        onChange={(value: string | null) => {
                            if (value === 'name' || value === 'percentStaked') {
                                setSortBy(value);
                            }
                        }}
                    >
                        <Toggle value="name" label="Name" />
                        <Toggle value="percentStaked" label="% staked" />
                    </ToggleGroup>
                </div>
            </div>

            <DataListRoot entityLabel="Delegators" state={overallState} pageSize={delegatorsCount} itemsCount={delegatorsCount}>
                <DataListContainer emptyState={emptyState} errorState={errorState}>
                    {delegationsSorted?.map((delegation) => {
                        const addr = delegation.delegatorAddress;
                        const resolved = addr != null ? getDisplayAddresses(addr, addressFormat) : null;
                        const primaryFull = resolved?.primaryFull ?? addr ?? '';
                        const secondaryFull = resolved?.secondaryFull ?? addr ?? '';

                        const displayAddr = formatDelegatorAddress(primaryFull);
                        const votingPower = formatStakeAmount(delegation.amount);
                        const percentOfTotal = formatPercentOfTotal(delegation.amount, validatorInfo?.totalDelegation ?? null);
                        const pendingReward = formatStakeAmount(delegation.reward);

                        return (
                            <DataList.Item
                                key={`${delegation.validatorAddress}-${addr}`}
                                className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:gap-4 md:px-6"
                            >
                                <div className="flex min-w-0 grow flex-col gap-1 md:basis-0">
                                    <p className="truncate text-base text-neutral-800 md:text-lg">{displayAddr}</p>
                                    <p className="truncate text-sm text-neutral-500">{secondaryFull}</p>
                                </div>

                                <div className="flex items-start justify-between gap-4 md:contents">
                                    <div className="flex flex-col gap-1 md:grow md:basis-0 md:text-right">
                                        <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase md:hidden">
                                            Voting power
                                        </p>
                                        <p className="text-base text-neutral-800 md:text-lg">{votingPower}</p>
                                        <p className="text-sm text-neutral-500">{percentOfTotal} of total</p>
                                    </div>

                                    <div className="flex flex-col gap-1 text-right md:grow md:basis-0">
                                        <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase md:hidden">
                                            Pending reward
                                        </p>
                                        <p className="text-base text-neutral-800 md:text-lg">{pendingReward}</p>
                                    </div>
                                </div>
                            </DataList.Item>
                        );
                    })}
                </DataListContainer>
            </DataListRoot>
        </div>
    );
};
