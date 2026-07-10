import { useMember, type IMember } from '@/modules/governance/api/governanceService';
import type { IUsePluginMemberStatsParams } from '@/modules/governance/types';
import { type IPageHeaderStat } from '@/shared/components/page/pageHeader/pageHeaderStat';

const formatOneAmount = (amount?: string | null) => {
    try {
        const raw = BigInt(amount ?? '0');
        const base = BigInt('1000000000000000000');
        const whole = raw / base;
        const frac = raw % base;

        const fracTrimmed = frac
            .toString()
            .padStart(18, '0')
            .slice(0, 4)
            .replace(/0+$/, '');

        return fracTrimmed.length ? `${whole.toString()}.${fracTrimmed}` : whole.toString();
    } catch {
        return '0';
    }
};

type HarmonyDelegationMember = IMember & {
    votingPower?: string | null;
    tokenBalance?: string | null;
};

const isHarmonyDelegationMember = (member?: IMember): member is HarmonyDelegationMember =>
    member != null && ('votingPower' in member || 'tokenBalance' in member);

export const useHarmonyDelegationMemberStats = (params: IUsePluginMemberStatsParams): IPageHeaderStat[] => {
    const { address, daoId, plugin } = params;

    const memberUrlParams = { address };
    const memberQueryParams = { daoId, pluginAddress: plugin.address };
    const { data: member } = useMember({ urlParams: memberUrlParams, queryParams: memberQueryParams });

    if (!isHarmonyDelegationMember(member)) {
        return [];
    }

    const formattedVotingPower = formatOneAmount(member.votingPower);

    return [
        {
            label: 'Voting power',
            value: formattedVotingPower,
            suffix: 'ONE',
        },
    ];
};
