# Advora — Home & Profile React Migration

Scope: **only** Home (`pages/core/home.html`) and Profile
(`pages/core/profile_ui.html`) were migrated to React. Every other page
(authentication, forgot-password, OTP, reset-password, upload, hub, new-post,
edit-profile) is untouched HTML/CSS/JS and is not part of this project.

## How to run

```bash
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
```

This sandbox has no network access, so `npm install` / `npm run build` /
`npm run dev` could not actually be executed here — the source tree is
complete and ready to run, but hasn't been build-verified. Please run
`npm install && npm run build` first thing and sanity-check `npm run dev`
before deploying. See `MIDDLEWARE_CHANGES.md` for how the built output plugs
into the existing site's routing.

## What was reused verbatim (byte-for-byte, zero edits)

- `assets/js/api/data.js`, `todoAPI.js`, `scheduleAPI.js`, `authAPI.js`
- `assets/js/core/LnrStorageCore.js`, `networkLayer.js`, `errorHandler.js`
- `assets/js/indexeddb.js`, `assets/js/lnr-relay.js`, `assets/js/components.js`
- `assets/css/home.css`, `assets/css/profile.css`
- all referenced icon SVGs

These live under `src/legacy/js/` and `public/legacy/css/`, in the exact same
relative folder structure as the original project, so none of their internal
`import`/relative paths needed to change.

`components.js` defines `<advora-header>` and `<advora-nav>` as native custom
elements (Shadow DOM). React renders custom elements natively, so
`AdvoraChrome.jsx` is just `<advora-header /><advora-nav />` — the header,
sidebar, bottom nav, and session/logout logic are 100% the original
component, not reimplemented.

## The one necessary refactor: `feed.js` → `feed-engine.js`

The original `feed.js` was a page-lifetime IIFE built around one
module-level `state` object and one `.feed` container, booted once on
`DOMContentLoaded`. That works for a single static page, but the brief
explicitly requires **the same PostCard component on both Home and Profile**,
which needs two independent post containers running side by side in one SPA.

So `feed-engine.js` makes exactly one structural change: the module-level
`state` became a factory (`createHomeFeedController(containerEl, tabsEl)`),
and the click/tap interaction wiring was pulled out into a standalone
`attachCardInteractions(containerEl)` so Profile can reuse it without pulling
in Home's pagination/tabs/pull-to-refresh. `buildPostCard()` — the actual
PostCard markup generator — and every algorithm (infinite scroll, caching,
optimistic like/save, the pinch-zoom image viewer, pull-to-refresh, toast
queue) are copied unchanged, function body for function body. Only the icon
paths were updated (`../../assets/icons/...` → `/legacy/icons/...`, since the
folder moved) and `getApi()` now reads `window.AdvoraAPI` lazily instead of
capturing it once at import time (more robust to load order in a bundler).

Component list from the brief, and where each lives:

| Component | File |
|---|---|
| PostCard | `components/PostCard.jsx` (wraps `feed-engine.buildPostCard`) |
| Feed | `components/Feed.jsx` |
| Header / Navigation / Bottom Nav | `components/AdvoraChrome.jsx` (native web components) |
| Avatar | `components/Avatar.jsx` |
| Profile posts list | `components/ProfilePostsList.jsx` |
| Loader (skeleton cards) | inline in `components/Feed.jsx`, same markup as original |
| Toast | `feed-engine.js` (`queueToast`), same singleton `#advora-toast` div |
| Dialog (image viewer) | `feed-engine.js` (`openViewer`/`closeViewer`), same singleton overlay |

## CSS

`home.css` and `profile.css` are copied unmodified and are loaded/unloaded
per-route as real `<link>` tags (`legacy/useLegacyStylesheet.js`) instead of
bundled as JS imports. Reason: both files independently declare their own
`:root` tokens (different `--bg`/`--border` values) and reused generic class
names — on the original site they were never present on the same page at
once, so bundling both permanently would let one page's tokens bleed into
the other. Loading/unloading via `<link>` exactly reproduces the original
isolation with no changes to either file.

One new file was added: `public/legacy/css/postcard.css`. It's not new
styling — it's the PostCard-related rule blocks (`.card`, `.post-*`,
`.action-btn`, the image viewer, the toast, etc.) copied verbatim out of
`home.css`, so Profile (which doesn't load `home.css`, to avoid the token
collision above) can render the shared PostCard identically. It also has one
small addition: `.p-posts-feed { display:flex; flex-direction:column;
gap:16px; }`, a layout rule for the new stacked-cards Posts tab (see below).

## Disclosed tradeoff: Profile's Posts tab

The original Profile page rendered posts as a small Instagram-style
thumbnail grid with a separate custom lightbox (`#viewerOverlay`) that had
its own Edit/Archive/Delete menu. The brief's requirement #4 explicitly
overrides that: *"The Profile page must use the exact same reusable PostCard
component... only one shared PostCard component used throughout."*

`ProfilePostsList.jsx` now renders the user's posts as full PostCards
(stacked, same as the Home feed), reusing `buildPostCard` and
`attachCardInteractions` directly — so like/save/share/menu/image-zoom all
work identically to Home. The tradeoff: the shared PostCard's menu only has
Copy/Report (viewer-of-a-post actions), not the old Edit/Archive/Delete
owner actions, and the standalone lightbox modal is gone in favor of the
PostCard's own built-in pinch-zoom image viewer. Adding owner-only
Edit/Archive/Delete back in without forking the shared component would need
a small follow-up (e.g., an optional `menuItems` prop on the PostCard
builder) — flagging it here rather than quietly dropping it or silently
duplicating a second card component.

## Known pre-existing issue (not introduced by this migration)

`authAPI.js`'s session check redirects to `/login.html` on failure, but the
site's actual login route is `/authentication`. That mismatch exists in the
original file and was left as-is (out of scope to fix per the migration
brief — auth-related behavior wasn't touched).
