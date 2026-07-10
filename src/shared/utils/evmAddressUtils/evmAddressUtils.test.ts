import { evmAddressUtils } from '@/shared/utils/evmAddressUtils';

describe('evmAddressUtils', () => {
    test('returns required for empty values', () => {
        expect(evmAddressUtils.validate(undefined)).toEqual({ ok: false, error: 'required' });
        expect(evmAddressUtils.validate('   ')).toEqual({ ok: false, error: 'required' });
    });

    test('returns prefix when missing 0x', () => {
        expect(evmAddressUtils.validate('1234567890123456789012345678901234567890')).toEqual({
            ok: false,
            error: 'prefix',
        });
    });

    test('returns length when address length is incorrect', () => {
        expect(evmAddressUtils.validate('0x123')).toEqual({ ok: false, error: 'length' });
    });

    test('returns format when address is not hex', () => {
        expect(evmAddressUtils.validate('0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz')).toEqual({
            ok: false,
            error: 'format',
        });
    });

    test('normalizes to checksummed address on success', () => {
        const res = evmAddressUtils.validate('0xb794f5ea0ba39494ce839613fffba74279579268');
        expect(res.ok).toBe(true);
        if (res.ok) {
            expect(res.address).toBe('0xb794F5eA0ba39494cE839613fffBA74279579268');
        }
    });

    test('returns checksum for mixed-case invalid checksum address', () => {
        // Same address as above, but with wrong casing (not a valid checksum address)
        const invalidChecksum = '0xb794F5eA0bA39494cE839613fffBA74279579268';
        expect(evmAddressUtils.validate(invalidChecksum)).toEqual({ ok: false, error: 'checksum' });
    });
});
