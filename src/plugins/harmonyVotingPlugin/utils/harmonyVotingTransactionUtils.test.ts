import { buildDelegationInstallData, buildPrepareHarmonyVotingInstallData } from '@/plugins/harmonyVotingPlugin/utils/harmonyVotingTransactionUtils';
import { PluginInterfaceType } from '@/shared/api/daoService';
import { pluginTransactionUtils } from '@/shared/utils/pluginTransactionUtils';

jest.mock('@/shared/utils/pluginTransactionUtils', () => ({
  pluginTransactionUtils: {
    buildPrepareInstallationData: jest.fn(() => '0xdeadbeef'),
  },
}));

describe('harmonyVotingTransactionUtils', () => {
  test('buildDelegationInstallData: validates and normalizes address', () => {
    // missing address -> throw
    expect(() => buildDelegationInstallData(undefined as any)).toThrow('Validator address is required');

    // mixed-case address should be accepted and produce a hex string
    const nonChecksummed = '0xab5801a7d398351b8be11c439e05c5b3259aec9b';
    const hex = buildDelegationInstallData(nonChecksummed);
    expect(typeof hex).toBe('string');
    expect(hex.startsWith('0x')).toBe(true);
    expect(hex.length).toBeGreaterThan(2);

    // address + bytes32 processKey = 64 bytes ABI encoded
    expect(hex.length).toBe(2 + 64 * 2);
  });

  test('buildDelegationInstallData: encodes custom processKey when provided', () => {
    const addr = '0xab5801a7d398351b8be11c439e05c5b3259aec9b';
    const customProcessKey =
      '0x1111111111111111111111111111111111111111111111111111111111111111';

    const encoded = buildDelegationInstallData(addr, customProcessKey as any);

    // Last 32 bytes should equal the processKey
    expect(encoded.endsWith(customProcessKey.slice(2))).toBe(true);
  });

  test('buildDelegationInstallData: uses DELEGATION when processKey is missing/empty', () => {
    const addr = '0xab5801a7d398351b8be11c439e05c5b3259aec9b';

    const encodedMissing = buildDelegationInstallData(addr, undefined);
    const encodedEmpty = buildDelegationInstallData(addr, '   ');

    // 'DELEGATION' = 10 bytes (0x44454c45474154494f4e), padded to 32 bytes.
    const expectedTail = '44454c45474154494f4e' + '00'.repeat(22);
    expect(encodedMissing.endsWith(expectedTail)).toBe(true);
    expect(encodedEmpty.endsWith(expectedTail)).toBe(true);
  });

  test('buildDelegationInstallData: encodes string processKey as bytes32', () => {
    const addr = '0xab5801a7d398351b8be11c439e05c5b3259aec9b';
    const encoded = buildDelegationInstallData(addr, 'kEy');

    // ABI: last 32 bytes should start with ASCII for 'KEY' (0x4b4559) and be right-padded.
    expect(encoded.endsWith('4b4559' + '00'.repeat(29))).toBe(true);
  });

  test('buildPrepareHarmonyVotingInstallData: encodes validator address for delegation installs', () => {
    const plugin: any = {
      id: PluginInterfaceType.HARMONY_DELEGATION_VOTING,
      repositoryAddresses: { '1': '0xfeedfeed00000000000000000000000000000000' },
      installVersion: 5,
    };

    const params: any = {
      dao: { network: '1', address: '0xda0da0da0da0da0da0da0da0da0da0da0da0da0' },
      body: { membership: { validatorAddress: '0xab5801a7d398351b8be11c439e05c5b3259aec9b', processKey: 'KEY' } },
      metadata: '0xabc123',
      stageVotingPeriod: null, // processor install
    };

    const expectedInstallData = buildDelegationInstallData(
      params.body.membership.validatorAddress,
      params.body.membership.processKey,
    );

    // Call the function; the mocked pluginTransactionUtils should be used
    const result = buildPrepareHarmonyVotingInstallData(plugin, params);

    // Ensure the mocked buildPrepareInstallationData was called with validator address data
    expect(pluginTransactionUtils.buildPrepareInstallationData).toHaveBeenCalledWith(
      '0xfeedfeed00000000000000000000000000000000',
      5,
      expectedInstallData,
      '0xda0da0da0da0da0da0da0da0da0da0da0da0da0',
    );

    expect(result).toBe('0xdeadbeef');
  });

  test('buildPrepareHarmonyVotingInstallData: uses empty install params for HIP voting (even with metadata)', () => {
    const plugin: any = {
      id: PluginInterfaceType.HARMONY_HIP_VOTING,
      repositoryAddresses: { '1': '0xfeedfeed00000000000000000000000000000000' },
      installVersion: 5,
    };

    const params: any = {
      dao: { network: '1', address: '0xda0da0da0da0da0da0da0da0da0da0da0da0da0' },
      body: { membership: {} },
      metadata: '0xabc123',
      stageVotingPeriod: null,
    };

    const result = buildPrepareHarmonyVotingInstallData(plugin, params);

    expect(pluginTransactionUtils.buildPrepareInstallationData).toHaveBeenCalledWith(
      '0xfeedfeed00000000000000000000000000000000',
      5,
      '0x',
      '0xda0da0da0da0da0da0da0da0da0da0da0da0da0',
    );

    expect(result).toBe('0xdeadbeef');
  });
});
