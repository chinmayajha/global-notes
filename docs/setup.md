# Setup Guide

## Prerequisites
- Node.js 20+, pnpm
- A [Neon](https://neon.tech) account (free)
- A [Clerk](https://clerk.com) account (free)
- A Vercel account (free)

---

## 1. Database

1. Create a Neon project and copy the connection string.
2. Run the schema:
   ```bash
   psql $DATABASE_URL -f db/schema.sql
   ```
   If you want `pgvector` for Phase 3 semantic search, enable it first in Neon:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

---

## 2. Clerk

1. Create a Clerk application at clerk.com.
2. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
3. In Clerk dashboard → Paths: set Sign-in to `/sign-in`, Sign-up to `/sign-up`.

---

## 3. Local development

```bash
cp .env.example apps/web/.env.local
# Fill in DATABASE_URL, CLERK keys
pnpm install
pnpm dev   # starts apps/web at http://localhost:3000
```

---

## 4. Deploy to Vercel

```bash
vercel --cwd apps/web
```

- Add `DATABASE_URL` and all `CLERK_*` env vars in Vercel dashboard.
- Set **Root Directory** to `apps/web` in project settings.

Or connect your GitHub repo to Vercel — it auto-deploys on push.

---

## 5. CLI setup

```bash
npm install -g @global-notes/cli   # once published
# Or run directly:
node packages/cli/dist/index.js config --set-key <your-api-key>
node packages/cli/dist/index.js config --set-server https://your-app.vercel.app

# Generate an API key in the web app → Settings → API Keys
gn "first note from CLI"
echo "piped note" | gn
```

---

## 6. Browser extension

1. Open Chrome → `chrome://extensions` → Enable "Developer mode"
2. Click "Load unpacked" → select `apps/extension/`
3. Click the extension icon → Open settings → paste API key + server URL

---

## 7. Desktop app (Phase 2)

Requires Rust + Tauri CLI:
```bash
cargo install tauri-cli
cd apps/desktop
pnpm tauri build
```

The built app registers `Cmd+Shift+N` globally (macOS) or `Ctrl+Shift+N` (Windows).

---

## 8. Mobile (PWA)

1. Open your deployed app on iOS/Android Safari/Chrome.
2. "Add to Home Screen".
3. Use the native Share button → "Global Notes" to save any page or selected text.
