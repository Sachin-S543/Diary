# Inkrypt — Security Architecture 🛡️

Inkrypt is built on a **Client-Side Envelope Encryption Architecture**. This means:
1. **We cannot read your notes**: All encryption operations take place locally on your device before synchronization.
2. **We cannot reset your Diary Password**: Your Diary Encryption Password and Vault Recovery Key dual-wrap your Vault Master Key (VMK). Loss of both credentials means permanent loss of decryption capability.
3. **The server only sees ciphertext**: Every entry is encrypted and padded before it leaves your device.

## 🔐 Cryptographic Stack

### 1. Key Derivation: **Argon2id**
Inkrypt uses **Argon2id** for key derivation.
- **Parameters**:
  - Memory Cost: 64MB (Hardening against ASIC/GPU attacks).
  - Iterations: 3 (Balancing security and user experience).
  - Parallelism: 1 (Standard for browser/WASM contexts).
  - Salt: Dedicated 16-byte random `vaultSalt` generated per vault.
- **Implementation**: Derived via `hash-wasm` / Web Crypto API within the browser's sandbox.

### 2. Vault Master Key (VMK) & Envelope Encryption: **AES-GCM (256-bit)**
- **Vault Master Key (VMK)**: Random 256-bit symmetric key generated client-side upon vault initialization.
- **Dual Wrapping**: The VMK is dual-wrapped and persisted as `encryptedVMK_pass` (Password wrapper) and `encryptedVMK_rec` (Recovery Key wrapper).
- **Per-Capsule Keys**: Each entry is encrypted under a fresh per-capsule 256-bit key wrapped under the VMK.
- **AAD Domain Separation**: Cryptographic operations bind Additional Authenticated Data (AAD) for key contexts (`vmk`, `capsule_key`, `payload`).
- **Initialization Vector (IV)**: Cryptographically secure 12-byte random value per entry and wrapper.
- **Authentication**: AES-GCM provides built-in integrity checking to ensure ciphertexts are not tampered with.

### 3. Data Padding (Traffic Analysis Hardening)
- To prevent traffic analysis (guessing content length based on encrypted blob size), entries are padded to multiples of **4KB** before encryption.

### 4. Local Storage & Memory Hygiene
- **Local Encrypted Cache**: IndexedDB stores encrypted V3 vault headers (`vault_metadata`), encrypted capsule blobs (`encrypted_cache`), and pending mutations (`pending_sync_queue`). Plaintext keys are never persisted.
- **Memory Hygiene**: Transient key byte buffers are explicitly zero-filled (`zeroBuffer()`) after use. *(Note: `zeroBuffer()` provides application memory hygiene but cannot guarantee physical hardware memory erasure due to JS engine garbage collection).*

### 5. Multi-Step Authentication
- **Account Password**: Hashed on the server using `bcrypt` (12 rounds) to authenticate API requests.
- **Diary Password**: Used ONLY client-side to derive the Argon2id VMK password-wrapping key.
- **Email OTP**: Multi-factor verification during signup to ensure email ownership.

---

## 🛡️ Best Practices for Users

1. **Password Choice**: Use a long, unique passphrase for your Diary Password.
2. **Backup your Vault Recovery Key**: Store your 46-character Vault Recovery Key in a secure location.
3. **Session Management**: Explicitly log out on shared computers to purge transient in-memory keys and local encrypted caches.

## 📜 Vulnerability Disclosure
If you find a security vulnerability, please report it via [GitHub Issues](https://github.com/Sachin-S543/Diary/issues).

---
*Verified for AGPLv3 compliance. Our code is as open as our encryption is closed.*
