import { Network, type IDao, PluginInterfaceType } from '@/shared/api/daoService';
import * as DaoService from '@/shared/api/daoService';
import * as IpfsMutations from '@/shared/api/ipfsService/mutations';
import * as DialogProvider from '@/shared/components/dialogProvider';
import * as DaoChainHook from '@/shared/hooks/useDaoChain';
import * as DaoPluginsHook from '@/shared/hooks/useDaoPlugins';
import { networkDefinitions } from '@/shared/constants/networkDefinitions';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Wagmi from 'wagmi';
import { PrepareProcessDialog } from './prepareProcessDialog';
import { prepareProcessDialogUtils } from './prepareProcessDialogUtils';

type TransactionDialogProps = {
    transactionInfo?: { details?: string };
    customSteps?: Array<{ meta?: { action?: (params: { onError: (error: unknown) => void }) => unknown } }>;
    prepareTransaction: () => Promise<unknown>;
};

let lastTransactionDialogProps: TransactionDialogProps | undefined;

jest.mock('@/shared/components/transactionDialog', () => {
    // Use runtime require to avoid hoisting issues with React hooks.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react') as typeof import('react');

    return {
        __esModule: true,
        TransactionDialog: (props: TransactionDialogProps) => {
            lastTransactionDialogProps = props;
            const [prepareError, setPrepareError] = React.useState<string>('');

            const handlePin = async () => {
                await props.customSteps?.[0]?.meta?.action?.({ onError: () => undefined });
            };

            const handlePrepare = async () => {
                try {
                    await props.prepareTransaction();
                    setPrepareError('');
                } catch (error) {
                    setPrepareError(error instanceof Error ? error.message : String(error));
                }
            };

            return (
                <div>
                    <div data-testid="tx-details">{props.transactionInfo?.details ?? ''}</div>
                    <button type="button" onClick={handlePin}>
                        pin
                    </button>
                    <button type="button" onClick={handlePrepare}>
                        prepare
                    </button>
                    <div data-testid="prepare-error">{prepareError}</div>
                </div>
            );
        },
    };
});

describe('<PrepareProcessDialog />', () => {
    const useAccountSpy = jest.spyOn(Wagmi, 'useAccount');
    const usePublicClientSpy = jest.spyOn(Wagmi, 'usePublicClient');
    const useDaoSpy = jest.spyOn(DaoService, 'useDao');
    const usePinJsonSpy = jest.spyOn(IpfsMutations, 'usePinJson');
    const useDialogContextSpy = jest.spyOn(DialogProvider, 'useDialogContext');
    const useDaoChainSpy = jest.spyOn(DaoChainHook, 'useDaoChain');
    const useDaoPluginsSpy = jest.spyOn(DaoPluginsHook, 'useDaoPlugins');

    const buildPrepareProcessTransactionSpy = jest.spyOn(prepareProcessDialogUtils, 'buildPrepareProcessTransaction');
    const preparePluginsMetadataSpy = jest.spyOn(prepareProcessDialogUtils, 'preparePluginsMetadata');

    const createTestComponent = (params?: Partial<Parameters<typeof PrepareProcessDialog>[0]['location']['params']>) => {
        return (
            <PrepareProcessDialog
                location={{
                    id: 'test',
                    params: {
                        daoId: 'dao-id',
                        pluginAddress: '0x0000000000000000000000000000000000000002',
                        values: {
                            // shape isn't relevant for this suite; utils are mocked.
                        } as any,
                        ...params,
                    },
                }}
            />
        );
    };

    const setNavigatorOnline = (isOnline: boolean) => {
        Object.defineProperty(window.navigator, 'onLine', {
            configurable: true,
            value: isOnline,
        });
    };

    beforeEach(() => {
        setNavigatorOnline(true);

        useDialogContextSpy.mockReturnValue({ open: jest.fn() } as unknown as ReturnType<typeof DialogProvider.useDialogContext>);

        usePinJsonSpy.mockReturnValue({
            status: 'idle',
            mutateAsync: jest
                .fn()
                .mockResolvedValueOnce({ IpfsHash: 'QmPluginMeta' })
                .mockResolvedValueOnce({ IpfsHash: 'QmProcessorMeta' }),
        } as any);

        const dao: Partial<IDao> = { network: Network.ETHEREUM_SEPOLIA };
        useDaoSpy.mockReturnValue({ data: dao as IDao } as any);

        useDaoPluginsSpy.mockReturnValue([
            {
                meta: {
                    interfaceType: PluginInterfaceType.ADMIN,
                },
            },
        ] as any);

        useDaoChainSpy.mockReturnValue({ chainId: 11155111 } as any);

        useAccountSpy.mockReturnValue({
            address: '0x0000000000000000000000000000000000000001',
            chainId: 11155111,
        } as any);

        usePublicClientSpy.mockReturnValue({
            estimateGas: jest.fn().mockResolvedValue(BigInt(123)),
        } as any);

        preparePluginsMetadataSpy.mockReturnValue({
            pluginsMetadata: [{ name: 'meta' }],
            processorMetadata: { name: 'processor' },
        } as any);

        buildPrepareProcessTransactionSpy.mockResolvedValue({
            to: '0x0000000000000000000000000000000000000003',
            data: '0x',
            value: BigInt(0),
        } as any);
    });

    afterEach(() => {
        lastTransactionDialogProps = undefined;
        jest.clearAllMocks();
        setNavigatorOnline(true);
    });

    it('shows an offline error when the user is offline', async () => {
        setNavigatorOnline(false);
        render(createTestComponent());

        await userEvent.click(screen.getByRole('button', { name: 'pin' }));
        await userEvent.click(screen.getByRole('button', { name: 'prepare' }));

        expect(screen.getByTestId('prepare-error')).toHaveTextContent(
            'You appear to be offline. Please reconnect and try again.',
        );
    });

    it('shows a chain mismatch error when wallet chainId differs from requiredChainId', async () => {
        useAccountSpy.mockReturnValue({
            address: '0x0000000000000000000000000000000000000001',
            chainId: 1,
        } as any);

        render(createTestComponent());

        await userEvent.click(screen.getByRole('button', { name: 'pin' }));
        await userEvent.click(screen.getByRole('button', { name: 'prepare' }));

        const requiredNetworkName = networkDefinitions[Network.ETHEREUM_SEPOLIA]?.name ?? 'the correct network';
        expect(screen.getByTestId('prepare-error')).toHaveTextContent(requiredNetworkName);
        expect(screen.getByTestId('prepare-error')).toHaveTextContent('Please switch your wallet');
    });

    it('sets and clears the gas estimate details based on estimateGas success/failure', async () => {
        const estimateGas = jest
            .fn()
            .mockResolvedValueOnce(BigInt(123))
            .mockRejectedValueOnce(new Error('boom'));
        usePublicClientSpy.mockReturnValue({ estimateGas } as any);

        render(createTestComponent());

        await userEvent.click(screen.getByRole('button', { name: 'pin' }));

        await userEvent.click(screen.getByRole('button', { name: 'prepare' }));
        await waitFor(() => expect(screen.getByTestId('tx-details')).toHaveTextContent('Estimated gas: 123'));

        await userEvent.click(screen.getByRole('button', { name: 'prepare' }));
        await waitFor(() => expect(screen.getByTestId('tx-details')).toHaveTextContent(''));
    });

    it('exposes TransactionDialog props for debugging (sanity check)', async () => {
        render(createTestComponent());

        await act(async () => {
            // Ensure the mocked TransactionDialog rendered and captured props.
            expect(lastTransactionDialogProps).toBeDefined();
        });
    });
});
