import type { IMember } from '@/modules/governance/api/governanceService';
import { useDao, type IDaoPlugin } from '@/shared/api/daoService';
import { daoUtils } from '@/shared/utils/daoUtils';
import * as GovUiKit from '@aragon/gov-ui-kit';

const MemberDataListItem = (GovUiKit as any).MemberDataListItem as any;

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

export interface IHarmonyDelegationMember extends IMember {
    votingPower?: string | null;
    tokenBalance?: string | null;
}

export interface IHarmonyDelegationMemberListItemProps {
    /**
     * Member to display the information for.
     */
    member: IHarmonyDelegationMember;
    /**
     * ID of the DAO the user is member of.
     */
    daoId: string;
    /**
     * Plugin to display the member for.
     */
    plugin: IDaoPlugin;
    /**
     * Callback called on member click. Replaces the default link to the member page when set.
     */
    onMemberClick?: (member: IMember) => void;
}

export const HarmonyDelegationMemberListItem = (props: IHarmonyDelegationMemberListItemProps) => {
    const { member, daoId, onMemberClick } = props;

    const { data: dao } = useDao({ urlParams: { id: daoId } });

    const parsedVotingPower = formatOneAmount(member.votingPower);

    const getMemberLink = () =>
        onMemberClick != null ? undefined : daoUtils.getDaoUrl(dao, `members/${member.address}`);

    return (
        <MemberDataListItem.Structure
            key={member.address}
            address={member.address}
            tokenAmount={parsedVotingPower}
            ensName={member.ens ?? undefined}
            className="min-w-0"
            href={getMemberLink()}
            onClick={() => onMemberClick?.(member)}
        />
    );
};
