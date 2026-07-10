import type { IProposal } from '@/modules/governance/api/governanceService';
import type { IPluginSettings } from '@/shared/api/daoService';

export interface IHarmonyVotingMetrics {
    /**
     * Number of "Yes" votes (weighted by voting power).
     */
    yes: string;
    /**
     * Number of "No" votes (weighted by voting power).
     */
    no: string;
    /**
     * Number of "Abstain" votes (weighted by voting power).
     */
    abstain: string;
    /**
     * Total eligible voting power for the proposal.
     */
    totalEligiblePower: string;
}

export interface IHarmonyProposal extends IProposal<IPluginSettings> {
    /**
     * Whether the proposal has been closed (finalized on-chain).
     */
    closed: boolean;
    /**
     * Whether the proposal passed (quorum + approval thresholds met).
     * Only meaningful when `closed` is true.
     */
    passed: boolean;
    /**
     * Plugin-specific voting metrics.
     */
    metrics: IHarmonyVotingMetrics;
}
