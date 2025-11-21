# Design Document 🎨

## Aesthetic Philosophy: "Futuristic Glass"

Secret Capsule aims to feel like a device from the near future—clean, precise, and slightly ethereal. We avoid the "corporate flat" look in favor of depth and light.

### Key Elements

1. **Glassmorphism**:
   - High transparency backgrounds (`bg-white/10`) with `backdrop-blur`.
   - Subtle white borders (`border-white/20`) to define edges without heavy lines.
   - Used for cards, modals, and the main diary container.

2. **Color Palette**:
   - **Background**: Deep Slate (`#0f172a`) - Provides a dark, infinite canvas.
   - **Primary**: Sky Blue (`#38bdf8`) - Represents clarity and technology.
   - **Accent**: Pink/Purple gradients - Adds a touch of humanity and warmth.
   - **Text**: High contrast white/gray for readability against dark backgrounds.

3. **Typography**:
   - **Inter**: A highly legible, modern sans-serif font that works well at all sizes.
   - **Spacing**: Generous whitespace to prevent clutter and enhance the "premium" feel.

## Accessibility (a11y)

- **Contrast**: All text combinations aim to meet WCAG AA standards.
- **Keyboard Navigation**: Interactive elements (buttons, inputs) have visible focus states (`focus:ring`).
- **Semantic HTML**: Use of `<header>`, `<main>`, `<button>`, and `<input>` ensures screen reader compatibility.
- **Reduced Motion**: Animations should respect the user's `prefers-reduced-motion` setting (to be implemented).

## Component Library (`@secret-capsule/ui`)

We use a shared UI package to ensure consistency.
- `glass-card`: Standard container for content.
- `btn-primary`: Main call-to-action with a subtle glow.
- `input-field`: Translucent inputs that blend into the glass theme.
