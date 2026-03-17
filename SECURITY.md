# Inkrypt — Security Architecture 🛡️

Inkrypt is built on a **Zero-Knowledge Architecture**. This means:
1. **We cannot read your notes**: All encryption is done on your device.
2. **We cannot reset your password**: Your "Diary Password" is the literal source of your decryption key. Loss of this password means permanent loss of your data.
3. **The server only sees noise**: Every entry is encrypted and padded before it leaves your device.

## 🔐 Cryptographic Stack

### 1. Key Derivation: **Argon2id** (Replacement for PBKDF2)
Inkrypt has migrated from PBKDF2 to **Argon2id**, the winner of the Password Hashing Competition.
- **Parameters**:
  - Memory Cost: 64MB (Hardening against ASIC/GPU attacks).
  - Iterations: 3 (Balancing security and user experience).
  - Parallelism: 1 (Standard for browser/WASM contexts).
  - Salt: Unique 16-byte random salt per user (stored as a hex string in the DB).
- **Implementation**: Hashed via `hash-wasm` (MIT licensed) for maximum performance within the browser's sandbox.

### 2. Symmetric Encryption: **AES-GCM (256-bit)**
- **Algorithm**: Advanced Encryption Standard in Galois/Counter Mode.
- **Key Size**: 256 bits (derived from Argon2id).
- **Initialization Vector (IV)**: 12-byte cryptographically secure random value per entry.
- **Authentication**: GCM provides built-in integrity checking to ensure no one has tampered with the encrypted data.

### 3. Data Padding (Anonymization)
- To prevent "traffic analysis" (guessing content length based on encrypted blob size), every entry is padded to a multiple of **4KB** before encryption.
- This ensures that a short sentence and a long paragraph look identical to an observer.

### 4. Local Storage Encryption
- Inkrypt caches your notes locally in IndexedDB for performance and offline use.
- **Zero-Trust Cache**: This local database is fully encrypted using the same keys as the cloud storage.

### 5. Multi-Step Authentication
- **Login Password**: Hashed with `bcrypt` (10 rounds) and used only to identify yourself to the server.
- **Diary Password**: Used ONLY client-side to derive the Argon2id encryption key.
- **Email OTP**: Multi-factor verification during signup to ensure email ownership.

---

## 🛡️ Best Practices for Users

1. **Password Choice**: Use a long, unique passphrase for your Diary Password.
2. **Backup your Keys**: Since we cannot reset your password, we recommend using a traditional password manager to store your "Diary Password".
3. **Session Management**: Inkrypt automatically locks after 20 minutes of inactivity. For maximum security, explicitly log out on public computers.

## 📜 Vulnerability Disclosure
If you find a security vulnerability, please report it via [GitHub Issues](https://github.com/Sachin-S543/Diary/issues).

---
*Verified for AGPLv3 compliance. Our code is as open as our encryption is closed.*
