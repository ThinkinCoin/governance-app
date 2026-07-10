import type { Hex } from 'viem';
import { getAddress } from 'viem';

export type EvmAddressValidationError = 'required' | 'prefix' | 'length' | 'format' | 'checksum';

export type ValidateEvmAddressResult =
    | { ok: true; address: Hex }
    | { ok: false; error: EvmAddressValidationError };

const ADDRESS_LENGTH = 42;
const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

class EvmAddressUtils {
    validate = (value?: string): ValidateEvmAddressResult => {
        const trimmed = (value ?? '').trim();

        if (trimmed.length === 0) {
            return { ok: false, error: 'required' };
        }

        if (!trimmed.startsWith('0x')) {
            return { ok: false, error: 'prefix' };
        }

        if (trimmed.length !== ADDRESS_LENGTH) {
            return { ok: false, error: 'length' };
        }

        if (!ADDRESS_REGEX.test(trimmed)) {
            return { ok: false, error: 'format' };
        }

        try {
            const checksummed = getAddress(trimmed);

            // viem's getAddress normalizes to a checksummed address but does not reject invalid
            // mixed-case inputs by itself. We treat mixed-case as an explicit checksum signal:
            // - lower/upper-case only: accept and normalize
            // - mixed-case: accept only if already valid checksum
            const rawHex = trimmed.slice(2);
            const hasLower = /[a-f]/.test(rawHex);
            const hasUpper = /[A-F]/.test(rawHex);
            const isMixedCase = hasLower && hasUpper;

            if (isMixedCase && checksummed !== trimmed) {
                return { ok: false, error: 'checksum' };
            }

            return { ok: true, address: checksummed as Hex };
        } catch {
            return { ok: false, error: 'checksum' };
        }
    };
}

export const evmAddressUtils = new EvmAddressUtils();
