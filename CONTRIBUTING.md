# Contributing to Inkrypt 🖋️

Thank you for your interest in contributing to **Inkrypt**! We welcome open-source contributions focused on privacy, cryptography, security, accessibility, and UI performance.

---

## 📜 Licensing & Code of Conduct

* All contributions to this repository must be licensed under the **GNU Affero General Public License v3 (AGPLv3)**.
* Please maintain a welcoming, respectful, and inclusive community environment.

---

## 🛠️ Contribution Workflow

1. **Fork & Branch**:
   Create a topic branch from `main` for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Code Standards**:
   * Enforce strict TypeScript types. Avoid using `any`.
   * Ensure zero plaintext data leakage to backend server routes.
   * Verify that encryption keys remain isolated in volatile RAM.

3. **Running Tests**:
   Before submitting a pull request, run the test suite to ensure all cryptographic and security assertions pass:
   ```bash
   npm run test
   ```

4. **Submitting a Pull Request**:
   * Provide a concise description of your changes in the PR body.
   * Document any new environment variables or schema alterations.

---

Thank you for helping build private, client-side encrypted technology!
