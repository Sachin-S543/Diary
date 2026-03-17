import { describe, it, expect, vi } from 'vitest';
import { isBiometricUnlockSupported } from '../biometricUnlock';

describe('Biometric Unlock', () => {
    it('checks for biometric support', async () => {
        // Mock PublicKeyCredential
        vi.stubGlobal('PublicKeyCredential', {
            isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true)
        });

        const supported = await isBiometricUnlockSupported();
        expect(supported).toBe(true);
    });

    it('returns false if not supported', async () => {
        vi.stubGlobal('PublicKeyCredential', undefined);
        const supported = await isBiometricUnlockSupported();
        expect(supported).toBe(false);
    });
});
