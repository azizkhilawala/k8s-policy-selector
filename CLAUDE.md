# Project Rules

## Design System — Astryx only (non-negotiable)

All UI code in this repo MUST use `@astryxdesign/core` exclusively. No exceptions.

### Components
- Use Astryx components for every interactive element: `Button`, `TextInput`, `Selector`, `MultiSelector`, `PowerSearch`, `Banner`, `Text`, `Token`, `Tokenizer`, `MultiSelector`, etc.
- Never use raw `<button>`, `<input>`, `<select>`, `<ul>/<li>` for UI — only for structural/semantic purposes where no Astryx equivalent exists.
- Never install or import any other UI library (MUI, Radix, Headless UI, Ant Design, etc.).

### Tokens — spacing, color, typography
- **Spacing:** always `var(--spacing-*)` — never raw `px`, `rem`, `em`, or numeric literals in inline styles.
- **Colors:** always `var(--color-*)` — never hex codes (`#fff`), `rgb()`, `rgba()`, or named colors (`white`, `red`).
- **Typography:** use the `<Text>` component from `@astryxdesign/core/Text` for all visible text. Never set `fontSize`, `fontWeight`, `fontFamily`, or `lineHeight` in inline styles directly — use `<Text size="..." weight="..." color="...">` props instead.
- **Border radius:** always `var(--border-radius-*)` — never raw `px`.
- **Box shadow:** avoid custom `box-shadow` values; prefer Astryx elevation tokens if available.

### What to avoid
| ❌ Not allowed | ✅ Use instead |
|---|---|
| `<button onClick={...}>` | `<Button label="..." onClick={...} />` |
| `style={{ color: '#333' }}` | `<Text color="primary">` |
| `style={{ fontSize: '0.875rem' }}` | `<Text size="sm">` |
| `style={{ padding: '8px 12px' }}` | `style={{ padding: 'var(--spacing-2) var(--spacing-3)' }}` |
| `style={{ background: 'white' }}` | `style={{ background: 'var(--color-background-primary)' }}` |
| `style={{ borderRadius: '6px' }}` | `style={{ borderRadius: 'var(--border-radius-md)' }}` |
| `style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}` | Use Astryx elevation token or omit |
| Custom dropdown `<ul>/<li>` | `<Selector hasSearch>` or `<MultiSelector hasSearch>` |

### Before every commit
- Grep for raw hex colors: `grep -rn '#[0-9a-fA-F]\{3,6\}' src/` — must return nothing in style props.
- Grep for raw px in styles: `grep -rn 'style=.*[0-9]px' src/` — must return nothing.
- Grep for rgba/rgb: `grep -rn 'rgba\?\(' src/` — must return nothing in style props.

## Git
- Commits require `--no-gpg-sign` (hardware GPG key unavailable in CI/agent sessions).
- Branch: `worktree-k8s-policy-selector` — never push to `main`.
