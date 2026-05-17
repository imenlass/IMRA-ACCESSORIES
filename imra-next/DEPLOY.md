# Deploying IMRA to Netlify (with branded emails)

The default Supabase confirmation email goes to `http://localhost:3000` because the **Site URL** in your Supabase project still points there. It also looks plain because it uses Supabase's default mailer (`noreply@mail.app.supabase.io`).

There are 4 things to do — 3 in Supabase, 1 in Netlify.

---

## 1. Deploy to Netlify

1. Push `imra-next/` to a GitHub repo.
2. In Netlify, **Add new site → Import an existing project → GitHub**, pick the repo.
3. Set the base directory to `imra-next` if your repo also contains the old HTML at the root. Otherwise leave blank.
4. Netlify auto-detects Next.js. Build command: `npm run build`. Publish dir: `.next`.
5. **Add environment variables** under *Site settings → Environment variables*:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://ddthcksdcnvjpwlidzrp.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(your anon key)* |

6. Deploy. You'll get a URL like `https://imra-luxe.netlify.app`. **Note this URL** — you'll need it below.

The included [`netlify.toml`](netlify.toml) handles the `@netlify/plugin-nextjs` plugin so SSR + server components + middleware all work.

---

## 2. Fix the confirmation link → point to your Netlify URL

In the Supabase dashboard:

**Authentication → URL Configuration**

- **Site URL**: `https://imra-luxe.netlify.app` (your Netlify URL — no trailing slash)
- **Redirect URLs** (one per line, click *Add URL*):
  - `https://imra-luxe.netlify.app/**`
  - `http://localhost:3000/**` *(keep this so local dev still works)*

Save. New confirmation emails will now link to your Netlify domain.

> **Why both?** The "Site URL" is the default fallback in emails. The "Redirect URLs" allow-list controls which URLs Supabase will actually redirect to after auth. The `/**` wildcard covers `/auth/callback`, `/account/orders`, etc.

---

## 3. Replace the default email template with the IMRA-branded one

The email you got was a generic Supabase template. To switch to the gold/crimson IMRA template:

**Authentication → Email Templates → Confirm signup**

1. Toggle **Enable email template** if not already on.
2. Replace the HTML body with the contents of [`supabase/email-templates/confirm-signup.html`](supabase/email-templates/confirm-signup.html). The `{{ .ConfirmationURL }}` variable is filled in automatically — leave it.
3. Set the **Subject** to: `IMRA — Confirmez votre inscription`
4. Save.

You can repeat this for *Magic Link*, *Reset Password*, *Invite user* etc. when you need them.

---

## 4. (Strongly recommended) Use a custom SMTP — your own sender, no rate limit

Supabase's default mailer is meant for dev only:

- Sender is hardcoded to `noreply@mail.app.supabase.io` (you saw this in the screenshot)
- Hard cap of ~**3–4 emails/hour per project**
- High chance of landing in spam

For production with your own sender like `noreply@imra-accessories.com`, set up custom SMTP.

The easiest option is **Resend** (free 3,000 emails/month, 100/day):

1. Sign up at [resend.com](https://resend.com).
2. Add and verify your domain (DNS records — takes ~10 min).
3. Create an API key.
4. In Supabase: **Authentication → SMTP Settings** → enable custom SMTP and fill in:
   - **Sender email**: `noreply@imra-accessories.com` (must be on the verified domain)
   - **Sender name**: `IMRA Accessories`
   - **Host**: `smtp.resend.com`
   - **Port**: `465`
   - **Username**: `resend`
   - **Password**: *(your Resend API key)*
5. Save → send a test email.

Alternatives if you don't want to verify a domain right now:
- **Brevo (ex-Sendinblue)** — 300 emails/day free, allows free sender addresses.
- **SendGrid** — 100/day free.
- **Mailgun** — 100/day free for 30 days then pay.

All four work the same way: paste host/port/username/password into Supabase's SMTP settings.

---

## 5. Smoke-test after deploy

1. Go to `https://imra-luxe.netlify.app/auth/signup` and create a new account.
2. The confirmation email should:
   - Come from `noreply@imra-accessories.com` (if you set up SMTP) or `noreply@mail.app.supabase.io` (default)
   - Look like the IMRA template (gold logo on crimson card)
   - Have a *Confirmer mon email* button linking to `https://imra-luxe.netlify.app/auth/callback?...`
3. Click it → you should land on `/account/orders` already signed in.
4. Add something to cart → check out → row appears in Supabase's `orders` table with your `user_id` populated.

---

## Notes

- No code changes are required for any of this. [`signup/page.tsx`](app/auth/signup/page.tsx) uses `window.location.origin` for the `emailRedirectTo`, and [`auth/callback/route.ts`](app/auth/callback/route.ts) uses the incoming request origin — both adapt automatically to wherever you deploy.
- If you later add a custom domain in Netlify (e.g. `imra-accessories.com`), repeat **Step 2** with the new domain (or just add it to the Redirect URLs allow-list; you can keep the Netlify URL too).
- Keep your `service_role` key out of all this. Netlify env vars, Supabase SMTP password — neither should ever be that key.
