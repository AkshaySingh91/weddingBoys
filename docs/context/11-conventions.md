# 11 — Code Conventions

Conventions inferred from the codebase as it stands. Follow them so new code is
indistinguishable from what is already there.

## Language and tooling

- **JavaScript, not TypeScript.** `.jsx` for components, `.js` for plain
  modules. There is no TS config; do not introduce one piecemeal.
- **ES modules everywhere**, including the backend (`"type": "module"`).
- **Tailwind CSS** for styling. There are no CSS modules and no styled-components.
  `app/globals.css` holds only the handful of genuinely global utilities.
- **ESLint** via `eslint-config-next` core-web-vitals. Run `npx eslint <path>`
  before finishing.

## File and folder naming

| Thing | Convention | Example |
|---|---|---|
| Component file | PascalCase `.jsx` | `BlogForm.jsx` |
| Route file | lowercase `page.jsx` | `app/(site)/films/page.jsx` |
| Dynamic segment | square brackets | `[slug]`, `[videoId]`, `[pageKey]` |
| Route group | parentheses | `(site)`, `(auth)`, `(dashboard)` |
| Private folder | leading underscore | `_components`, `_sections`, `_home` |
| Shared component | `Component/` at root | `Component/Navbar.jsx` |
| Hook | `use` prefix in `Hooks/` | `Hooks/useMediaLibrary.jsx` |
| Plain module | camelCase `.js` in `lib/` or `Utils/` | `lib/apiClient.js` |

Underscore-prefixed folders are excluded from routing, which is how
page-specific components live next to the page that uses them. Prefer that over
dumping everything in `Component/`.

## Import aliases

`jsconfig.json` maps `@/*` to the project root:

```jsx
import Navbar from '@/Component/Navbar.jsx';
import { apiJson } from '@/lib/apiClient.js';
import Herobanner from './_home/Herobanner.jsx';   // relative for siblings
```

Use `@/` for anything outside the current folder. Note that existing imports
usually include the `.jsx` extension — match that.

## Server vs client components

**Default to server components.** Add `'use client'` only when the file needs
state, effects, event handlers, browser APIs or a client-only library.

Be aware of the SEO cost: a `'use client'` page **cannot export `metadata`**.
When a public route needs both interactivity and metadata, use the split
pattern — every interactive public page now follows it:

```jsx
// page.jsx — server
import { SITE_URL } from '@/lib/siteConfig.js';
import ThingClient from './_components/ThingClient.jsx';

const title = 'Specific, unique page title | The Wedding Boys';
const description = 'One sentence a searcher would recognise as an answer.';

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/thing` },
  openGraph: { title, description, url: `${SITE_URL}/thing`, type: 'website' },
};

export default function ThingPage() {
  return <ThingClient />;
}

// _components/ThingClient.jsx — 'use client'
```

Wrap the client body in `<Suspense>` only when it calls `useSearchParams()`,
which otherwise fails the build (`app/(site)/search-result/page.jsx`).

### Checklist for a new public route

1. Server `page.jsx` exporting a **unique** `title` and `description`, plus a
   canonical built from `SITE_URL`.
2. Add the path to `STATIC_ROUTES` in `app/sitemap.js`.
3. Link it from `Component/Navbar.jsx` and/or the footer's `siteLinks` — an
   unlinked page earns no internal link equity.
4. Never hardcode the origin. Import `SITE_URL` from `@/lib/siteConfig.js`.
5. Only emit structured data describing content that actually exists.

## Data fetching

**Server component:**
```jsx
const res = await fetch(`${api_url}/api/content/home`, { next: { revalidate: 60 } });
```
Always wrap in `try/catch` and return `null` on failure so the page can fall
back — see [07 — Content CMS](./07-content-cms.md).

**Client component, authenticated:** use `apiFetch` / `apiJson` from
`@/lib/apiClient.js`. They send cookies and transparently refresh an expired
token.

**Client component, public:** plain `fetch` with the API host is fine.

Never use a relative `/api/...` path — there is no Next.js API layer, and a
relative path silently hits the Next server instead of Express.

## API base URL

```js
const api_url = process.env.NEXT_PUBLIC_API_URL;
```
Declared once at module scope, below the imports. This exact line appears in
almost every file that fetches; keep it consistent.

## User feedback

- **Toasts** — `fireMessage(message, 'success' | 'error')` from
  `@/Utils/fireMessage.js`. Top-right, 1.5s, pauses on hover.
- **Confirmations and blocking dialogs** — SweetAlert2 (`Swal.fire`) directly.
  Destructive actions must confirm first.
- **Long operations** — a `Swal` loading modal with `allowOutsideClick: false`
  during uploads.

## Images

- Public site → `next/image`.
- Admin → plain `<img>` is the established convention for blob previews and
  unknown-dimension S3 assets, with the disable comment directly above:
  ```jsx
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img src={preview.url} alt="preview" />
  ```
  Use this only where `next/image` genuinely does not fit; never on the public
  site, where image weight affects ranking.

## React 19 / lint specifics

`react-hooks/set-state-in-effect` is enforced. Calling an async loader in a
mount effect is the established pattern and needs the disable comment:

```jsx
useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchThings();
}, [fetchThings]);
```

Wrap such loaders in `useCallback` so the dependency is stable.

**Never mutate state.** Always produce new objects/arrays:
```jsx
setItems(prev => prev.map((it, i) => (i === index ? { ...it, name: value } : it)));
```

Randomised values (decorative particles, etc.) must be generated **after mount**
in an effect, never during render — otherwise SSR and the client disagree and
hydration fails. `Component/Background.jsx` is the reference pattern.

## Comments

The codebase comments **why**, not what. Look at `constants.js` explaining the
`__Secure-` vs `__Host-` decision, or `blocks.jsx` explaining why it omits
`'use client'`. Match that register: explain a non-obvious constraint, a
trade-off, or a gotcha. Do not narrate the code.

## Backend conventions

- Routers declare **absolute paths** (`/api/admin/blogs`), not prefixes.
- Middleware order: `verifyToken` → `requireRole` → handler.
- Controllers respond `{ message }` on error.
- Whitelist writable fields (see `EDITABLE_FIELDS` in `blogController.js`)
  rather than spreading `req.body` into a model.
- Models are `mongoose.models.X || mongoose.model('X', schema)` so hot reload
  does not throw.

## Before you finish

1. `npx eslint <changed paths>` — clean.
2. `npm run build` in `Next-Frontend` — succeeds.
3. If you changed behaviour described in `docs/context/`, update that document
   in the same change.
