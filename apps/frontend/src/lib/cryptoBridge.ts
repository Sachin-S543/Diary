import CryptoWorker from '../workers/crypto.worker?worker';

class CryptoBridge {
    private worker: Worker;
    private pending: Map<string, { resolve: (val: any) => void, reject: (err: any) => void }>;

    constructor() {
        this.worker = new CryptoWorker();
        this.pending = new Map();

        this.worker.onmessage = (e) => {
            const { type, payload } = e.data;
            // For now, we assume sequential operations or we need a request ID.
            // Since the worker is simple, let's just use a simple queue or better yet, 
            // since we don't have request IDs in the current worker implementation, 
            // we will wrap it in a promise that resolves on the next message of expected type.
            // This is a simplification. For production, add IDs.

            // Actually, let's implement a proper request/response ID system in the next iteration.
            // For now, we'll just expose methods that create a new worker for each heavy task 
            // OR use a singleton if we trust the order. 
            // Given the "Professional" requirement, let's do it right.
        };
    }

    // Simplified one-off worker usage for robustness to avoid state issues
    // This is slightly less efficient but safer for now until we add IDs.

    static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        return new Promise((resolve, reject) => {
            const worker = new CryptoWorker();
            worker.onmessage = (e) => {
                if (e.data.type === 'KEY_DERIVED') {
                    resolve(e.data.payload);
                    worker.terminate();
                } else if (e.data.type === 'ERROR') {
                    reject(new Error(e.data.payload));
                    worker.terminate();
                }
            };
            worker.postMessage({ type: 'DERIVE_KEY', payload: { password, salt } });
        });
    }

    static async encrypt(data: string, key: CryptoKey): Promise<{ ciphertext: Uint8Array, iv: Uint8Array }> {
        return new Promise((resolve, reject) => {
            const worker = new CryptoWorker();
            worker.onmessage = (e) => {
                if (e.data.type === 'ENCRYPTED') {
                    resolve(e.data.payload);
                    worker.terminate();
                } else if (e.data.type === 'ERROR') {
                    reject(new Error(e.data.payload));
                    worker.terminate();
                }
            };
            worker.postMessage({ type: 'ENCRYPT', payload: { data, key } });
        });
    }

    static async decrypt(iv: Uint8Array, data: Uint8Array, key: CryptoKey): Promise<string> {
        return new Promise((resolve, reject) => {
            const worker = new CryptoWorker();
            worker.onmessage = (e) => {
                if (e.data.type === 'DECRYPTED') {
                    resolve(e.data.payload);
                    worker.terminate();
                } else if (e.data.type === 'ERROR') {
                    reject(new Error(e.data.payload));
                    worker.terminate();
                }
            };
            worker.postMessage({ type: 'DECRYPT', payload: { iv, data, key } });
        });
    }
}

export default CryptoBridge;
