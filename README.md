# backendflare

Cloudflare Workers-compatible conversion of the existing backend from backender.

## What was converted

- Express server startup replaced by Cloudflare Worker entry: src/worker.js
- Route tree preserved (same endpoint paths) using Hono + an Express handler adapter
- Existing controllers, middleware, models, services, and utility business logic copied into this folder
- MongoDB Atlas usage preserved via mongoose with nodejs_compat runtime
- Admin/student/institute JWT auth and session validation flow preserved
- Existing payment routes and auth behavior preserved
- CORS origin allowlist preserved
- Payment create-order rate limiting preserved (Worker memory map, best-effort per isolate)
- Razorpay SDK config replaced with Worker-safe HTTP API client
- Email delivery utility replaced with Resend HTTP API (Worker-safe)
- PDF ticket generator replaced with pdf-lib implementation (Worker-safe)

## Folder structure

- src/: Worker runtime, route registration, compatibility adapter
- controllers/: copied business logic
- middleware/: copied auth middleware
- models/: copied mongoose schemas/models
- services/: copied services
- utils/: copied helpers (with Worker-compatible updates)
- config/: copied config (with Worker-compatible Razorpay client)

## Deploy prerequisites

1. Cloudflare account + Wrangler authenticated
2. MongoDB Atlas URI reachable from Cloudflare Workers
3. Resend API key for email sending

## Install

```bash
npm install
```

## Local dev

Create a `.dev.vars` file from `.dev.vars.example`, then run:

```bash
npm run dev
```

## Deploy

```bash
npm run deploy
```

## Required environment variables

Minimum required:

- MONGO_URI
- JWT_SECRET
- ADMIN_EMAIL
- ADMIN_PASS
- RAZORPAY_KEY
- RAZORPAY_SECRET
- RESEND_API_KEY

Common optional variables used by existing logic:

- RESEND_FROM
- EMAIL_PROVIDER (default: resend)
- CONTACT_RECEIVER_EMAIL
- SESSION_MANAGER_SECRET
- SESSION_MANAGER_URL
- SESSION_MANAGER_API_URL
- INTERNAL_API_SECRET
- SESSION_TTL_SECONDS
- SITE_URL
- VITE_API_URL
- SUMMER_HERO_IMAGE
- SUMMER_VENUE
- SUMMER_TIMING
- SUMMER_REPORTING
- SMTP_FROM
- SMTP_HOST
- SMTP_PORT
- SMTP_SECURE
- SMTP_USER
- SMTP_PASS
- BREVO_EMAIL
- BREVO_PASSWORD
- EMAIL
- EMAIL_PASS
- GMAIL_SMTP_HOST
- GMAIL_SMTP_PORT
- GMAIL_SMTP_SECURE
- MAIL_CONNECT_TIMEOUT_MS
- MAIL_GREETING_TIMEOUT_MS
- MAIL_SOCKET_TIMEOUT_MS

## Cloudflare secrets setup

Set sensitive keys with Wrangler:

```bash
wrangler secret put MONGO_URI
wrangler secret put JWT_SECRET
wrangler secret put ADMIN_PASS
wrangler secret put RAZORPAY_KEY
wrangler secret put RAZORPAY_SECRET
wrangler secret put RESEND_API_KEY
```

Non-sensitive defaults can go into wrangler.toml `[vars]`.

## Notes and limitations

- Worker in-memory rate limiting is isolate-local (not globally shared across all edge isolates).
- Email provider fallback to SMTP/Gmail was removed in Worker runtime; Resend is the delivery path.
- PDF rendering changed from HTML-to-PDF engine to programmatic PDF generation to stay Worker-compatible.
"# backend-cloudflare" 
