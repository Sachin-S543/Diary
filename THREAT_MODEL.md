# Inkrypt — Threat Model 🕵️‍♂️

Inkrypt is designed to withstand a wide range of common digital threats while remaining honest about its limitations. We assume a **Zero-Knowledge Architecture** where the server is untrusted.

## 🛡️ Threats Inkrypt PROTECTS Against (In-Scope)

### 1. **Data Breach (Server-Side)**
- **Scenario**: A malicious third-party gains access to our PostgreSQL database.
- **Protection**: Every entry is stored as an **AES-GCM-256 encrypted blob**. No access to passwords or decryption keys exists on the server. The attacker sees only random noise.

### 2. **Brute-Force Attacks**
- **Scenario**: An attacker captures an encrypted entry and tries to guess the "Diary Password".
- **Protection**: We use **Argon2id (64MB / 3 iterations)** to derive encryption keys. This is memory-hardened, making it extremely expensive and slow to run on hardware like GPUs or ASICs.

### 3. **Traffic Analysis (Metadata Privacy)**
- **Scenario**: An observer monitors the size of network packets to guess note length (e.g., "this note is 50 characters, must be a password").
- **Protection**: Every note is **padded to a 4KB multiple** before it's encrypted. A single word looks identical to a several-hundred-word paragraph.

### 4. **Shoulder Surfing (Session Timeout)**
- **Scenario**: You leave your computer unlocked and walk away.
- **Protection**: Inkrypt automatically **locks the session after 20 minutes** of inactivity (mousemove, keydown, click).

### 5. **Unauthorized Account Access**
- **Scenario**: Someone tries to create an account with your email.
- **Protection**: Multi-step signup requires **Email OTP verification** before the account is finalized.

---

## ⚠️ Threats Inkrypt DOES NOT PROTECT Against (Out-of-Scope)

### 1. **Client-Side Malware (Keyloggers/Screen Grabbers)**
- If your device is compromised at the OS level (e.g., a keylogger is active while you type your password), your data can be stolen before it is encrypted. We strongly recommend regular security updates for your device.

### 2. **Loss of Diary Password**
- Because we never see your password, we **cannot reset it**. Loss of your Diary Password is equivalent to the permanent loss of all your diary entries.

### 3. **Phishing**
- If you enter your passwords into a fake version of Inkrypt, the attacker will gain access to your credentials. Always verify the URL is `https://inkrypt.app` (or your trusted deployment).

### 4. **Physical Device Theft**
- If your device is stolen while the session is active, the thief will have access to your notes. We recommend full-disk encryption (like BitLocker or FileVault) for all computers.

---
*Your thoughts, inkrypted. Our threats, modeled.*
