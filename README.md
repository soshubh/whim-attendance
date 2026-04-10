# WHIM Attendance

WHIM Attendance is a Next.js + Supabase attendance workspace for tracking check-ins, check-outs, leave, work-from-home days, and recurring weekly offs. It is built around a user-scoped dashboard, an onboarding/setup flow, and shortcut URLs that can be used from iPhone automations or other lightweight clients.

## What The App Does

- Authenticates users with Supabase email OTP and Google sign-in
- Creates a per-user dashboard with month-based attendance history
- Supports manual and automatic attendance events:
  - `IN`
  - `OUT`
  - `LEAVE`
  - `WFH`
- Generates two personal shortcut URLs for attendance automation:
  - office arrival
  - office leave
- Lets users configure recurring weekly offs and alternate weekday patterns
- Shows day-level detail in a right-side activity panel
- Supports deleting user-created activity directly from the selected-day panel

## Product Structure

### Main routes

- `/landing` and `/` for the marketing/entry experience
- `/get-access` for unauthenticated entry
- `/login`, `/signup`, `/forgot-password`, `/reset-password`
- `/setup` for onboarding and shortcut link generation
- `/dashboard` for the authenticated attendance workspace
- `/settings` for standalone settings access

### Main app areas

- `app/(marketing)` contains the public-facing marketing experience
- `app/(product)` contains authenticated flows and product UI
- `app/api` contains route handlers for attendance, setup, settings, shortcut logging, and bootstrap/admin support
- `lib` contains Supabase clients, auth helpers, settings parsing, env loading, and shared server utilities

## Core Flows

### Authentication

Users sign in through Supabase auth. The app supports:

- email OTP flow
- Google sign-in

On successful auth, the app ensures a `profiles` record exists for the user and uses that profile to track onboarding completion.

### Setup and Onboarding

When a user lands in the app for the first time:

1. a profile is created or updated
2. a per-user shortcut token is generated
3. the setup page exposes two shortcut URLs
4. completing setup marks `profiles.onboarding_completed = true`

If onboarding is incomplete, authenticated users are redirected to `/setup`.

### Dashboard

The dashboard loads:

- user profile details
- recent and surrounding month attendance logs
- attendance settings derived from user logs
- personal shortcut URLs for the in-dashboard setup panel

The dashboard includes:

- top panel
- left summary panel
- center month calendar
- right panel for setup, settings, and selected-day activity

### Shortcut Logging

Each user gets two personal URLs:

- `.../api/shortcut/log?token=...&event=IN`
- `.../api/shortcut/log?token=...&event=OUT`

The shortcut route validates the token, resolves the owning user, and inserts a row into `attendance_logs`.

## Attendance Model

The app stores attendance history in a user-scoped `attendance_logs` table. The main fields used by the product are:

- `user_id`
- `event_type`
- `event_time`
- `leave_category`
- `event_label`

Supported `event_type` values:

- `IN`
- `OUT`
- `LEAVE`
- `WFH`

Recurring weekly offs are represented as generated `LEAVE` rows with internal labels prefixed by:

```txt
AUTO_WEEKLY_OFF:RULE:
```

Those labels are used for settings/state reconstruction, but the UI hides the internal metadata from end users.

## Attendance Settings

Attendance settings are derived from and persisted back into attendance logs. The current settings model supports:

- recurring weekly off rules
- specific leave dates
- specific WFH dates

Recurring rules support:

- `every`
- `alternate`

Alternate patterns support:

- `first-third`
- `second-fourth`

## Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
ADMIN_PIN=
ADMIN_SESSION_SECRET=
```

### Notes

- `NEXT_PUBLIC_APP_URL` is used to generate absolute shortcut URLs
- `SUPABASE_SERVICE_ROLE_KEY` is required for admin inserts, token generation, onboarding updates, and settings reconstruction
- `ADMIN_PIN` and `ADMIN_SESSION_SECRET` are optional unless you use the legacy/admin bootstrap flow

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Scripts

- `npm run dev` starts the development server
- `npm run build` creates a production build
- `npm run start` starts the production server
- `npm run lint` runs ESLint

## Deployment

The app is designed to deploy cleanly on Vercel.

### Vercel environment variables

Set the same variables from `.env.local` in the Vercel project:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PIN`
- `ADMIN_SESSION_SECRET`

### Supabase Auth configuration

In Supabase Auth URL configuration, set:

- `Site URL` to your deployed app URL
- redirect URLs for:
  - your app root
  - `/auth/callback`

Example:

```txt
https://your-domain.com
https://your-domain.com/auth/callback
```

## Project File Map

### Product pages

- `app/(product)/dashboard/page.tsx`
- `app/(product)/dashboard/attendance-dashboard.tsx`
- `app/(product)/setup/page.tsx`
- `app/(product)/settings/page.tsx`

### Product UI

- `app/(product)/product.css`
- `app/foundation.css`

### Shared product logic

- `lib/auth.ts`
- `lib/attendance-settings.ts`
- `lib/env.ts`
- `lib/supabase-admin.ts`
- `lib/supabase-browser.ts`
- `lib/supabase-server.ts`

### API routes

- `app/api/attendance/route.ts`
- `app/api/attendance/[id]/route.ts`
- `app/api/settings/attendance/route.ts`
- `app/api/shortcut/log/route.ts`
- `app/api/setup/complete/route.ts`
- `app/api/bootstrap/route.ts`

## Design System Notes

The dashboard styling is token-first and driven through:

- `app/foundation.css` for shared color/radius/shadow tokens
- `app/(product)/product.css` for product-level component styling

Current theme model:

- base tokens = default/light theme
- `html[data-theme="dark"]` = dark theme override

Dashboard state cards such as present, leave, weekly off, and WFH are intended to read from shared CSS variables rather than ad hoc hardcoded colors.

## API Summary

### `GET /api/attendance?month=YYYY-MM`

Returns the authenticated user's logs for a month.

### `POST /api/attendance`

Legacy/admin-only insert route for manual `IN`/`OUT` events.

### `DELETE /api/attendance/:id`

Deletes a single user-owned attendance row when allowed by the product UI.

### `GET /api/settings/attendance`

Returns normalized attendance settings for the signed-in user.

### `POST /api/settings/attendance`

Persists recurring weekly offs, leave dates, and WFH dates by rewriting the corresponding user-scoped attendance state.

### `GET /api/shortcut/log`

Returns usage guidance for the shortcut URL.

### `POST /api/shortcut/log`

Accepts a tokenized shortcut request and stores an `IN` or `OUT` event for the owning user.

## Recommended Setup For iPhone Shortcut

Use the generated setup URLs as POST requests.

- arrival automation -> arrival URL with `event=IN`
- leave automation -> leave URL with `event=OUT`

The backend does not require additional JSON payload for the standard setup flow.

## Troubleshooting

### Missing environment variables

If the app throws during startup, check `lib/env.ts`. The project requires:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Redirect loops to setup

Check:

- the user has a `profiles` row
- `profiles.onboarding_completed = true`
- a `shortcut_tokens` row exists for the user

### Shortcut requests are failing

Check:

- `NEXT_PUBLIC_APP_URL` matches the deployed domain
- the shortcut URL token belongs to an active row in `shortcut_tokens`
- the request uses `event=IN` or `event=OUT`

## Status

This codebase is currently optimized around:

- a user-scoped attendance dashboard
- Supabase-backed auth and storage
- mobile-aware dashboard panels
- token-driven visual styling for the dashboard system
