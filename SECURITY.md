# Security & Operations

This document explains how to rotate secrets, harden the database, and create
the super-admin password. Do these steps in order before letting real users in.

> All `.env.local` values must also be set in **Vercel → Project → Settings → Environment Variables**, otherwise the deployed site will not pick them up.

---

## 1. Confirm `.env.local` is not in git

```bash
git ls-files | grep .env
```

If anything prints, that file is tracked. Remove it:

```bash
git rm --cached .env.local
echo ".env.local" >> .gitignore
git commit -m "Stop tracking .env.local"
```

Even if it's removed now, **assume the secrets in it have been leaked** and
rotate them (steps 2–4 below).

---

## 2. Rotate the Supabase service-role key

1. Open <https://supabase.com/dashboard> → your project → **Settings → API**.
2. Under **Project API keys**, click the **Reset** icon next to `service_role`.
3. Copy the new key.
4. Update `SUPABASE_SERVICE_ROLE_KEY` in:
   - Local `.env.local`
   - Vercel project env vars (Production + Preview + Development)
5. Redeploy on Vercel (it auto-redeploys when env vars change).

The `anon` (publishable) key does not need rotation as long as RLS is enabled
(see step 5).

---

## 3. Rotate the Groq API key

1. <https://console.groq.com/keys>
2. Delete the old key, create a new one.
3. Update `GROQ_API_KEY` in `.env.local` and Vercel.

---

## 4. Rotate `AUTH_SECRET`

This is the HMAC key that signs session cookies. Rotating it logs everyone out.

```bash
openssl rand -hex 32
```

Paste the new value into `AUTH_SECRET` in both `.env.local` and Vercel.

---

## 5. Set a strong super-admin password (hashed)

The current setup compares `ADMIN_PASSWORD` as plain text. We've added support
for `ADMIN_PASSWORD_HASH` (scrypt). When set, the plain password is ignored.

1. Choose a password ≥ 12 chars. Use a password manager.
2. Generate the hash:
   ```bash
   node scripts/hash-password.mjs "your-strong-password-here"
   ```
3. Output looks like `a4f3...c1b2:8e29...d4f7`. Copy the entire line.
4. In `.env.local` and Vercel:
   - Set `ADMIN_PASSWORD_HASH=<the-output>`
   - Delete or empty out `ADMIN_PASSWORD`
5. Redeploy.

To verify, sign in to `/admin/login` with the new password.

---

## 6. Lock down database access (RLS)

Run [`supabase/rls-hardening.sql`](supabase/rls-hardening.sql) in
**Supabase → SQL Editor**.

This drops the permissive policies and leaves RLS enabled with no public
policies, meaning the anon key cannot read `enrollments`, `admin_users`,
`attendance`, or `published_timetables`. The Next.js server uses the
`service_role` key, which bypasses RLS, so the app keeps working.

Verify:

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public';
```

All four tables should show `rowsecurity = true`.

---

## 7. Remove .env.local from any external services

If you ever pasted secrets into a chat, support ticket, screenshot, or
hosting-provider console (Hostinger, etc.), assume those copies are also
compromised and rotate again.

---

## What's already protected in code

- **Rate limiting**: `/api/auth/login` (10 attempts / 5 min), `/api/enroll`
  (5 / hour), `/api/extract-document` (20 / hour), `/api/visit-slots`
  (60 / 5 min). In-memory; resets on every deploy.
- **CSRF**: [src/middleware.ts](src/middleware.ts) blocks state-changing
  requests whose `Origin`/`Referer` does not match the app host.
- **File uploads**: MIME type and size enforced on enrollment uploads
  (8 MB) and document extraction (5 MB).
- **Generic error messages**: API routes no longer leak Supabase/Groq
  internals to clients.
- **Origin-allowed login**: HMAC-signed cookies, scrypt password hashing,
  constant-time comparisons.

## What's still recommended

- **Persistent rate limiting** (e.g., `@upstash/ratelimit`) — the in-memory
  limiter resets when Vercel restarts the function. Fine for casual abuse,
  insufficient for a determined attacker.
- **Backup the database** regularly via Supabase's automated backups.
- **Monitor logins** — Supabase logs every query; set up alerts on the
  `admin_users` table for unusual access patterns.
- **2FA on Supabase, Vercel, and your domain registrar** accounts.
