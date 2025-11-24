# Secret Capsule 💊
Check out the live version running on GitHub Pages: **[Launch Secret Capsule][def]**

> **Note:** The demo runs in "Client-Only Mode". All data is stored securely in your browser's IndexedDB and is never sent to a server.

## 🏗 Architecture

This project is a monorepo managed by **npm workspaces**:

- **`apps/frontend`**: React + Vite + TypeScript application.
- **`apps/server`**: Node.js + Express + TypeScript API.
- **`packages/crypto-utils`**: Shared cryptographic primitives (WebCrypto API).
- **`packages/types`**: Shared TypeScript interfaces.
- **`packages/ui`**: Shared UI components and Tailwind configuration.

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm v9+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/secret-capsule.git
   cd secret-capsule
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   This command runs both the frontend and backend concurrently.
   ```bash
   npm run dev
   ```
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend: [http://localhost:3001](http://localhost:3001)

### Build

To build all packages and applications for production:

```bash
npm run build
```

## 🔒 Security

- **Encryption**: AES-GCM 256-bit encryption for data at rest.
- **Key Derivation**: PBKDF2 (100,000 iterations) to derive encryption keys from your Diary Password.
- **Transport**: All data must be transmitted over HTTPS (enforced in production).

See [SECURITY.md](./SECURITY.md) and [THREAT_MODEL.md](./THREAT_MODEL.md) for deep dives.

## 🎨 Design

The UI follows a "Futuristic Glass" aesthetic. See [DESIGN.md](./DESIGN.md) for the design system and accessibility choices.

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.


[def]: https://sachin-s543.github.io/Diary/