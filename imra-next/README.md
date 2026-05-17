# IMRA — Next.js + Supabase

A complete luxury jewelry boutique built with **Next.js 14 (App Router)** and **Supabase**
(Postgres + Auth + Storage). Storefront, customer accounts, full admin dashboard, and
a French-localized interface in the IMRA gold-and-crimson aesthetic.

> Originally converted from a static HTML/CSS prototype (kept for reference in
> [`../archive/`](../archive/)).

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Getting started](#getting-started)
4. [Project structure](#project-structure)
5. [Database setup — full migration order](#database-setup--full-migration-order)
6. [Becoming an admin](#becoming-an-admin)
7. [Product images & Supabase Storage](#product-images--supabase-storage)
8. [Email configuration](#email-configuration)
9. [Deployment](#deployment)
10. [Common tasks](#common-tasks)
11. [Security checklist](#security-checklist)

---

## Features

### Storefront (`/`)
- 🛍️ Product grid fetched from Supabase, streamed via React Suspense with skeleton fallback
- 🔍 Product detail modal with image, description, stock status, qty selector, add-to-cart
- 🛒 Slide-in cart drawer with live count badge, localStorage persistence, qty controls
- 💳 Checkout flow with guest + optional account, atomic order creation via Postgres RPC
- ✉️ Auto-link guest orders to the right user when they sign up or sign in with the same email
- 📩 Contact form persisting to Supabase
- 📱 Mobile hamburger menu, responsive grids, touch-target sizing, iOS input-zoom prevention

### Customer account (`/account/*`)
- 📋 Order list with status pills, item count, summary line
- 🧾 Order detail page with status timeline (En attente → Confirmée → Expédiée → Livrée)
- 👤 Profile page: edit name/phone/address, change email (with confirmation), change password

### Admin dashboard (`/admin/*`)
- 📊 Dashboard with revenue KPIs (with month-over-month trends), 14-day revenue chart,
  donut chart of orders by status, top products, recent orders, "À traiter" action card
- 🛒 Products CRUD with image upload to Supabase Storage
- 📦 Orders management with visual status manager (steppers + primary actions, no dropdowns)
- 💬 Contact messages with read/unread filtering
- ❓ FAQs CRUD
- 📄 Site pages CRUD (Livraison & retours, Conditions générales, etc.)
- 🔎 Per-page search bar + status tabs + collapsible advanced filters (date range, price/total range, etc.)
- 🔒 Separate `/admin-login` screen with no marketing chrome
- 👤 Admin profile page

### Public info pages
- `/faq` — accordion fed from Supabase
- `/livraison-retours` — content from Supabase `site_pages` table
- `/conditions-generales` — same
- `/not-admin` — gracefully refuses non-admin users

### Auth (`/auth/*`)
- Sign-in, sign-up with email confirmation
- Branded confirmation email template ([supabase/email-templates/confirm-signup.html](supabase/email-templates/confirm-signup.html))
- `?email=` and `?redirect=` query params let other pages pre-fill / redirect

### Loading & UX
- Per-route `loading.tsx` files for instant route transition feedback
- Inline spinners on every submit button
- Toast notifications for user actions
- Full-page `AuthOverlay` for sign-in / sign-up / sign-out / admin-access transitions

---

## Tech stack

| | |
|---|---|
| **Framework** | Next.js 14.2 (App Router, Server Components, Server Actions) |
| **Language** | TypeScript (strict) |
| **Styling** | Plain CSS (single `globals.css`) — no Tailwind, kept the IMRA aesthetic 1:1 |
| **Database** | Supabase Postgres with Row Level Security |
| **Auth** | Supabase Auth (email/password, with `@supabase/ssr`) |
| **Storage** | Supabase Storage for product images |
| **State** | React Context (Cart, Auth, Toast) + URL search params (filters) |
| **Forms** | Server Actions (`'use server'`) — no API routes |
| **Fonts** | Cormorant Garamond + Poppins (Google Fonts) |

---

## Getting started

### Prerequisites
- Node.js 18.17+ (or 20+)
- A Supabase project ([supabase.com](https://supabase.com))

### Setup

```bash
cd imra-next
npm install
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Then run every SQL file from [Database setup](#database-setup--full-migration-order) below in order in your Supabase SQL editor.

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Project structure

```
imra-next/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout + fonts + Providers + Header + CartDrawer
│   ├── page.tsx                  # Home page
│   ├── globals.css               # All site styles (storefront + admin)
│   ├── loading.tsx               # Default loading screen
│   ├── providers.tsx             # Auth + Cart + Toast contexts
│   │
│   ├── account/                  # Customer area
│   │   ├── orders/               #   List + [id] detail
│   │   └── profile/              #   Edit name/email/password
│   │
│   ├── admin/                    # Admin dashboard
│   │   ├── layout.tsx            #   Sidebar + requireAdmin guard
│   │   ├── page.tsx              #   Dashboard with stats
│   │   ├── products/             #   CRUD (list / new / [id] / actions)
│   │   ├── orders/               #   List + [id] detail
│   │   ├── messages/             #   Contact submissions
│   │   ├── faqs/                 #   CRUD
│   │   ├── pages/                #   site_pages CRUD
│   │   └── profile/              #   Admin profile
│   │
│   ├── admin-login/              # Distinct admin sign-in screen
│   ├── auth/                     # Public login / signup / email-callback
│   ├── conditions-generales/     # Public legal page (DB-driven)
│   ├── faq/                      # FAQ accordion (DB-driven)
│   ├── livraison-retours/        # Shipping & returns (DB-driven)
│   └── not-admin/                # Access-refused page
│
├── components/                   # React components
│   ├── (storefront)              # Hero, Marquee, Features, ProductCard, ProductDetailModal,
│   │                             # Collections, About, Contact, ContactForm, Footer, etc.
│   ├── admin/                    # Admin-only UI (sidebar, charts, forms, filters)
│   ├── profile/                  # Profile form sections (personal info, email, password)
│   ├── AuthOverlay.tsx           # Full-page blocking loader
│   ├── CartDrawer.tsx            # Slide-in cart with checkout
│   ├── Header.tsx                # Marketing nav (hides on /admin)
│   ├── LoadingScreen.tsx         # Used inside loading.tsx files
│   ├── Reveal.tsx                # IntersectionObserver fade-in
│   ├── Spinner.tsx               # Inline circular spinner
│   └── SitePage.tsx              # Generic Supabase-page renderer
│
├── context/                      # React contexts
│   ├── AuthContext.tsx           #   wraps supabase.auth, auto-claims guest orders
│   ├── CartContext.tsx           #   reducer + localStorage persistence
│   └── ToastContext.tsx
│
├── lib/
│   ├── admin.ts                  # requireAdmin() server helper
│   └── supabase/                 # client.ts / server.ts / middleware.ts
│
├── middleware.ts                 # Refreshes auth session cookies
├── next.config.mjs               # Allows Supabase Storage as Image domain
├── netlify.toml                  # Netlify build config + Next plugin
│
├── public/                       # Static assets (logo bg, QR)
├── types/index.ts                # Product, CartItem, Order, OrderItem, Profile types
│
├── scripts/
│   └── upload-product-images.mjs # One-time helper to bulk-upload images to the bucket
│
└── supabase/                     # SQL migrations (run in order — see below)
    ├── schema.sql                # Canonical schema for fresh installs
    ├── setup-admin.sql           # Admin role + RLS extensions + admin_stats RPC
    ├── setup-product-images-bucket.sql
    ├── add-contact-messages.sql
    ├── add-content-pages.sql
    ├── add-claim-guest-orders.sql
    ├── add-profiles.sql
    ├── enhance-admin-stats.sql
    ├── fix-orders-rls.sql        # Patch — only needed if you ran the very first schema
    ├── fix-admin-stats.sql       # Patch — sparkline fix
    ├── migrate-product-image-urls.sql
    └── email-templates/
        └── confirm-signup.html   # Branded IMRA confirmation email
```

---

## Database setup — full migration order

Open Supabase → **SQL Editor** and run these files **in this order**.
Every file is idempotent — safe to re-run.

| # | File | What it does |
|---|---|---|
| 1 | [`schema.sql`](supabase/schema.sql) | Core tables: `products`, `orders`, `order_items`, `contact_messages`, `site_pages`, `faqs`. Plus the `create_order()` RPC and the seed of 6 products. |
| 2 | [`setup-admin.sql`](supabase/setup-admin.sql) | `admins` table, `is_admin()` helper, `grant_admin()` helper, admin-level RLS policies across all tables, `admin_stats()` RPC. |
| 3 | [`enhance-admin-stats.sql`](supabase/enhance-admin-stats.sql) | Extends `admin_stats()` with month-over-month trends, AOV, unique customers, pending counts, and a 14-day sparkline that always returns 14 rows. |
| 4 | [`setup-product-images-bucket.sql`](supabase/setup-product-images-bucket.sql) | Creates the `product-images` Storage bucket with public read + admin-only write. |
| 5 | [`add-profiles.sql`](supabase/add-profiles.sql) | `profiles` table with auto-create-on-signup trigger. |
| 6 | [`add-claim-guest-orders.sql`](supabase/add-claim-guest-orders.sql) | `claim_guest_orders()` RPC — links pre-existing guest orders to a freshly-signed-up user that matches their email. |

`add-contact-messages.sql`, `add-content-pages.sql` are bundled into `schema.sql`, so you only need them if you started from a very old schema before they were merged.

`fix-orders-rls.sql` and `fix-admin-stats.sql` are bug patches for installs that ran early versions of those files. Fresh installs don't need them.

`migrate-product-image-urls.sql` is for the optional one-time switch from local `/products/*.png` paths to bucket URLs (see [Product images](#product-images--supabase-storage)).

---

## Becoming an admin

1. Sign up a regular account through the site (e.g. `you@example.com`).
2. In the Supabase SQL editor, run:
   ```sql
   select public.grant_admin('you@example.com');
   ```
3. Visit `/admin`. You should see the dashboard.

If you visit `/admin` without being an admin, you'll be redirected to `/not-admin`.

---

## Product images & Supabase Storage

Images can live in either place. The codebase supports both:

- **Local** — drop a PNG into `public/products/` and reference it as `/products/foo.png`
- **Bucket** — upload to the `product-images` Supabase bucket and store the full public URL

To migrate the seeded local images to the bucket:

1. Run [`supabase/setup-product-images-bucket.sql`](supabase/setup-product-images-bucket.sql).
2. Either:
   - Drag-and-drop the 6 PNGs in **Supabase → Storage → product-images**, OR
   - Run the upload script:
     ```bash
     SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> node scripts/upload-product-images.mjs
     ```
3. Run [`supabase/migrate-product-image-urls.sql`](supabase/migrate-product-image-urls.sql) to rewrite the `image_url` column on existing rows.

After this, creating new products via the admin form automatically uploads to the bucket.

---

## Email configuration

Two layers:

### Branded template
Supabase → **Authentication** → **Email Templates** → **Confirm signup** → paste the contents of
[`supabase/email-templates/confirm-signup.html`](supabase/email-templates/confirm-signup.html).
Subject: `IMRA — Confirmez votre inscription`.

### Custom SMTP (production)
The default Supabase mailer is rate-limited (~3 emails/hour) and sends from `noreply@mail.app.supabase.io`. For production, configure custom SMTP in Supabase → **Project Settings** → **Authentication** → **SMTP Settings**. Recommendations: **Resend** (best DX, requires domain) or **Brevo** (works with a single verified Gmail address).

### When you deploy
Supabase → **Authentication** → **URL Configuration**:
- **Site URL**: your live domain (e.g. `https://imra.netlify.app`)
- **Redirect URLs**: add `https://your-domain/**` and keep `http://localhost:3000/**` for local dev.

---

## Deployment

See [`DEPLOY.md`](DEPLOY.md) for the full Netlify walkthrough including environment variables, build settings, and post-deploy Supabase URL configuration.

TL;DR for Netlify:
1. Push to GitHub.
2. Netlify → New site from Git → set base directory to `imra-next` if your repo root contains the `archive/` folder.
3. Add env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy. `netlify.toml` configures the Next.js plugin automatically.

---

## Common tasks

### Add a new product
- Admin route: `/admin/products/new` (visual form with image upload)
- Or via SQL: `INSERT INTO products (name, slug, price, image_url, ...) VALUES (...)`

### Add an admin
```sql
select public.grant_admin('email@example.com');
```

### Change order status
- Admin route: `/admin/orders/<id>` → click a step in the visual timeline, or use the primary CTA ("Marquer comme expédiée").

### Edit FAQ / legal pages
- Admin route: `/admin/faqs` or `/admin/pages` — full CRUD with HTML support for answers and page bodies.

### Inspect filters in the URL
All admin tables (`products`, `orders`, `messages`) read filters from query string:
`?q=...&status=pending&from=2026-01-01&to=2026-05-17&priceMin=10&priceMax=100`
Bookmarks and back-button work as filter undo.

---

## Security checklist

- [x] Service-role key is **not** used in any client or server code in this repo
- [x] Row Level Security enabled on every table
- [x] Storage uploads restricted to admins (`is_admin()` check)
- [x] Orders insert goes through `create_order()` SECURITY DEFINER RPC — totals computed server-side
- [x] Password change requires the current password (verified via `signInWithPassword`)
- [x] Email change requires confirmation at the new address before taking effect
- [x] All `.env*` files in `.gitignore`
- [ ] **Custom SMTP** — set up before going live (see [Email configuration](#email-configuration))
- [ ] **Site URL** — point to your real domain post-deploy
- [ ] **Service-role key rotation** — if you ever exposed it in shared documents/chat, regenerate it in Supabase → Settings → API

---

## License

Private project for IMRA Accessories.
