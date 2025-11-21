# Threat Model 🕵️‍♂️

## Assets
1. **User Diary Entries**: Highly sensitive personal thoughts.
2. **User Credentials**: Login password and Diary password.
3. **Availability**: Access to the diary.

## Threats & Mitigations

### 1. Server Compromise
- **Threat**: Attacker gains full access to the database.
- **Impact**: Attacker can see user metadata (email, username) and **encrypted** diary blobs.
- **Mitigation**: Entries are encrypted client-side. Without the Diary Password, the blobs are useless. Login passwords are hashed with bcrypt.

### 2. Network Eavesdropping (Man-in-the-Middle)
- **Threat**: Attacker intercepts traffic between client and server.
- **Impact**: Could steal session tokens or encrypted blobs.
- **Mitigation**: HTTPS is mandatory. HttpOnly cookies prevent XSS theft of tokens.

### 3. Client-Side XSS
- **Threat**: Malicious script injected into the frontend.
- **Impact**: Could exfiltrate the decrypted data or the Diary Password from memory.
- **Mitigation**:
  - React escapes content by default.
  - Content Security Policy (CSP) should be configured (TODO).
  - HttpOnly cookies for auth tokens.

### 4. Brute Force on Diary Password
- **Threat**: Attacker downloads the encrypted blob and tries to guess the password offline.
- **Impact**: If the password is weak, data could be decrypted.
- **Mitigation**:
  - PBKDF2 with high iteration count (100k+) slows down guessing.
  - User education on strong passwords.

### 5. Loss of Diary Password
- **Threat**: User forgets their password.
- **Impact**: Permanent data loss.
- **Mitigation**: Warning UI during setup. Future: "Recovery Key" generated at setup time.
