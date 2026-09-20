# Inkrypt 🖋️ — Private, Client-Side Encrypted Personal Diary

**Inkrypt** is an open-source, privacy-first personal journaling application where your entries are encrypted on your local device using client-side envelope encryption before storage.

---

## 🌟 1. What is Inkrypt?

Inkrypt provides a serene writing experience powered by TipTap with strict cryptographic guarantees. It separates **account authentication** from **diary content encryption**, ensuring that even if the database is compromised, your personal thoughts remain unreadable without your Diary Encryption Password or Vault Recovery Key.

---

## 🏗️ 2. Architecture Overview

Inkrypt is structured as a TypeScript monorepo (`inkrypt-monorepo`):

* **`apps/frontend`**: React 18 + Vite SPA with TipTap editor, Web Worker cryptographic processing, and Google Drive `appDataFolder` sync adapter.
* **`apps/server`**: Node.js + Express backend providing stateful session management, email OTP verification, and PostgreSQL blob persistence.
* **`packages/crypto-utils`**: Shared cryptographic primitives (V3 VMK architecture, Argon2id KDF, AES-256-GCM envelope encryption/decryption, IndexedDB cache engine).
* **`packages/types`**: Shared TypeScript interfaces (`User`, `Capsule`, `V3VaultHeader`, `V3CapsuleBlob`, `DecryptedEntryPayload`, `UserSession`, `GoogleDriveConfig`).

---

## 🔐 3. V3 Encryption & Key Hierarchy Model

Inkrypt implements a Vault Master Key (VMK) envelope encryption architecture:

* **Vault Master Key (VMK)**: A 256-bit cryptographically secure random key generated client-side upon vault initialization.
* **Dual-Wrapped VMK**: The VMK is dual-wrapped and persisted as `encryptedVMK_pass` (wrapped under your Diary Password + `vaultSalt` via Argon2id) and `encryptedVMK_rec` (wrapped under a 46-character CSPRNG Vault Recovery Key + `vaultSalt` via Argon2id).
* **Per-Capsule Envelope Protection**: Each entry is encrypted under a fresh 256-bit per-capsule key wrapped by the VMK, bound with domain-separated Additional Authenticated Data (`vmk`, `capsule_key`, `payload`).
* **Key Derivation**: Argon2id KDF (`memorySize: 64MB`, `iterations: 3`, `parallelism: 1`, `hashLength: 32 bytes`) converts passphrases and recovery keys into 256-bit wrapping keys.
* **Symmetric Encryption**: AES-256-GCM authenticated encryption with random 96-bit (12-byte) IVs per wrapper and payload.
* **Volatile Memory Handling**: Unwrapped VMKs exist solely in browser RAM / Web Worker memory during an active session and are purged immediately upon locking or logging out.

---

## 🔑 4. Authentication Model

Authentication answers: *"Who is this user?"*

* **Account Password**: Hashed on the server using `bcrypt` (12 rounds) to authenticate API requests.
* **Email Verification**: 6-digit email OTP hashed with `bcrypt` (10 rounds) with a 5-attempt brute-force limit.
* **Session Security**: Server-issued JWTs stored in `HttpOnly`, `SameSite=lax` cookies bound to active database session records in PostgreSQL.

---

## ☁️ 5. Google Drive Encrypted Storage

* **Authorization Scope**: `https://www.googleapis.com/auth/drive.appdata`
* **App Data Folder Isolation**: Encrypted payloads are synced exclusively to Inkrypt's isolated, hidden `appDataFolder` (`inkrypt_diary_vault_v3.json`).
* **Zero Credential Exposure**: Google OAuth 2.0 PKCE token exchange. The application never sees or stores your Google password.

---

## 👁️ 6. What the Server CAN See

* User account email address & username.
* Hashed account password (`bcrypt`).
* Account creation & login timestamps.
* Active IP addresses and browser User-Agent strings.
* Encrypted V3 vault headers (`encryptedVMK_pass`, `encryptedVMK_rec`, `vaultSalt`), encrypted capsule blobs (`V3CapsuleBlob`), revisions (`rev`), and ISO timestamps.

---

## 🙈 7. What the Server CANNOT See

* Plaintext diary entry titles or body content.
* Plaintext entry tags or category labels.
* Your Diary Encryption Password.
* Your 46-character Vault Recovery Key.
* Unwrapped Vault Master Key (VMK) bytes.
* Your Google Account password.

---

## ⚠️ 8. Recovery Limitations

Because Inkrypt uses client-side envelope encryption, **the server administrator cannot reset your Diary Encryption Password or recover lost notes**. If you forget your Diary Password and lose your 46-character Vault Recovery Key, your encrypted data cannot be decrypted.

---

## 📌 9. Known Limitations

* Multi-device synchronization uses revision counter checks (`rev`) rather than CRDTs. Simultaneous edits compare timestamps and revision counters.
* Rich text image attachments are stored as embedded data URIs within the encrypted payload.
* In-memory zeroing (`zeroBuffer()`) provides application memory hygiene but cannot guarantee physical hardware memory erasure due to V8 engine garbage collection and memory reallocation.

---

## 🚀 10. Development & Database Setup

### Prerequisites
* Node.js v18+
* PostgreSQL database instance
* SMTP credentials (for OTP emails)

### Installation
```bash
# 1. Clone repository
git clone https://github.com/Sachin-S543/Diary.git
cd Diary

# 2. Install monorepo dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, and SMTP credentials.

# 4. Start frontend and backend in development mode
npm run dev
```

### Running Tests
```bash
npm run test --workspaces
```

---

## 🤝 11. Contribution Process

We welcome community contributions! Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`SECURITY.md`](./SECURITY.md) before submitting pull requests. All contributions are licensed under AGPLv3.

---

*Your thoughts, encrypted.*