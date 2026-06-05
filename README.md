# RiseOS — Backend API

A REST API for the RiseOS habit-tracking mobile app, built with Next.js App Router and deployed on Vercel. Handles authentication, sleep, meal, and focus session logging for a React Native / Expo client.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| ORM | Prisma 7 (with `@prisma/adapter-neon`) |
| Auth | JWT — access token (15 min) + refresh token (7 days) |
| Password hashing | bcryptjs |
| Rate limiting | In-memory per-process (sliding window) |
| HTTP | Axios |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database
- Vercel CLI (optional, for local emulation)

### Install & Run

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

> Development server starts on `http://localhost:3000`.

### Environment Variables

Create a `.env` file in the project root with the following keys:

```env
DATABASE_URL=""
JWT_SECRET=""
JWT_REFRESH_SECRET=""
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon pooled URL recommended) |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |

> ⚠️ Never commit `.env` to version control. Add it to `.gitignore`.

---

## Project Structure

```
riseos-backup/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── focus/page.tsx
│   │   ├── meals/page.tsx
│   │   └── sleep/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── refresh/route.ts
│   │   │   └── me/route.ts
│   │   ├── focus/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── meals/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── sleep/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── summary/route.ts
│   │   └── health/route.ts
│   ├── generated/prisma/     # Auto-generated Prisma client output
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth-initializer.tsx
│   ├── date-picker.tsx
│   ├── providers.tsx
│   ├── charts/
│   │   ├── FocusChart.tsx
│   │   ├── MealChart.tsx
│   │   └── SleepChart.tsx
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── api.ts                # Axios instance + interceptors
│   ├── auth.ts               # JWT helpers (sign, verify, getAuthPayload)
│   ├── gap.ts
│   ├── prisma.ts             # Prisma client singleton
│   ├── rateLimit.ts          # In-memory sliding window rate limiter
│   ├── store.ts              # Zustand auth state (in-memory)
│   ├── streak.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── 20260523051522_init/
├── .env                      # Local env vars (not committed)
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## API Endpoints

### Auth

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Create account, returns tokens + user |
| `POST` | `/api/auth/login` | No | Login, returns tokens + user |
| `POST` | `/api/auth/refresh` | No | Rotate refresh token, returns new tokens |
| `POST` | `/api/auth/logout` | No | Revoke refresh token, clear cookie |
| `GET` | `/api/auth/me` | Bearer token | Returns current user |

### Resources

All resource endpoints require a valid `Authorization: Bearer <accessToken>` header.

| Method | Endpoint | Description |
|---|---|---|
| `GET / POST` | `/api/sleep` | List or create sleep logs |
| `PUT / DELETE` | `/api/sleep/[id]` | Update or delete a sleep log |
| `GET / POST` | `/api/meals` | List or create meal logs |
| `PUT / DELETE` | `/api/meals/[id]` | Update or delete a meal log |
| `GET / POST` | `/api/focus` | List or create focus sessions |
| `PUT / DELETE` | `/api/focus/[id]` | Update or delete a focus session |
| `GET` | `/api/summary` | Aggregated daily summary |
| `GET` | `/api/health` | Health check |

---

## Auth Flow

### Token types

| Token | Lifetime | Storage (mobile) | Storage (server) |
|---|---|---|---|
| Access token | 15 minutes | Zustand (in-memory only) | Stateless — not persisted |
| Refresh token | 7 days | `expo-secure-store` | `RefreshToken` table in PostgreSQL |

### Session lifecycle

1. **Register / Login** — server returns `{ accessToken, refreshToken, user }` in the JSON response body. No cookies are set for mobile clients.
2. **Mobile client** stores the refresh token in `expo-secure-store` (encrypted, device-native storage) and holds the access token in Zustand memory only.
3. **Every request** attaches `Authorization: Bearer <accessToken>` via an Axios request interceptor.
4. **On 401** — the Axios response interceptor reads the refresh token from `expo-secure-store`, calls `POST /api/auth/refresh` with `{ refreshToken }` in the body, receives a new access token and a rotated refresh token, saves the new refresh token back to `expo-secure-store`, updates Zustand state, and retries the original request. A module-level promise lock prevents concurrent refresh calls from firing multiple requests simultaneously.
5. **App foreground resume** — `AuthInitializer` re-validates the session by calling `POST /api/auth/refresh` directly (bypassing the Axios interceptor) to avoid re-entrant retry loops.
6. **Logout** — server deletes the `RefreshToken` record from the database. Client deletes the token from `expo-secure-store` and clears Zustand state.
7. **Token rotation** — every successful refresh issues a new refresh token and invalidates the old one in the database.

### Refresh token lookup

The refresh endpoint accepts the token from either:
- `req.cookies.get("refreshToken")` — for browser-based sessions
- `req.body.refreshToken` — for mobile clients (primary path)

---

## Database Schema

```
User
  id             String   @id @default(cuid())
  name           String
  email          String   @unique
  password       String   (bcrypt, cost 12)
  currentStreak  Int
  longestStreak  Int
  lastActiveDate DateTime?
  refreshTokens  RefreshToken[]
  sleepLogs      SleepLog[]
  mealLogs       MealLog[]
  focusSessions  FocusSession[]

RefreshToken
  id        String   @id
  token     String   @unique
  userId    String
  expiresAt DateTime

SleepLog      — durationHrs, energyLevel, logDay
MealLog       — mealType, name, calories?, logDay
FocusSession  — label, durationMins, completed, logDay
```

---

## Rate Limiting

All auth endpoints are rate-limited to **10 requests per minute per IP** using an in-memory sliding window. This resets on server restart and does not persist across Vercel function instances — suitable for development and low-traffic deployments. Replace with a Redis-backed solution (e.g., Upstash) for production scale.

---

## Related Repos

<!-- Add links to the React Native / Expo mobile client repo here -->
| Repo | Description |
|---|---|
| `riseos-backup` (this repo) | Next.js backend API, deployed on Vercel |
| [riseos-mobile](https://github.com/dheljohn/riseos-mobile)  | React Native + Expo mobile client |

---

## License

Private — all rights reserved.
