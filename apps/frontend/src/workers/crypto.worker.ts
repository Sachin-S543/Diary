import { argon2id } from 'hash-wasm';

// Types
type WorkerMessage =
    | { type: 'DERIVE_KEY'; payload: { password: string; salt: Uint8Array } }
    | { type: 'ENCRYPT'; payload: { data: string; key: CryptoKey; aad?: Uint8Array } }
    | { type: 'DECRYPT'; payload: { iv: Uint8Array; data: Uint8Array; key: CryptoKey; aad?: Uint8Array } }
    | { type: 'GENERATE_VMK'; payload: { extractable?: boolean } }
    | { type: 'WRAP_VMK'; payload: { vmkBytes: Uint8Array; wrappingKey: CryptoKey; aad?: Uint8Array } }
    | { type: 'UNWRAP_VMK'; payload: { vmkIv: Uint8Array; encryptedVmk: Uint8Array; wrappingKey: CryptoKey; aad?: Uint8Array } }
    | { type: 'PURGE_MEMORY' };

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const { type } = e.data;

    try {
        switch (type) {
            case 'DERIVE_KEY': {
                const { password, salt } = e.data.payload;
                const derivedHex = await argon2id({
                    password,
                    salt,
                    parallelism: 1,
                    iterations: 256,
                    memorySize: 512,
                    hashLength: 32,
                    outputType: 'hex'
                });

                const keyBytes = new Uint8Array(derivedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
                const key = await self.crypto.subtle.importKey(
                    'raw',
                    keyBytes,
                    { name: 'AES-GCM' },
                    false, // Extractable false by default unless explicitly needed
                    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
                );

                // Zero intermediate hex key byte buffer
                keyBytes.fill(0);

                self.postMessage({ type: 'KEY_DERIVED', payload: key });
                break;
            }
            case 'GENERATE_VMK': {
                const extractable = e.data.payload?.extractable ?? true;
                const vmkKey = await self.crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    extractable,
                    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
                );
                const rawVmkBuffer = await self.crypto.subtle.exportKey('raw', vmkKey);
                const rawVmkBytes = new Uint8Array(rawVmkBuffer);

                self.postMessage({
                    type: 'VMK_GENERATED',
                    payload: { vmkKey, rawVmkBytes }
                });
                break;
            }
            case 'WRAP_VMK': {
                const { vmkBytes, wrappingKey, aad } = e.data.payload;
                const iv = self.crypto.getRandomValues(new Uint8Array(12));
                const algorithm: AesGcmParams = { name: 'AES-GCM', iv };
                if (aad && aad.byteLength > 0) algorithm.additionalData = aad;

                const encrypted = await self.crypto.subtle.encrypt(
                    algorithm,
                    wrappingKey,
                    vmkBytes
                );

                self.postMessage({
                    type: 'VMK_WRAPPED',
                    payload: { encryptedVmk: new Uint8Array(encrypted), iv }
                });
                break;
            }
            case 'UNWRAP_VMK': {
                const { vmkIv, encryptedVmk, wrappingKey, aad } = e.data.payload;
                const algorithm: AesGcmParams = { name: 'AES-GCM', iv: vmkIv };
                if (aad && aad.byteLength > 0) algorithm.additionalData = aad;

                const decryptedBuffer = await self.crypto.subtle.decrypt(
                    algorithm,
                    wrappingKey,
                    encryptedVmk
                );
                const decryptedBytes = new Uint8Array(decryptedBuffer);

                const vmkKey = await self.crypto.subtle.importKey(
                    'raw',
                    decryptedBytes,
                    { name: 'AES-GCM' },
                    false, // Non-extractable in RAM once unwrapped
                    ['encrypt', 'decrypt']
                );

                // Zero decrypted raw bytes
                decryptedBytes.fill(0);

                self.postMessage({ type: 'VMK_UNWRAPPED', payload: vmkKey });
                break;
            }
            case 'ENCRYPT': {
                const { data, key, aad } = e.data.payload;
                const iv = self.crypto.getRandomValues(new Uint8Array(12));
                const encodedData = new TextEncoder().encode(data);

                const algorithm: AesGcmParams = { name: 'AES-GCM', iv };
                if (aad && aad.byteLength > 0) algorithm.additionalData = aad;

                const ciphertext = await self.crypto.subtle.encrypt(
                    algorithm,
                    key,
                    encodedData
                );

                self.postMessage({
                    type: 'ENCRYPTED',
                    payload: {
                        ciphertext: new Uint8Array(ciphertext),
                        iv
                    }
                });
                break;
            }
            case 'DECRYPT': {
                const { iv, data, key, aad } = e.data.payload;
                const algorithm: AesGcmParams = { name: 'AES-GCM', iv };
                if (aad && aad.byteLength > 0) algorithm.additionalData = aad;

                const decrypted = await self.crypto.subtle.decrypt(
                    algorithm,
                    key,
                    data
                );

                const decoded = new TextDecoder().decode(decrypted);
                self.postMessage({ type: 'DECRYPTED', payload: decoded });
                break;
            }
            case 'PURGE_MEMORY': {
                self.postMessage({ type: 'MEMORY_PURGED' });
                break;
            }
        }
    } catch (error) {
        self.postMessage({ type: 'ERROR', payload: String(error) });
    }
};
