# Inkrypt 🖋️ — Private, End-to-End Encrypted Diary

Inkrypt is a premium, zero-knowledge personal diary application. It prioritizes absolute privacy, combining robust cryptographic primitives with a modern writing experience.

Check out the web version (Client-Only Mode) [here](https://sachin-s543.github.io/Diary/).

## 🌟 Features

- **Zero-Knowledge Architecture**: The server never sees your password or your notes.
- **Argon2id Key Derivation**: Professional-grade hardening against brute-force attacks.
- **AES-GCM-256 Encryption**: Industry-standard symmetric encryption for your diary entries.
- **4KB Data Padding**: Mitigates "traffic analysis" by ensuring all encrypted blobs appear to be the same size.
- **Rich Text Editor**: Powered by TipTap — headers, lists, links, blockquotes, and code formatting.
- **Tags & Categories**: Organize your thoughts with a flexible meta-tagging system.
- **Email OTP Verification**: Secure, multi-step signup process.
- **Biometric Unlock**: Support for Windows Hello, Touch ID, or Face ID (WebAuthn).
- **Tauri Native App**: High-performance, low-resource Windows desktop application.
- **Offline Mode**: Access your encrypted cache even without an internet connection.

## 🏗 Project Structure (Monorepo)

- **`apps/frontend`**: React + Vite + TypeScript (Web & Tauri UI).
- **`apps/server`**: Node.js + Express + PostgreSQL (Encrypted Blob Storage & Auth Gate).
- **`packages/crypto-utils`**: Shared Argon2id and AES-GCM logic.
- **`packages/types`**: Shared TypeScript contracts.
- **`packages/ui`**: Shared UI components and Tailwind theme.

## 🚀 Getting Started

Follow the [PREREQUISITES.md](./PREREQUISITES.md) and [SETUP.md](./SETUP.md) for detailed, environment-specific instructions.

### Quick Start (Development)

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL and SMTP credentials.
   ```
3. **Run all services**
   ```bash
   npm run dev
   ```

### Running the Desktop App

1. Ensure the backend is running.
2. From `apps/frontend/`:
   ```bash
   npm run tauri:dev
   ```

## 📜 Documentation

- **[About Inkrypt](./ABOUT.md)** — Project mission and core philosophy.
- **[Security Architecture](./SECURITY.md)** — Deep dive into our cryptographic model.
- **[Threat Model](./THREAT_MODEL.md)** — Analysis of what Inkrypt protects against.
- **[License](./LICENSE)** — GNU Affero General Public License v3 (AGPLv3).

## 🤝 Contributing

We welcome contributions to privacy technology. All contributions must respect our AGPLv3 license and our [Code of Conduct](./CODE_OF_CONDUCT.md).

---
*Your thoughts, inkrypted.*