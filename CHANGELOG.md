# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-11-24

### ✨ Added
- **Search Functionality**: Capsules can now be filtered by creation date or ID
  - Real-time search as you type
  - Searches through date strings (e.g., "Nov 24", "2025")
  - Searches through capsule IDs
  - Shows helpful message when no results match

### 🔧 Fixed
- Enabled the previously disabled search input field
- Search now works without requiring decryption (searches metadata only)

## [1.0.0] - 2025-11-24

### 🎉 Initial Release

**Secret Capsule** is a secure, encrypted diary application with a futuristic glass aesthetic.

### ✨ Features

#### Core Functionality
- **Encrypted Diary Entries**: Create, edit, and delete diary entries with end-to-end encryption
- **Secure Authentication**: Password-based authentication with PBKDF2 key derivation (100,000 iterations)
- **Client-Only Mode**: All data stored locally in IndexedDB for complete privacy
- **Server Mode**: Optional backend with SQLite database for multi-device sync

#### Security
- **AES-GCM 256-bit Encryption**: Military-grade encryption for all diary entries
- **Zero-Knowledge Architecture**: Your password never leaves your device
- **Secure Key Derivation**: PBKDF2 with 100,000 iterations
- **Transport Security**: HTTPS enforcement in production

#### User Experience
- **Futuristic Glass UI**: Modern, beautiful interface with glassmorphism effects
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode**: Eye-friendly dark theme
- **Smooth Animations**: Polished micro-interactions and transitions
- **Rich Text Editor**: Format your entries with ease

#### Developer Experience
- **Monorepo Architecture**: Organized with npm workspaces
- **TypeScript**: Full type safety across the codebase
- **Shared Packages**: Reusable crypto utilities, types, and UI components
- **Docker Support**: Containerized backend for easy deployment
- **GitHub Actions**: Automated CI/CD pipeline
- **Comprehensive Documentation**: Security, deployment, and technical guides

### 📦 Packages

- `apps/frontend`: React + Vite + TypeScript application
- `apps/server`: Node.js + Express + TypeScript API
- `packages/crypto-utils`: Shared cryptographic primitives
- `packages/types`: Shared TypeScript interfaces
- `packages/ui`: Shared UI components

### 🚀 Deployment

- **Frontend**: Deployed on GitHub Pages at [sachin-s543.github.io/Diary](https://sachin-s543.github.io/Diary/)
- **Backend**: Docker image available at GitHub Container Registry

### 📚 Documentation

- [README.md](./README.md) - Getting started guide
- [SECURITY.md](./SECURITY.md) - Security architecture and best practices
- [THREAT_MODEL.md](./THREAT_MODEL.md) - Threat analysis and mitigations
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment instructions
- [TECHNICAL_REPORT.md](./TECHNICAL_REPORT.md) - Detailed technical documentation

### 🙏 Acknowledgments

Built with modern web technologies and best security practices.

---

[1.0.0]: https://github.com/Sachin-S543/Diary/releases/tag/v1.0.0
