# Mobile account layouts

The account UI uses the existing VCard styles and a dedicated `src/responsive.css` override layer.

- Up to 900px: compact branded auth header, forms immediately below it, 16px inputs, 44px minimum action targets, and a four-item bottom dashboard navigation with safe-area padding. Logout and password changes are available from Settings.
- 901–1180px: the desktop sidebar remains visible; editor and primary dashboard cards stack to avoid squeezing forms.
- Narrow phones: overview link and QR cards stack; editor actions, uploads, physical cards, activation, settings and draft previews fit the viewport. Email, phone and URL fields request the appropriate keyboard; activation codes disable auto-correction.
- The viewport respects screen cutouts and requests content resizing for virtual keyboards where the browser supports it. Zoom remains enabled.

## Verification

```bash
npm ci --ignore-scripts
npx playwright install --with-deps chromium
npm run test:mobile
```

This suite starts its own Vite server on `127.0.0.1:3100` with **test-only, intercepted Supabase responses**. It never creates users or changes any real backend. It verifies layout and frontend interactions rather than authentication security or database behavior. Keep using the separate real-backend integration/E2E suites for those.

Six Chromium browser scenarios cover RU/RO, Personal/Business, login and registration transitions, mismatched-password errors, recovery pages, a reduced viewport representing a visible keyboard, dashboard navigation, save, preview, populated NFC cards, settings and logout. Dashboard widths: 320, 375, 390, 480, 600, 640, 760, 820, 900, 901, 1024 and 1440px. Screenshots are written to `test-results/` for visual review. CI runs this suite before the real-backend tests.

For a preinstalled Chromium, use `MOBILE_CHROMIUM_PATH=/path/to/chromium npm run test:mobile`. Physical iOS/Android devices and their native keyboards still need manual acceptance; a reduced browser viewport does not reproduce all operating-system keyboard behavior.
