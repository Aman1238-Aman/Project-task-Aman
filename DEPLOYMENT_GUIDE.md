# Coy Discover deployment guide

This repository is ready for deployment. Use Supabase for durable swipes and matches; Vercel's local filesystem is temporary, so the JSON fallback is for local demos only.

## 1. Run and check the project locally

Install Node.js 20.9 or newer, then run these commands in PowerShell from the project directory:

```powershell
npm install
npm run test:api
npm run dev
```

Open `http://localhost:3000`. The `Home` page is intentionally blank. Test discovery and Matches. To demo a match, pass on the first profile (`profile-01`) and like the second (`profile-02`), which has a seeded incoming like.

## 2. Create a public GitHub repository

On GitHub, create a **public** repository named `coy-discover`. Leave the README, `.gitignore`, and license options unchecked because those files already exist here. From PowerShell in the project directory, publish this source:

```powershell
git add .
git commit -m "Build Coy Discover assignment"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/coy-discover.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub login. If Git reports that `origin` already exists, use `git remote set-url origin https://github.com/YOUR_GITHUB_USERNAME/coy-discover.git` before pushing.

The `.gitignore` excludes `.env*` (except `.env.example`), `.next`, `node_modules`, local swipe history, and Vercel metadata. Never commit a Supabase service role key.

## 3. Create Supabase, enable phone OTP, and seed the database

1. Create a Supabase project and wait until its database is ready.
2. Open **SQL Editor** in the Supabase dashboard.
3. Paste the full contents of `supabase/schema.sql` and run it once. It creates the four tables, enables RLS without public policies, seeds 30 fictional profiles and six private incoming likes, and installs an atomic server-only swipe RPC.
4. In **Authentication → Providers → Phone**, enable phone sign-in. Configure an SMS provider (for example, Twilio) and its credentials in Supabase. Supabase will not send real SMS until this is configured. Provider charges, country rules, and rate limits may apply. For development, Supabase also supports configured test phone numbers/codes.
5. In **Project Settings → API**, copy the Project URL, the publishable/anon key, and the `service_role` secret. The publishable key is designed for browser use with RLS; the service role is server-only.

Create `.env.local` from `.env.example` for local OTP login:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_SECRET
```

When the two `NEXT_PUBLIC_` values are present, the app requires a verified phone session and sends the user's number to Supabase Auth. The APIs verify the bearer token server-side and scope swipes/matches to that authenticated account. Without them, local development uses the assignment's single-user demo mode.

## 4. Import and configure Vercel

1. Sign into Vercel and choose **Add New → Project**.
2. Import the `coy-discover` GitHub repository.
3. Keep the framework preset on **Next.js**, root directory as `./`, and build command as `npm run build`.
4. Add all four environment variables above under **Settings → Environment Variables**. Add them to Production and Preview (and Development if desired). Redeploy after changing environment variables.
5. Deploy. Vercel should install from `package-lock.json` and run the Next.js build automatically.

Do not name the service secret `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`; any `NEXT_PUBLIC_` variable is exposed to browser code.

## 5. Verify the live deployment

After the deployment is Ready:

- Open the live app and confirm the Discover card and mobile navigation render.
- Verify that the phone form sends a code and accepts it, using a number configured with your SMS provider or a Supabase test number. Do not use a real user's phone without their consent.
- Open `/api/feed`; it should return 30 profiles for a fresh demo database and should not contain a `likedYou` field.
- Pass profile 01, then like profile 02. Confirm the “It’s a match” screen appears.
- Open Matches; only profile 02 should be listed.
- Refresh the app; profile 02 should remain out of Discover and stay in Matches.
- Like or pass another profile, then resend the exact same request to `/api/swipe`; the duplicate should receive HTTP 409.

For a fresh deployment, use this request body to verify duplicate protection (send it twice; first response 200, second response 409):

```json
{"profileId":"profile-02","action":"like"}
```

## 6. Add assignment screenshots

Run the app locally, then capture these views using Windows Snipping Tool or your browser screenshot tool and save them under `docs/screenshots/`:

- `discover-desktop.png`
- `discover-mobile.png`
- `match-celebration.png`
- `matches.png`

Update the screenshot section in `ASSIGNMENT_SUBMISSION.md` with the image paths before handing in the assignment.

Screenshots of the original Coy private OTP, email verification, invite, and extra-slots screens must come from your own Coy session. The prototype login here is for Coy Discover and cannot sign you into Coy's separate app.

## Troubleshooting

- **OTP code is not delivered:** confirm Phone Auth is enabled, the SMS provider is configured, and the number is in E.164 format (for India, `+91...`). Check provider delivery logs and Supabase rate limits.
- **Phone login works but swipes fail in Vercel:** check all four environment variables and confirm the SQL script ran on the same Supabase project.
- **Like/Pass returns a Vercel storage message:** the JSON file fallback is only for local development. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel, run `supabase/schema.sql` in that exact Supabase project, and redeploy. The public URL/anon key are additionally needed only if phone OTP login is enabled.
- **Changes do not appear:** redeploy after changing Vercel environment variables; environment changes do not alter an existing deployment.
- **Incoming likes are revealed:** the shipped APIs do not return them. Keep `incoming_likes` behind RLS with no client policies and never add its contents to feed responses.
- **Need to reset a demo:** in the Supabase SQL Editor, delete rows from `matches` and `swipes` for `user_id = 'demo-user'`. This is destructive; preserve any state you need first.
