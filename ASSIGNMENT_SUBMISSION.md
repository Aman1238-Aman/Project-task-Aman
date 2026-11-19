# Coy SDE Intern Assignment — Coy Discover

## 1. Introduction

Coy Discover is a standalone, mobile-first prototype for the assignment's proposed **new Discover tab**. It adds profile discovery while keeping incoming likes private until there is a mutual like.

Coy's current public product is a double-blind way to find out whether someone you already know likes you back. Coy's own explanation says it has no profiles, photos, swiping, or chat. This project follows the assignment's hypothetical Discover extension; it does not present swiping as part of Coy's current product. [Coy: How it works](https://getcoy.com/blog/how-coy-works)

## 2. Objectives

- Make discovering people feel clear, warm, and low-pressure.
- Support one-profile-at-a-time browsing with touch and desktop controls.
- Keep pass/like history across reloads and prevent profiles from returning.
- Create matches only from mutual likes; never expose unmatched incoming likes.

## 3. Technology stack

Next.js App Router, React, TypeScript, Tailwind CSS 4, Framer Motion, Lucide React, Node.js route handlers, local JSON persistence for development, Upstash Redis REST for Vercel, and Vercel deployment support.

## 4. Application features

- 30 fictional profiles with name, age, portrait, short bio, city, and interests.
- Responsive Home / Discover / Matches navigation. Home is intentionally blank.
- Drag gestures, Like and Pass buttons, keyboard controls, animated swipe labels, and action feedback.
- Loading and completed-deck states, mutual-match celebration, and matches gallery.
- Seeded incoming likes for a match demo, held on the server.
- Single-user demo identity as specified in the assignment; no external auth required.
- Atomic Upstash Redis Lua swipe/match write and duplicate prevention.

## 5. Part A — Coy product exploration

### Public product review

The public app URL returned only a “Coy Loading” shell in this environment; I could not reach the signed-in OTP flow. I have not claimed to complete phone verification, adding a crush, email verification, the invite flow, or the extra-slots screen. These notes come from Coy's public pages and should be checked against the signed-in app before final submission.

- Coy asks members to add people they already know using a phone number, email, or both. A phone and email for the same person use one slot; the list is private to its owner. [How Coy works](https://getcoy.com/blog/how-coy-works)
- Adding is consequential: the recipient can receive an anonymous heads-up; removing an entry leaves its slot locked for 30 days. [Coy Terms](https://getcoy.com/terms)
- Email is optional and described as a verified contact method in Settings. [How Coy works](https://getcoy.com/blog/how-coy-works)
- Coy's public invite offer says one slot is earned after three invited friends join and add a crush. [Coy home page](https://getcoy.com/)
- The public page lists extra-slot packs at ₹49, ₹129, and ₹199. No purchase was made; confirm these against the in-app screen when you submit. [Coy home page](https://getcoy.com/)

### Hands-on checklist for your own account

Use your own phone and email on the actual app. Never share an OTP or account secret here. Only enter another person's contact details if you have the required permission and are comfortable triggering Coy's anonymous heads-up.

| Flow | Record during your session |
|---|---|
| Phone OTP login | Screen sequence, resend timing, errors, and what happens after verification. |
| Add a crush | Required fields, validation, duplicate handling, slot count, and final-send warning. Do not send a test invite to an unsuspecting contact. |
| Email verification | Where email is added, verification method, pending/verified states, and recovery if the message is delayed. |
| Invite link | Copy/share controls, what the recipient sees, and how invite-credit progress is explained. |
| Extra slots | Pack sizes, displayed price, payment options, and how to leave without buying. |

Replace the public-review notes if your hands-on observations differ. The feature proposals below are grounded in the public flow and should be checked against your session.

## 6. UI screenshots

Capture these after running `npm run dev` at `http://localhost:3000` (demo mode works without auth keys; use an isolated demo dataset):

- **Discover:** desktop view with the profile card and privacy panel.
- **Mobile Discover:** narrow viewport with the card and bottom navigation.
- **Match:** like an incoming-like profile (`profile-02`, `profile-05`, `profile-09`, `profile-14`, `profile-21`, or `profile-27`).
- **Matches:** open Matches after a mutual like.

Save them under `docs/screenshots/` as described in [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md), then replace this note with the image links before submission. The repository currently does not include screenshot files; do not present mockups as captured app screenshots.

## 7. Backend API

| Method and path | Behavior |
|---|---|
| `GET /api/feed` | Returns profiles not yet swiped on. Does not reveal incoming-like state. |
| `POST /api/swipe` | Accepts `{ profileId, action }`; validates input; persists like/pass; returns `matched`. Duplicates return HTTP 409. |
| `GET /api/matches` | Returns mutual matches only. |

Invalid JSON or values return HTTP 400. Storage failures return HTTP 500. Profile IDs are validated against the seeded catalogue.

## 8. Database architecture

Local demo mode stores history in `data/swipes.json`. For persistent hosting without Supabase, connect Upstash Redis in Vercel and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Swipe hashes and match sets are stored server-side; an atomic Lua operation prevents duplicate swipes and records a match only for a seeded mutual like.

## 9. Privacy implementation

The assignment uses one demo identity. The feed excludes profiles already swiped on and returns no “liked you” flag, incoming count, or hidden-like list. Incoming-like fixtures are server-only; a Like checks them only while recording the action and returns a match only if mutual. `/api/matches` reads persisted matches only. Redis credentials remain server-side; when Redis is not configured in Vercel, writes fail with an explicit setup message rather than claiming persistence.

## 10. GitHub repository URL

To be filled after publishing the public `coy-discover` repository.

## 11. Live Vercel URL

To be filled after deployment and production verification.

## 12. Setup and checks

```bash
npm install
npm run dev
```

Run `npm run lint` and `npm run test:api` before submission. The API smoke test builds the app and checks feed privacy, mutual matching, swipe persistence, pass/like behavior, concurrent duplicate prevention, and invalid requests. Hosted persistence setup is in [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md).

## 13. Two feature suggestions for Coy

These are proposals based on the documented contact, invite, and slot flows. Verify they are not already present in the signed-in app before presenting them as gaps.

### A. Contact-safety review before the final add

Before committing an add, show the normalized contact method(s), whether the user's own email is verified when relevant, the slot being used, and the consequence that an anonymous heads-up is sent and the add cannot simply be undone. Let the user edit the contact before confirming; do not provide a post-send undo that could be abused to test identities.

**Why it helps:** a wrong number or email can trigger an unwanted message, and removing an entry leaves a slot locked. A clear preflight catches typos and channel mistakes before the send while preserving the double-blind rule. Coy supports phone, email, or both in one slot, so the review can explain the contact-coverage choice. [Coy Terms](https://getcoy.com/terms), [How Coy works](https://getcoy.com/blog/how-coy-works)

### B. Privacy-preserving invite reward progress

Show the invite rule as aggregate progress, such as “2 of 3 qualifying joins,” with the next step needed to earn a slot. Do not show invitees' names, their crushes, or whether anyone likes the user. Keep copy/share easy and explain that the friend must join and add a crush for the invite to qualify.

**Why it helps:** invite credit requires multiple steps, so users can be unsure whether sharing alone earns the reward. Clear progress can reduce confusion and support requests without exposing invitees' activity or compromising Coy's privacy promise. [Coy home page](https://getcoy.com/), [Coy Privacy Policy](https://getcoy.com/privacy)

Both proposals preserve the double-blind model. Validate the signed-in app does not already provide these controls, then test comprehension and accidental-add rates before shipping.
