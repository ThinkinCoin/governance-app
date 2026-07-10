import { getAddress } from 'viem';
import { isBech32Address, isHexAddress, toHarmonyBech32Address, toHarmonyHexAddress } from './harmonyAddressUtils';

describe('harmonyAddressUtils', () => {
    it('converts hex -> bech32 -> hex (round-trip)', () => {
        const hex = '0x1111111111111111111111111111111111111111';

        const bech32 = toHarmonyBech32Address(hex);
        expect(bech32).toMatch(/^one1[0-9a-z]+$/);
        expect(isBech32Address(bech32)).toBe(true);

        const roundTrip = toHarmonyHexAddress(bech32);
        expect(roundTrip).toBe(getAddress(hex));
    });

    it('accepts checksummed/uppercase hex input', () => {
        const checksummed = getAddress('0x2222222222222222222222222222222222222222');
        const bech32 = toHarmonyBech32Address(checksummed.toUpperCase());
        expect(isBech32Address(bech32)).toBe(true);
        expect(toHarmonyHexAddress(bech32)).toBe(checksummed);
    });

    it('detects address formats', () => {
        expect(isHexAddress('0x1111111111111111111111111111111111111111')).toBe(true);
        expect(isHexAddress('one1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqd39ym7')).toBe(false);

        const bech32 = toHarmonyBech32Address('0x1111111111111111111111111111111111111111');
        expect(isBech32Address(bech32)).toBe(true);
        expect(isBech32Address('0x1111111111111111111111111111111111111111')).toBe(false);
    });
});
