# Coy Discover

A mobile-first, swipe-based discovery prototype built as a standalone Coy SDE Intern assignment. It keeps Coy’s defining promise at the center: incoming likes remain private unless a like becomes mutual.

This is the assignment's hypothetical Discover extension, not a copy of Coy's current app. Coy's public product description says it is a double-blind matching tool for people who already know each other, with no profiles, photos, swiping, or chat. See [Part A product notes](ASSIGNMENT_SUBMISSION.md#5-part-a--coy-product-exploration).

## Project overview

Coy Discover gives a single demo user a curated deck of 30 fictional profiles. Like or pass with a swipe, drag, button, or keyboard arrow. Every decision is saved and removed profiles do not reappear after refresh. A mutual like triggers a celebration and puts that profile in Matches.

## Technology

- Next.js App Router, React, TypeScript
- Tailwind CSS 4 (with a small custom design system)
- Framer Motion and Lucide React
- Next.js route handlers for the JSON APIs
- Local JSON persistence for a zero-setup demo; Upstash Redis REST API for durable Vercel persistence
- Ready for Vercel deployment

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The demo has no sign-in. `Home` intentionally stays blank; use `Discover` to try the experience and `Matches` to see mutual connections. Profile IDs `profile-02`, `profile-05`, `profile-09`, `profile-14`, `profile-21`, and `profile-27` include seeded incoming likes on the server; those likes are not sent in feed responses.

Before you push the project, run the checks:

```bash
npm run lint
npm run test:api
```

`test:api` performs a production build and verifies the API and privacy behavior with an isolated temporary data file.

### Persistence

Without credentials, local development stores decisions in `data/swipes.json` (created automatically and excluded from Git). This is convenient for a single machine but is not durable on Vercel’s ephemeral serverless filesystem.

For persistent hosting without Supabase, connect an Upstash Redis database through the Vercel Marketplace (Storage / Redis). Add these two server-only variables to `.env.local` for local use or let the integration inject them into Vercel:

```text
UPSTASH_REDIS_REST_URL= "https://glorious-escargot-207135.upstash.io"
UPSTASH_REDIS_REST_TOKEN= "gQAAAAAAAykfAAIgcDE4NTAzODNmYzc4MGU0ZjBjYWNjZjBiMTkwMTllYzhmYQ"
```

Get the values from the Upstash database's REST connection details, or connect the database in Vercel so it injects them. Keep both values server-only; do not prefix them with `NEXT_PUBLIC_`. The assignment uses one demo identity and does not require external auth. Without these values, local development uses `data/swipes.json`; Vercel deliberately rejects writes instead of pretending its temporary filesystem is durable.

## Product features

- 30 distinct fictional profiles with age, portrait, bio, city, and interests.
- One profile at a time with responsive layout, touch drag, desktop buttons, and left/right arrow support.
- Like/pass overlays, motion-based transitions, feedback, loading skeleton, and finished-deck state.
- Mutual match celebration with a Matches view. Non-mutual incoming likes are never returned by an API.
- Blank Home tab and responsive desktop/mobile navigation.
- Duplicate swipe protection and persisted swipe history.

## API

All routes are same-origin Next.js APIs. Responses contain only public demo profile fields.

The assignment uses a single demo identity; no login or external auth is needed.

### `GET /api/feed`

Returns `{ "profiles": [...] }`, excluding every profile already swiped on by the demo user. Does not return incoming-like status or counts.

### `POST /api/swipe`

JSON body: `{ "profileId": "profile-02", "action": "like" }` (action may be `like` or `pass`). Returns `{ "ok": true, "matched": true|false }`; includes the matched profile only when `matched` is true. Returns 400 for invalid input, 409 for an already-swiped profile, 503 when Vercel has no persistent store configured, and 500 for storage errors.

### `GET /api/matches`

Returns `{ "matches": [...] }` containing mutual matches only.

## Checks

Run `npm run test:api` to build the app and run the API/privacy smoke tests. The test uses a temporary JSON file in the operating system temp folder and removes it afterward, so it does not change your local demo swipe history.

## Data architecture and privacy

Mock profile presentation data lives in `src/lib/profiles.ts`. In local mode, a server-only Node module persists swipes and matches to a JSON file. In Vercel mode, Upstash Redis stores per-user swipe hashes and match sets; an atomic Lua script prevents duplicate swipes and creates mutual matches. Incoming likes are held in server code and are only evaluated when saving a like. Browser code never imports the store or receives Redis credentials.

The demo profile catalogue and fictional incoming-like seeds live in server code; Upstash keys persist swipes and mutual matches. A production multi-user version should add auth, moderation, consent, retention, and rate limiting.

## Assignment submission

See [`ASSIGNMENT_SUBMISSION.md`](ASSIGNMENT_SUBMISSION.md) for the concise project write-up, setup, API/data/privacy details, and the two proposed Coy feature improvements. See [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) for step-by-step GitHub, Upstash, and Vercel setup plus live verification. Screenshots can be captured from the local app at desktop and mobile sizes. The original Coy OTP, email verification, invite, and extra-slots flows require a real account; the write-up does not claim those private flows were completed.

## Deployment

1. Push this folder to a public GitHub repository named `coy-discover`.
2. Import that repository in Vercel.
3. Connect Upstash Redis and verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are available in Vercel's Production environment.
4. Deploy and verify `/api/feed`, `/api/swipe`, `/api/matches`, and refresh persistence.

## License

Assignment prototype. All displayed people and biographies are fictional; portrait images are served from Unsplash.
