# IMRA Accessories

A luxury jewelry boutique built with **Next.js 14** + **Supabase**, featuring a public
storefront, customer accounts with order tracking, and a full admin dashboard.

```
.
├── imra-next/   ← The live application. Start here.
├── archive/     ← Original static HTML/CSS prototype (reference only)
└── README.md    ← You are here
```

## Quick start

```bash
cd imra-next
npm install
cp .env.example .env.local       # add your Supabase URL + anon key
# Then run the SQL migrations in supabase/ (see imra-next/README.md)
npm run dev
```

Open <http://localhost:3000>.

## Documentation

- **[Full setup guide & feature list →](imra-next/README.md)**
- **[Deployment walkthrough (Netlify) →](imra-next/DEPLOY.md)**
- **[Database migrations →](imra-next/supabase/)**

## Status

| | |
|---|---|
| **Storefront** | Working — products, cart, checkout, accounts, contact form |
| **Customer area** | Working — orders, profile, password/email change |
| **Admin dashboard** | Working — KPIs, products/orders/messages/FAQs/pages CRUD, image uploads |
| **Email** | Branded template ready; custom SMTP recommended before going live |
| **Deployment** | Configured for Netlify (see `imra-next/netlify.toml`) |
