import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import crypto from 'crypto';

Object.assign(global, { TextDecoder, TextEncoder });

Object.defineProperty(global, 'crypto', {
    value: {
        getRandomValues: (arr: Uint8Array) => crypto.randomBytes(arr.length),
        subtle: crypto.webcrypto.subtle,
    },
});

if (typeof globalThis.indexedDB === 'undefined') {
    const dummyIndexedDB = {
        open: () => ({
            onupgradeneeded: null,
            onsuccess: null,
            onerror: null,
            result: {
                objectStoreNames: { contains: () => false },
                createObjectStore: () => ({ createIndex: () => {} }),
                transaction: () => ({ store: { put: () => {} }, done: Promise.resolve() }),
            },
        }),
    };
    Object.defineProperty(globalThis, 'indexedDB', { value: dummyIndexedDB, writable: true });
}
