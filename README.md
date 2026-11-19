# First React App

A small React + TypeScript single-page app:

1. **`/welcome`**: enter a username (press Enter or click **Log In**).
2. **`/logged-in`**: shows "Hello *name*" with a **Log Out** button.

`/` sends you to the right page, unknown URLs show a "Page not found" page, and
`/logged-in` sends you back to `/welcome` if no username has been entered.
The username is kept in `sessionStorage`, so it survives a page refresh but is
forgotten when the tab is closed or you log out.

> This is **not** authentication. There is no server or password; the "login"
> only stores a display name in the browser. Do not rely on it to protect anything.

## Requirements

- Node.js 22.22.2+, 24.15+ or 26+ (the versions jsdom and Vitest support).
  `.nvmrc` pins Node 24; run `nvm use` if you use nvm.

## Scripts

| Command             | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `npm start`         | Dev server with hot reload at http://localhost:3000       |
| `npm test`          | Tests in watch mode (Vitest + Testing Library)            |
| `npm run test:ci`   | Tests once, for CI                                        |
| `npm run lint`      | ESLint                                                    |
| `npm run typecheck` | TypeScript type check                                     |
| `npm run build`     | Type check, then production build into `build/`           |
| `npm run preview`   | Serve the production build at http://localhost:3000       |

## Deploying

`npm run build` writes static files to `build/`. Because the app uses
client-side routing, the host must serve `index.html` for any path that is not
a file (an "SPA fallback"), otherwise refreshing `/logged-in` returns a 404.
For example, in nginx: `try_files $uri /index.html;`.

## Project layout

```
src/
  main.tsx                 entry point
  App.tsx                  providers + router
  router/                  routes, route guard, path constants
  session/                 username rules, character counting, script joiners, storage, user context
  features/                onboarding, landing and not-found pages
```
