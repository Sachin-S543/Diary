import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import crypto from 'crypto';
import 'fake-indexeddb/auto';

Object.assign(global, { TextDecoder, TextEncoder });

Object.defineProperty(global, 'crypto', {
    value: {
        getRandomValues: (arr: Uint8Array) => crypto.randomBytes(arr.length),
        subtle: crypto.webcrypto.subtle,
    },
});

if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'crypto', {
        value: {
            getRandomValues: (arr: Uint8Array) => crypto.randomBytes(arr.length),
            subtle: crypto.webcrypto.subtle,
        },
    });
}
