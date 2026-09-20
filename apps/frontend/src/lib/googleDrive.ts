import { Capsule, GoogleDriveConfig, DriveSyncStatus, V3VaultHeader } from '@secret-capsule/types';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const DRIVE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';

const STORAGE_KEY = 'inkrypt_gdrive_config';
const OAUTH_TX_STORAGE_KEY = 'inkrypt_gdrive_oauth_tx';
const ENCRYPTED_FILE_NAME = 'inkrypt_diary_vault.json';
const ENCRYPTED_V3_FILE_NAME = 'inkrypt_diary_vault_v3.json';

export interface DriveV3VaultFile {
    version: 3;
    updatedAt: string;
    vaultHeader: V3VaultHeader | null;
    capsules: Capsule[];
}

interface OAuthTxState {
    state: string;
    codeVerifier: string;
    redirectUri: string;
    timestamp: number;
}

function toBase64Url(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export function generateRandomString(length: number = 43): string {
    const randomBytes = new Uint8Array(length);
    window.crypto.getRandomValues(randomBytes);
    return toBase64Url(randomBytes).substring(0, length);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return toBase64Url(digest);
}

export class GoogleDriveAdapter {
    private config: GoogleDriveConfig;
    private accessTokenInMemory?: string;
    private onStatusChange?: (status: DriveSyncStatus) => void;

    constructor(onStatusChange?: (status: DriveSyncStatus) => void) {
        this.onStatusChange = onStatusChange;
        this.config = this.loadConfig();
    }

    private loadConfig(): GoogleDriveConfig {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Purge legacy access tokens from persistent storage if present
                delete parsed.accessToken;
                delete parsed.refreshToken;
                return parsed;
            }
            return { connected: false };
        } catch {
            return { connected: false };
        }
    }

    private saveConfig(config: GoogleDriveConfig): void {
        // Never persist authorization tokens in localStorage
        const { accessToken, refreshToken, ...safeConfig } = config;
        this.config = safeConfig;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(safeConfig));
    }

    public getConfig(): GoogleDriveConfig {
        return { ...this.config };
    }

    public setAccessToken(token: string, expiresInSeconds: number = 3600): void {
        this.accessTokenInMemory = token;
        const expiresAt = Date.now() + expiresInSeconds * 1000;
        this.config.expiresAt = expiresAt;
        this.saveConfig({ ...this.config, connected: true });
    }

    public getAccessToken(): string | undefined {
        if (!this.accessTokenInMemory) return undefined;
        if (Date.now() >= (this.config.expiresAt || 0)) {
            this.accessTokenInMemory = undefined;
            return undefined;
        }
        return this.accessTokenInMemory;
    }

    /**
     * Initiate Google OAuth2 Authorization Code Flow with PKCE (S256)
     * Scope restricted to least-privilege drive.appdata
     */
    public async initiateAuth(clientId: string, redirectUri: string = window.location.origin): Promise<void> {
        if (this.onStatusChange) this.onStatusChange('connecting');

        const state = generateRandomString(32);
        const codeVerifier = generateRandomString(64);
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        const tx: OAuthTxState = {
            state,
            codeVerifier,
            redirectUri,
            timestamp: Date.now(),
        };
        sessionStorage.setItem(OAUTH_TX_STORAGE_KEY, JSON.stringify(tx));

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: DRIVE_SCOPE,
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            include_granted_scopes: 'true',
        });

        window.location.href = `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
    }

    /**
     * Complete OAuth callback by handling state validation and code_verifier token exchange
     */
    public async handleAuthCallback(searchOrUrl: string, clientId: string): Promise<boolean> {
        const searchParams = new URLSearchParams(
            searchOrUrl.includes('?') ? searchOrUrl.split('?')[1] : searchOrUrl
        );
        const code = searchParams.get('code');
        const returnedState = searchParams.get('state');

        if (!code || !returnedState) return false;

        const rawTx = sessionStorage.getItem(OAUTH_TX_STORAGE_KEY);
        sessionStorage.removeItem(OAUTH_TX_STORAGE_KEY); // Single-use consumption

        if (!rawTx) return false;

        try {
            const tx: OAuthTxState = JSON.parse(rawTx);
            if (tx.state !== returnedState) {
                console.error('[GoogleDrive] OAuth state mismatch — callback rejected.');
                return false;
            }
            if (Date.now() - tx.timestamp > 10 * 60 * 1000) {
                console.error('[GoogleDrive] OAuth transaction expired.');
                return false;
            }

            const tokenRes = await fetch(DRIVE_TOKEN_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: clientId,
                    code,
                    code_verifier: tx.codeVerifier,
                    grant_type: 'authorization_code',
                    redirect_uri: tx.redirectUri,
                }),
            });

            if (!tokenRes.ok) {
                const errBody = await tokenRes.json().catch(() => ({}));
                console.error('[GoogleDrive] PKCE Code exchange failed:', errBody);
                return false;
            }

            const tokenData = await tokenRes.json();
            const accessToken = tokenData.access_token;
            const expiresIn = tokenData.expires_in || 3600;

            if (accessToken) {
                this.setAccessToken(accessToken, expiresIn);
                if (this.onStatusChange) this.onStatusChange('connected');
                return true;
            }
        } catch (err) {
            console.error('[GoogleDrive] Error processing PKCE authorization callback:', err);
        }
        return false;
    }

    /**
     * Disconnect Google Drive
     */
    public disconnect(): void {
        this.accessTokenInMemory = undefined;
        sessionStorage.removeItem(OAUTH_TX_STORAGE_KEY);
        this.saveConfig({ connected: false });
        if (this.onStatusChange) this.onStatusChange('disconnected');
    }

    /**
     * Upload Encrypted Capsule Vault Blob to Google Drive AppData Folder
     */
    public async uploadEncryptedVault(encryptedCapsules: Capsule[]): Promise<boolean> {
        const accessToken = this.getAccessToken();
        if (!this.config.connected || !accessToken) {
            if (this.onStatusChange) this.onStatusChange('revoked');
            throw new Error('Google Drive is not connected or token expired. Please re-authenticate.');
        }

        if (this.onStatusChange) this.onStatusChange('syncing');

        try {
            const fileId = await this.findVaultFileId();

            const body = JSON.stringify({
                version: 2,
                updatedAt: new Date().toISOString(),
                payload: encryptedCapsules,
            });

            if (fileId) {
                await fetch(`${DRIVE_UPLOAD_URL}/files/${fileId}?uploadType=media`, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body,
                });
            } else {
                const metadata = {
                    name: ENCRYPTED_FILE_NAME,
                    parents: ['appDataFolder'],
                };

                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
                form.append('file', new Blob([body], { type: 'application/json' }));

                await fetch(`${DRIVE_UPLOAD_URL}/files?uploadType=multipart`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: form,
                });
            }

            const updatedConfig = {
                ...this.config,
                lastSyncedAt: new Date().toISOString(),
            };
            this.saveConfig(updatedConfig);

            if (this.onStatusChange) this.onStatusChange('connected');
            return true;
        } catch (err) {
            if (this.onStatusChange) this.onStatusChange('error');
            throw err;
        }
    }

    /**
     * Download Encrypted Vault Blob from Google Drive AppData Folder
     */
    public async downloadEncryptedVault(): Promise<Capsule[] | null> {
        const accessToken = this.getAccessToken();
        if (!this.config.connected || !accessToken) return null;

        const fileId = await this.findVaultFileId();
        if (!fileId) return null;

        const res = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                if (this.onStatusChange) this.onStatusChange('revoked');
            }
            throw new Error(`Failed to download from Google Drive: ${res.status}`);
        }

        const data = await res.json();
        return data.payload || [];
    }

    private async findVaultFileId(): Promise<string | null> {
        const accessToken = this.getAccessToken();
        if (!accessToken) return null;

        const query = encodeURIComponent(`name = '${ENCRYPTED_FILE_NAME}' and 'appDataFolder' in parents and trashed = false`);
        const res = await fetch(`${DRIVE_API_URL}/files?spaces=appDataFolder&q=${query}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data.files && data.files.length > 0 ? data.files[0].id : null;
    }

    /**
     * Upload V3 Vault Header and V3 Capsule Blobs to Google Drive AppData Folder
     */
    public async uploadV3Vault(vaultHeader: V3VaultHeader | null, capsules: Capsule[]): Promise<boolean> {
        const accessToken = this.getAccessToken();
        if (!this.config.connected || !accessToken) {
            if (this.onStatusChange) this.onStatusChange('revoked');
            throw new Error('Google Drive is not connected or token expired. Please re-authenticate.');
        }

        if (this.onStatusChange) this.onStatusChange('syncing');

        // Security assertion: Verify no plaintext VMK or Recovery Key material is present in payload
        const rawPayloadStr = JSON.stringify({ vaultHeader, capsules });
        const forbiddenKeys = ['rawVMK', 'rawVmkBytes', 'recoveryKey', 'plaintextPassword', 'plaintextContent'];
        for (const key of forbiddenKeys) {
            if (rawPayloadStr.includes(key)) {
                throw new Error(`Security Violation: Plaintext secret key material (${key}) cannot be sent to Google Drive.`);
            }
        }

        try {
            const fileId = await this.findFileIdByName(ENCRYPTED_V3_FILE_NAME);

            const v3VaultFile: DriveV3VaultFile = {
                version: 3,
                updatedAt: new Date().toISOString(),
                vaultHeader,
                capsules,
            };

            const body = JSON.stringify(v3VaultFile);

            if (fileId) {
                const res = await fetch(`${DRIVE_UPLOAD_URL}/files/${fileId}?uploadType=media`, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body,
                });
                if (!res.ok) throw new Error(`Failed to patch V3 vault to Google Drive: ${res.status}`);
            } else {
                const metadata = {
                    name: ENCRYPTED_V3_FILE_NAME,
                    parents: ['appDataFolder'],
                };

                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
                form.append('file', new Blob([body], { type: 'application/json' }));

                const res = await fetch(`${DRIVE_UPLOAD_URL}/files?uploadType=multipart`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: form,
                });
                if (!res.ok) throw new Error(`Failed to upload V3 vault to Google Drive: ${res.status}`);
            }

            const updatedConfig = {
                ...this.config,
                lastSyncedAt: new Date().toISOString(),
            };
            this.saveConfig(updatedConfig);

            if (this.onStatusChange) this.onStatusChange('connected');
            return true;
        } catch (err) {
            if (this.onStatusChange) this.onStatusChange('error');
            throw err;
        }
    }

    /**
     * Download V3 Vault Header and Capsules from Google Drive AppData Folder
     */
    public async downloadV3Vault(): Promise<DriveV3VaultFile | null> {
        const accessToken = this.getAccessToken();
        if (!this.config.connected || !accessToken) return null;

        const fileId = await this.findFileIdByName(ENCRYPTED_V3_FILE_NAME);
        if (!fileId) return null;

        const res = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                if (this.onStatusChange) this.onStatusChange('revoked');
            }
            throw new Error(`Failed to download V3 vault from Google Drive: ${res.status}`);
        }

        const data = (await res.json()) as DriveV3VaultFile;
        if (data.version !== 3) {
            throw new Error(`Invalid Drive V3 file version: expected 3, got ${data.version}`);
        }
        return data;
    }

    /**
     * Reconciles local and remote capsule records respecting monotonic revision counters (rev) and updatedAt timestamps.
     */
    public reconcileV3Capsules(
        localCapsules: Capsule[],
        remoteCapsules: Capsule[]
    ): { merged: Capsule[]; pendingSyncNeeded: boolean } {
        const localMap = new Map<string, Capsule>();
        localCapsules.forEach(c => localMap.set(c.id, c));

        const remoteMap = new Map<string, Capsule>();
        remoteCapsules.forEach(c => remoteMap.set(c.id, c));

        const allIds = new Set<string>([...localMap.keys(), ...remoteMap.keys()]);
        const merged: Capsule[] = [];
        let pendingSyncNeeded = false;

        for (const id of allIds) {
            const local = localMap.get(id);
            const remote = remoteMap.get(id);

            if (local && !remote) {
                merged.push(local);
                pendingSyncNeeded = true;
            } else if (!local && remote) {
                merged.push(remote);
            } else if (local && remote) {
                const localRev = local.rev || 1;
                const remoteRev = remote.rev || 1;

                if (remoteRev > localRev) {
                    merged.push(remote);
                } else if (localRev > remoteRev) {
                    merged.push(local);
                    pendingSyncNeeded = true;
                } else {
                    // Equal revision: compare updatedAt ISO timestamp
                    const localTime = new Date(local.updatedAt).getTime();
                    const remoteTime = new Date(remote.updatedAt).getTime();

                    if (remoteTime > localTime) {
                        merged.push(remote);
                    } else {
                        merged.push(local);
                        if (localTime > remoteTime) pendingSyncNeeded = true;
                    }
                }
            }
        }

        return { merged, pendingSyncNeeded };
    }

    private async findFileIdByName(fileName: string): Promise<string | null> {
        const accessToken = this.getAccessToken();
        if (!accessToken) return null;

        const query = encodeURIComponent(`name = '${fileName}' and 'appDataFolder' in parents and trashed = false`);
        const res = await fetch(`${DRIVE_API_URL}/files?spaces=appDataFolder&q=${query}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data.files && data.files.length > 0 ? data.files[0].id : null;
    }
}
