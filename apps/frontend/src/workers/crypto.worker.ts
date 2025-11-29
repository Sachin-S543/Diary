import { argon2id } from 'hash-wasm';

// Types
type WorkerMessage =
    | { type: 'DERIVE_KEY'; payload: { password: string; salt: Uint8Array } }
    | { type: 'ENCRYPT'; payload: { data: string; key: CryptoKey } }
    | { type: 'DECRYPT'; payload: { iv: Uint8Array; data: Uint8Array; key: CryptoKey } };

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const { type, payload } = e.data;

    try {
        switch (type) {
            case 'DERIVE_KEY': {
                const { password, salt } = payload;
                // Argon2id Parameters
                const derivedHex = await argon2id({
                    password,
                    salt,
                    parallelism: 1,
                    iterations: 256, // Tuned for ~500ms
                    memorySize: 512, // 512KB
                    hashLength: 32,
                    outputType: 'hex'
                });

                // Import into Web Crypto
                const keyBytes = new Uint8Array(derivedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
                const key = await self.crypto.subtle.importKey(
                    'raw',
                    keyBytes,
                    { name: 'AES-GCM' },
                    true, // Extractable for Recovery Key export
                    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
                );

                self.postMessage({ type: 'KEY_DERIVED', payload: key });
                break;
            }
            case 'ENCRYPT': {
                const { data, key } = payload;
                const iv = self.crypto.getRandomValues(new Uint8Array(12));
                const encodedData = new TextEncoder().encode(data);

                const ciphertext = await self.crypto.subtle.encrypt(
                    { name: 'AES-GCM', iv },
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
                const { iv, data, key } = payload;

                const decrypted = await self.crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv },
                    key,
                    data
                );

                const decoded = new TextDecoder().decode(decrypted);
                self.postMessage({ type: 'DECRYPTED', payload: decoded });
                break;
            }
        }
    } catch (error) {
        self.postMessage({ type: 'ERROR', payload: String(error) });
    }
};
