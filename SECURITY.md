# Security Policy 🛡

## Reporting a Vulnerability

Please do **NOT** report security vulnerabilities via public GitHub issues.
If you find a security issue, please email **security@example.com**.

## Core Security Concepts

### 1. Zero-Knowledge Architecture
The server stores **encrypted blobs** only. It does not have access to the user's "Diary Password" or the encryption keys derived from it.
- **Risk**: If the user forgets their Diary Password, their data is **permanently lost**. We accept this trade-off for privacy.

### 2. Client-Side Encryption
- **Algorithm**: AES-GCM (256-bit).
- **Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations.
- **Salt**: Unique per user (currently static for MVP, planned upgrade to per-user random salt).

### 3. Authentication
- **Session**: HttpOnly, Secure, SameSite=Lax cookies.
- **Tokens**: Short-lived JWTs.
- **Passwords**: Hashed using `bcrypt` (server-side login password).

## Deployment Security

- **HTTPS**: Must be enabled. The crypto APIs (`window.crypto.subtle`) require a secure context (HTTPS or localhost).
- **Headers**: Helmet is used to set secure HTTP headers (HSTS, X-Frame-Options, etc.).
