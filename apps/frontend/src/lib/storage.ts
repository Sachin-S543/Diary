import { openDB, DBSchema } from 'idb';
import { Capsule } from '@secret-capsule/types';

interface SecretCapsuleDB extends DBSchema {
    capsules: {
        key: string;
        value: Capsule;
        indexes: { 'by-date': string };
    };
    syncQueue: {
        key: number;
        value: { type: 'create' | 'update' | 'delete'; payload: any };
    };
}

const dbPromise = openDB<SecretCapsuleDB>('secret-capsule', 1, {
    upgrade(db) {
        const store = db.createObjectStore('capsules', { keyPath: 'id' });
        store.createIndex('by-date', 'createdAt');
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
    },
});

export const storage = {
    async saveCapsule(capsule: Capsule) {
        return (await dbPromise).put('capsules', capsule);
    },
    async getCapsules() {
        return (await dbPromise).getAllFromIndex('capsules', 'by-date');
    },
    async deleteCapsule(id: string) {
        return (await dbPromise).delete('capsules', id);
    },
    async addToSyncQueue(item: { type: 'create' | 'update' | 'delete'; payload: any }) {
        return (await dbPromise).add('syncQueue', item);
    },
    async getSyncQueue() {
        return (await dbPromise).getAll('syncQueue');
    },
    async clearSyncQueue() {
        return (await dbPromise).clear('syncQueue');
    }
};
