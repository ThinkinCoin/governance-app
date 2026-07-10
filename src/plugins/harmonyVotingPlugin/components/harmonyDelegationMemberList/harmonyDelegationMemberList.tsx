'use client';

import { Fragment } from 'react';

import type { IDaoMemberListDefaultProps } from '@/modules/governance/components/daoMemberList';
import { useMemberListData } from '@/modules/governance/hooks/useMemberListData';
import * as GovUiKit from '@aragon/gov-ui-kit';
import type { IHarmonyDelegationMember } from './components/harmonyDelegationMemberListItem';
import { HarmonyDelegationMemberListItem } from './components/harmonyDelegationMemberListItem';

const DataListRoot = (GovUiKit as any).DataListRoot as any;
const DataListContainer = (GovUiKit as any).DataListContainer as any;
const DataListPagination = (GovUiKit as any).DataListPagination as any;
const MemberDataListItem = (GovUiKit as any).MemberDataListItem as any;

export interface IHarmonyDelegationMemberListProps extends IDaoMemberListDefaultProps {}

export const HarmonyDelegationMemberList = (props: IHarmonyDelegationMemberListProps) => {
    const { initialParams, hidePagination, plugin, children, onMemberClick, layoutClassNames } = props;

    const { onLoadMore, state, pageSize, itemsCount, errorState, emptyState, memberList } =
        useMemberListData<IHarmonyDelegationMember>(initialParams);

    const { daoId } = initialParams.queryParams;

    const processedLayoutClassNames = layoutClassNames ?? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

    return (
        <DataListRoot
            entityLabel="Delegators"
            onLoadMore={onLoadMore}
            state={state}
            pageSize={pageSize}
            itemsCount={itemsCount}
        >
            <DataListContainer
                SkeletonElement={MemberDataListItem.Skeleton}
                layoutClassName={processedLayoutClassNames}
                errorState={errorState}
                emptyState={emptyState}
            >
                {memberList?.map((member: IHarmonyDelegationMember) => (
                    <Fragment key={member.address}>
                        <HarmonyDelegationMemberListItem
                            member={member}
                            daoId={daoId}
                            plugin={plugin}
                            onMemberClick={onMemberClick}
                        />
                    </Fragment>
                ))}
            </DataListContainer>
            {!hidePagination && <DataListPagination />}
            {children}
        </DataListRoot>
    );
};
