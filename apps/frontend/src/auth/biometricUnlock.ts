/*
 * Secret Capsule (Diary)
 * Copyright (C) 2025 Sachin-S543
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public 
 * License along with this program. 
 * If not, see <https://www.gnu.org/licenses/>.
 */

export const BIOMETRIC_CREDENTIAL_ID_KEY = 'biometric_credential_id';

// Fixed salt for PRF extension (must be exactly 32 bytes)
const PRF_SALT = new Uint8Array([
    102, 111, 111, 98, 97, 114, 113, 117,
    120, 121, 122, 112, 108, 111, 112, 113,
    114, 115, 116, 117, 118, 119, 120, 121,
    122, 97, 98, 99, 100, 101, 102, 103
]);

function bufferToBase64url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (let charCode of bytes) {
        str += String.fromCharCode(charCode);
    }
    const base64string = btoa(str);
    return base64string.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64url.length % 4) % 4);
    const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer;
}

export const isBiometricUnlockSupported = async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) return false;
    
    // Check if UVPA (User Verifying Platform Authenticator) is available
    const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!isAvailable) return false;

    return true;
};

export const registerBiometric = async (username: string): Promise<void> => {
    const userId = new Uint8Array(16);
    crypto.getRandomValues(userId);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: {
            name: "Secret Capsule",
            id: window.location.hostname
        },
        user: {
            id: userId,
            name: username,
            displayName: username
        },
        pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" } // RS256
        ],
        authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
        },
        timeout: 60000,
        extensions: {
            prf: {
                eval: {
                    first: PRF_SALT
                }
            }
        }
    };

    const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
    }) as PublicKeyCredential;

    if (!credential) {
        throw new Error("Biometric registration cancelled or failed");
    }

    localStorage.setItem(BIOMETRIC_CREDENTIAL_ID_KEY, bufferToBase64url(credential.rawId));
};

export const unlockBiometric = async (): Promise<Uint8Array> => {
    const credentialIdStr = localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY);
    if (!credentialIdStr) {
        throw new Error("No biometric credential registered");
    }

    const credentialId = base64urlToBuffer(credentialIdStr);

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: window.location.hostname,
        allowCredentials: [{
            id: credentialId,
            type: "public-key",
            transports: ["internal"]
        }],
        userVerification: "required",
        extensions: {
            prf: {
                eval: {
                    first: PRF_SALT
                }
            }
        }
    };

    const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
    }) as PublicKeyCredential;

    if (!assertion) {
        throw new Error("Biometric unlock failed");
    }

    const clientExtensionResults = assertion.getClientExtensionResults();
    const prfResults = clientExtensionResults.prf;

    if (!prfResults || !prfResults.results || !prfResults.results.first) {
        throw new Error("Browser or authenticator does not support WebAuthn PRF extension");
    }

    const prfOutput = prfResults.results.first as ArrayBuffer;
    return new Uint8Array(prfOutput);
};
