# springjwtrole-front

React / TypeScript login UI for [springjwtrole](https://github.com/izi4eve/springjwtrole) backend.
Minimal, clean, ready to extend into any SPA application.

---

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router v7

---

## Features

- Login page with JWT authentication
- Protected routes (redirect to login if not authenticated)
- Global auth state via React Context
- Account page showing email and role
- Logout
- Proxied API requests to Spring backend (no CORS issues in dev)
- Dark theme UI out of the box

---

## Connects To

→ [springjwtrole](https://github.com/izi4eve/springjwtrole) — Java/Spring Boot backend

The backend must be running on `http://localhost:8080` before starting this app.

---

## Quick Start (macOS / zsh)

### Prerequisites

- Node.js 20+: `brew install node`

### 1. Clone and install

```zsh
git clone https://github.com/izi4eve/springjwtrole-front.git
cd springjwtrole-front
npm install
```

### 2. Start the backend first

Make sure [springjwtrole](https://github.com/izi4eve/springjwtrole) is running on port 8080.

### 3. Run

```zsh
npm run dev
```

Open: [http://localhost:5173](http://localhost:5173)

Log in with the superuser credentials you configured in the backend's `application.properties`.

---

## Project Structure

```
src/
├── api/
│   └── auth.ts           # login() fetch call, AuthResponse type
├── context/
│   └── AuthContext.tsx   # Global auth state (token, user, signIn, signOut)
├── components/
│   └── ProtectedRoute.tsx # Redirects to /login if not authenticated
├── pages/
│   ├── LoginPage.tsx     # Login form
│   └── AccountPage.tsx   # User account info + logout
├── App.tsx               # Router + AuthProvider
└── main.tsx
```

---

## How Auth Works

1. User submits email + password on `/login`
2. React calls `POST /api/auth/login` on the Spring backend
3. Backend validates credentials and returns `accessToken` + `refreshToken`
4. Token is stored **in memory** (React state via Context) — not in localStorage
5. All protected routes check for token presence via `ProtectedRoute`
6. On logout, token is cleared from memory and user is redirected to `/login`

> Token lives only during the browser session. On page refresh the user needs to log in again.
> For persistent sessions, httpOnly cookie support can be added to the backend.

---

## Extending This Project

This is a starting point. To build your application:

1. Add new pages to `src/pages/`
2. Add new API calls to `src/api/`
3. Add routes in `App.tsx`
4. Use `useAuth()` hook anywhere to get the current user and token:

```typescript
const { user, token } = useAuth()

// Authenticated fetch example:
const res = await fetch('/api/your-endpoint', {
  headers: { Authorization: `Bearer ${token}` }
})
```

---

## Build for Production

```zsh
npm run build
```

Output goes to `dist/`. Can be served as static files via Spring Boot or any CDN.

---

## License

For informational purposes only.
Practical and commercial use requires permission from the author.