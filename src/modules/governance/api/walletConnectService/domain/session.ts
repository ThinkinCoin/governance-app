import type { WalletKit } from '@reown/walletkit';

// Object containing information on connection sessions.
export type ISession = Awaited<ReturnType<InstanceType<typeof WalletKit>['approveSession']>>;
