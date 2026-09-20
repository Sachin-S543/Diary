# Prerequisites for Inkrypt Development & Production 🛠️

To ensure a smooth experience when building, testing, or running Inkrypt, you'll need the following tools and environment configurations.

## 🟢 Core Web Stack
These are required for the web frontend and API server.

- **Node.js**: v18.17.0 or higher.
- **npm**: v9.6.0 or higher (required for workspaces).
- **TypeScript**: v5.0 or higher.

## 🔵 Database
Inkrypt uses a relational database for user metadata and encrypted blob storage.

- **PostgreSQL**: v14.0 or higher.
- **Environment**: Your `DATABASE_URL` in `.env` must be accessible during the server startup.

## 🔐 Security Configuration
Necessary for encryption and authentication features.

- **HTTPS Certificates**: Local development uses `localhost`; production must use valid TLS certificates.
- **SMTP Service**: Required for Email OTP signup. (Recommended: Gmail App Password, Resend, or SendGrid).
- **WebAuthn**: Requires HTTPS or a local secure context (`localhost`).

---

## ✅ Deployment Checklist

1. [ ] **Environment Variables**: Copy `.env.example` to `.env` and fill in all values.
2. [ ] **PostgreSQL**: Ensure the database user has schema modification permissions.
3. [ ] **Argon2id Support**: Ensure your environment has sufficient memory (64MB) for WASM key derivation.
4. [ ] **AGPLv3 Compliance**: If you modify and redistribute, you MUST provide the source code to your users.

---

### Checking your environment
```bash
node --version
npm --version
psql --version
```

