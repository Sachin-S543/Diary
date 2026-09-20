# Inkrypt — Threat Model 🕵️‍♂️

Inkrypt is designed to withstand a wide range of common digital threats while remaining honest about its limitations. We operate under a **Client-Side Envelope Encryption Architecture** where the server is untrusted for plaintext data.

## 🛡️ Threats Inkrypt PROTECTS Against (In-Scope)

### 1. **Data Breach (Server-Side)**
- **Scenario**: A malicious third-party gains access to our PostgreSQL database or Google Drive appDataFolder.
- **Protection**: Every entry is protected as a **V3CapsuleBlob** with per-capsule envelope encryption under a 256-bit Vault Master Key (VMK). No access to passwords, recovery keys, or unwrapped VMKs exists on the server or in cloud storage.

### 2. **Brute-Force Attacks**
- **Scenario**: An attacker captures an encrypted vault header and tries to guess the Diary Encryption Password.
- **Protection**: We use **Argon2id (64MB / 3 iterations)** to derive wrapping keys. Memory hardening makes GPU and ASIC brute-force attacks computationally expensive.

### 3. **Traffic Analysis (Metadata Privacy)**
- **Scenario**: An observer monitors the size of network packets to guess note length.
- **Protection**: Every note payload is **padded to a 4KB boundary** before encryption.

### 4. **Session Key Clearance**
- **Scenario**: You leave your computer unlocked and trigger logout or lock.
- **Protection**: Inkrypt purges in-memory keys (`clearAllKeys()`) and clears active unlocked diary state on logout and lock.

### 5. **Unauthorized Account Access**
- **Scenario**: Someone tries to create an account with your email.
- **Protection**: Signup requires **6-digit Email OTP verification** hashed with `bcrypt` (10 rounds) with a 5-attempt limit.

---

## ⚠️ Threats Inkrypt DOES NOT PROTECT Against (Out-of-Scope)

### 1. **Client-Side Malware (Keyloggers/Screen Grabbers)**
- If your device is compromised at the OS level (e.g., a keylogger captures keystrokes as you type your password), data can be stolen prior to encryption.

### 2. **Loss of Both Diary Password & Vault Recovery Key**
- Because encryption keys remain client-side, the server administrator **cannot reset your password or recover your data**. Loss of both your Diary Password and 46-character Vault Recovery Key means permanent loss of decryption capability.

### 3. **Phishing**
- Entering credentials into a fraudulent site compromises access. Always verify the domain before typing passwords.

### 4. **Physical Device Theft / Memory Analysis**
- An adversary with root physical access while a session is unlocked could read process memory before tabs are closed. We recommend full-disk encryption (BitLocker / FileVault).

---
*Your thoughts, inkrypted. Our threats, modeled.*
