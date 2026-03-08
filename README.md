# 🌙 Luma Nightlife

**Book tables. Discover promoters. Own the night.**

Miami · New York

---

## What is Luma?

Luma is a dual-mode nightlife booking platform built for:

- **Guests** — browse venues, book tables, apply promo codes, manage reservations
- **Promoters** — manage events, track guests, view analytics, run payout reports

Built as a mobile-first iPhone-style web app with a dark navy + gold promoter dashboard and a clean cream guest experience.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| Payments | Stripe Connect *(coming soon)* |
| SMS | Twilio *(coming soon)* |
| Email | Resend |
| Maps | Custom SVG + Mapbox GL JS |
| Deploy | Vercel |

---

## Architecture

```
luma/
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── LumaApp.jsx        # Main single-file React app
├── supabase/
│   └── functions/         # Deno Edge Functions
│       ├── get-venues/
│       ├── get-bookings/
│       ├── create-booking/
│       ├── validate-promo/
│       └── send-confirmation/
└── public/
```

---

## Supabase Edge Functions

| Function | Auth | Description |
|----------|------|-------------|
| `get-venues` | Public | Fetch active venues by metro/type |
| `get-bookings` | JWT Required | Fetch user's booking history |
| `validate-promo` | Public | Server-side promo code validation + pricing |
| `create-booking` | JWT Required | Create booking with tamper-proof server pricing |
| `send-confirmation` | Internal | Send branded confirmation email via Resend |

**Security:** All pricing is calculated server-side via Postgres functions. The frontend sends intent (venue, guests, date) — never amounts. Promo codes are validated and usage-tracked atomically.

---

## Database Schema

```sql
profiles        -- Auth users with role (guest/promoter/admin)
venues          -- Venue listings with metro, coords, pricing
bookings        -- Reservations with server-calculated pricing
promo_codes     -- Discount codes with usage limits
promo_redemptions -- Audit log of code usage
```

RLS policies ensure guests can only see their own bookings. Promo codes table is hidden from guests.

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-username/luma-nightlife.git
cd luma-nightlife
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your Supabase URL, anon key, and Stripe/Resend/Twilio keys.

### 3. Supabase Setup

Deploy edge functions:

```bash
supabase functions deploy get-venues
supabase functions deploy get-bookings
supabase functions deploy create-booking
supabase functions deploy validate-promo
supabase functions deploy send-confirmation
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Roadmap

- [x] Supabase auth (sign up / sign in / guest mode)
- [x] Real venue data from DB
- [x] Server-side promo code validation
- [x] Tamper-proof booking creation
- [x] Real booking history
- [x] Confirmation email (Resend)
- [ ] Stripe Connect payments
- [ ] Twilio SMS confirmations + check-in links
- [ ] QR code check-in screen
- [ ] Promoter real data (revenue, guest list from DB)
- [ ] Push notifications
- [ ] Production Mapbox map

---

## Monetization

| Stream | Amount |
|--------|--------|
| Platform fee per booking | 10% |
| Promoter subscription | $49–99/mo |
| Venue partnership | $199–499/mo |

---

Built by [Eric](https://twitter.com/yourhandle) · Act 60 · Puerto Rico 🇵🇷
<!-- deployed -->
