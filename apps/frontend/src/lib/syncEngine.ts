/*
 * Inkrypt — Multi-Device Synchronization & Conflict Engine
 * AGPL-3.0-or-later — Copyright (C) 2025 Sachin-S543
 */

import { Capsule } from '@secret-capsule/types';
import { encryptedCache, PendingSyncItem } from './storage';
import api from '../api';

export interface SyncConflict {
    entryId: string;
    localCapsule: Capsule;
    remoteCapsule: Capsule;
}

export interface SyncResult {
    syncedCount: number;
    conflicts: SyncConflict[];
    errors: string[];
}

export class SyncEngine {
    /**
     * Merge remote entry set with local IndexedDB cache
     */
    public static async synchronize(remoteCapsules: Capsule[]): Promise<SyncResult> {
        const conflicts: SyncConflict[] = [];
        const errors: string[] = [];
        let syncedCount = 0;

        const localCapsules = await encryptedCache.getAllEncryptedCapsules();
        const localMap = new Map<string, Capsule>(localCapsules.map(c => [c.id, c]));

        for (const remote of remoteCapsules) {
            const local = localMap.get(remote.id);

            if (!local) {
                // New entry from remote -> save to local cache
                await encryptedCache.putCapsule(remote);
                syncedCount++;
            } else {
                const localRev = local.rev || 1;
                const remoteRev = remote.rev || 1;

                if (remoteRev > localRev) {
                    // Remote is newer -> update local cache
                    await encryptedCache.putCapsule(remote);
                    syncedCount++;
                } else if (remoteRev === localRev && local.updatedAt !== remote.updatedAt) {
                    // Conflict detected: Same revision modified independently on two devices
                    conflicts.push({
                        entryId: remote.id,
                        localCapsule: local,
                        remoteCapsule: remote,
                    });
                }
                // If localRev > remoteRev, local pending queue will upload local version
            }
        }

        return { syncedCount, conflicts, errors };
    }

    /**
     * Flush pending offline sync queue to remote backend API
     */
    public static async flushPendingQueue(): Promise<number> {
        const queue: PendingSyncItem[] = await encryptedCache.getPendingSyncItems();
        let processedCount = 0;

        for (const item of queue) {
            try {
                if (item.action === 'create') {
                    await api.capsules.create(item.capsule);
                } else if (item.action === 'update') {
                    await api.capsules.update(item.capsule.id, item.capsule);
                } else if (item.action === 'delete') {
                    await api.capsules.delete(item.capsule.id);
                }

                if (item.id !== undefined) {
                    await encryptedCache.removePendingSyncItem(item.id);
                }
                processedCount++;
            } catch (err) {
                console.warn(`[SyncEngine] Retry deferred for item ${item.capsule.id}:`, err);
                // Leave item in queue to retry on next sync cycle
            }
        }

        return processedCount;
    }

    /**
     * Resolve synchronization conflict
     */
    public static async resolveConflict(
        conflict: SyncConflict,
        resolution: 'keep_local' | 'keep_remote' | 'keep_both'
    ): Promise<void> {
        const { localCapsule, remoteCapsule } = conflict;

        if (resolution === 'keep_local') {
            const bumped: Capsule = {
                ...localCapsule,
                rev: Math.max(localCapsule.rev || 1, remoteCapsule.rev || 1) + 1,
                updatedAt: new Date().toISOString(),
            };
            await encryptedCache.putCapsule(bumped);
            await encryptedCache.queueOfflineMutation('update', bumped);
            await this.flushPendingQueue();
        } else if (resolution === 'keep_remote') {
            await encryptedCache.putCapsule(remoteCapsule);
        } else if (resolution === 'keep_both') {
            // Keep remote as is
            await encryptedCache.putCapsule(remoteCapsule);

            // Duplicate local entry with a new ID
            const duplicated: Capsule = {
                ...localCapsule,
                id: crypto.randomUUID(),
                rev: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await encryptedCache.putCapsule(duplicated);
            await encryptedCache.queueOfflineMutation('create', duplicated);
            await this.flushPendingQueue();
        }
    }
}
