# Coy Discover deployment guide

This assignment needs one demo user and durable swipe history. Local development uses a JSON file; Vercel uses Upstash Redis. No Supabase project, SQL setup, or external auth is required.

## 1. Local setup

Use Node.js 20.9 or newer:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. Pass profile 01, then like profile 02 to see the seeded mutual match on a fresh local swipe file. The Home tab is intentionally blank.

## 2. Connect persistent storage in Vercel

1. Open your Vercel project and go to **Storage** (or **Infrastructure → Storage**).
2. Choose **Create Database → Upstash Redis** and complete the provider setup.
3. Connect the Redis database to this Vercel project and enable it for **Production** and **Preview** as needed.
4. Check **Settings → Environment Variables**. The integration should provide:

   ```text
   UPSTASH_REDIS_REST_URL
   UPSTASH_REDIS_REST_TOKEN
   ```

   If they were not added automatically, copy the REST endpoint and REST token from the Upstash database connection details and add those exact names manually. Keep both server-only; never add a `NEXT_PUBLIC_` prefix.

5. Redeploy after connecting storage or changing variables.

The app sends Redis commands through Upstash's HTTPS REST API. Swipes are stored in a per-demo-user hash; matches are stored in a set. One atomic Lua script records each swipe, rejects duplicates, and records a mutual match. There is no SQL schema to run.

## 3. Deploy this repository

The current GitHub repository is [Aman1238-Aman/Project-task-Aman](https://github.com/Aman1238-Aman/Project-task-Aman). Push new changes to `main`; if the repository is connected to Vercel, that push should start a deployment. If it is not connected, in Vercel choose **Add New → Project**, import this repo, keep the Next.js preset/root directory defaults, and deploy. Use the URL shown on the Vercel deployment page; an old alias may return `DEPLOYMENT_NOT_FOUND`.

## 4. Verify Like, Pass, and persistence

After the Vercel deployment is Ready:

1. Open `/api/feed`; a fresh database should return 30 profiles and no incoming-like fields.
2. In the app, pass profile 01 and like profile 02 on a fresh demo identity. The seeded mutual like should produce the match celebration.
3. Open Matches and confirm only the mutual profile appears.
4. Refresh. The swiped profiles should remain out of the feed, and the match should remain in Matches.
5. Repeating a swipe request for an already-swiped profile should return HTTP 409.

Example swipe request:

```json
{"profileId":"profile-02","action":"like"}
```

If Like or Pass reports that persistence is not configured, check that both Upstash variables exist for the Production environment and redeploy. Never paste Redis tokens into chat or commit them to GitHub.

## 5. Screenshots and Part A

Capture the local or live app in desktop, mobile, match, and Matches states, then save the files under `docs/screenshots/` as `discover-desktop.png`, `discover-mobile.png`, `match-celebration.png`, and `matches.png`. The original Coy OTP, email verification, invite, and extra-slots screens are private to Coy; capture those only from your own Coy account. This standalone prototype does not sign into Coy.
