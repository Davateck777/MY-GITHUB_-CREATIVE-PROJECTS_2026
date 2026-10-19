# Linkloom — UTM Link Builder & Manager

A client-side web app for personal branding consultants, coaches, solopreneurs, and creators who need consistent trackable links without a full marketing suite.

## Features

- Build and validate UTM URLs
- Preserve existing URL query parameters and hash fragments
- Channel presets for Instagram, LinkedIn, newsletters, YouTube, podcasts, and guest features
- Live URL preview
- Local history with copy, edit/template, QR, delete, search, and sorting
- Download CSV exports
- JSON backup and restore
- Built-in client-side SVG QR generator
- Light/dark theme
- Responsive layout
- No runtime server, database, account, analytics, or external API required

## File structure

```text
utm-link-builder/
├── index.html
├── css/
│   ├── styles.css
│   └── themes.css
├── js/
│   ├── app.js
│   ├── utmBuilder.js
│   ├── presets.js
│   ├── storage.js
│   ├── qrcode.js
│   ├── exportImport.js
│   ├── ui.js
│   └── toast.js
├── tests/
│   └── utmBuilder.test.js
├── package.json
└── README.md
```

Every HTML, CSS, JavaScript, and test code section includes a self-explanatory comment block describing its responsibility.

## Run locally

```bash
cd utm-link-builder
python3 -m http.server 4177
```

Open <http://localhost:4177>.

The app must be served over HTTP or HTTPS because ES modules are blocked by some browsers when opened directly from `file://`.

## Test

Node.js 18+ is recommended:

```bash
npm test
```

The test suite uses Node's built-in test runner and has no runtime dependencies.

## Deployment

The folder can be deployed directly to:

- GitHub Pages
- Netlify
- Vercel static hosting
- Cloudflare Pages

The app is entirely client-side. Saved links remain in the browser's localStorage and are not uploaded to a server.
