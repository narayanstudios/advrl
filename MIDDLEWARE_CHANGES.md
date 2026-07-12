# Wiring the React bundle into the existing Vercel Edge Middleware

The project is a static site served through `middleware.js`, which rewrites
clean URLs to physical files in `/public`. It is **not** a Next.js app, so
there's no framework-level routing to hook into — the middleware itself is
the router. This doc is the one required change to `middleware.js`; every
other file, including all auth pages, stays untouched.

## 1. Build the React app and drop it into `/public`

```bash
cd react-app
npm install
npm run build        # outputs react-app/dist/
cp -r dist public/react     # copy into the main project's /public/react/
```

`vite.config.js` is already set with `base: '/react/'` so the built
`index.html` references `/react/assets/...` correctly once copied there.

## 2. Update the route map in `middleware.js`

Change only these two lines in `routeMap` (everything else in the file is
unchanged):

```diff
   const routeMap = {
-    '/home': '/pages/core/home.html',
+    '/home': '/react/index.html',
     '/upload': '/pages/core/upload.html',
     '/authentication': '/authentication.html',
     '/forgot-password': '/forgot-password.html',
     '/404': '/404.html',
-    '/profile': '/profile.html'
+    '/profile': '/react/index.html'
   };
```

Both `/home` and `/profile` now rewrite to the same `react/index.html`. The
React Router inside the bundle reads the real browser URL (`/home` or
`/profile`) and renders the matching page — the middleware doesn't need to
know there are two different "pages" behind that one file.

> Note: the original `routeMap` pointed `/profile` at `/profile.html`, a file
> that doesn't exist anywhere in the project (only `pages/core/profile_ui.html`
> and the unrelated `profile_view.html` do). That looks like a pre-existing
> bug in the source project — `/profile` likely already 404'd before this
> migration. This change also happens to fix it, as a side effect of pointing
> it at the real, working profile page.

## 3. `pages/core/home.html` and `pages/core/profile_ui.html` stay in place

The middleware's "dynamic router" step (`else if (!pathname.includes('.'))`)
still resolves `/pages/core/home` → `pages/core/home.html` and
`/pages/core/profile_ui` → `pages/core/profile_ui.html` for anyone who
hits those exact paths directly. Nothing forces those old static files to be
deleted, so this migration is non-destructive and reversible — you can point
`routeMap['/home']` back at the old file at any time.

## 4. Everything else is genuinely untouched

`coreShortURLs`, the `.html` stripper, the auth-cookie gate, and every other
route (`/authentication`, `/forgot-password`, `/upload`, `/pages/profile/edit-profile`,
etc.) go through the exact same middleware code path as before — none of it
was modified.
