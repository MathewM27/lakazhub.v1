# Lakazhub

**Two-sided long-term rental marketplace for Mauritius**

Lakazhub connects landlords and tenants in a market where no centralised rental platform existed — listings were scattered across Facebook groups, WhatsApp chains, and word of mouth. Landlords manage properties and communicate with prospective tenants entirely within the platform. Tenants search, filter, and message landlords without either party ever sharing personal contact details.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat&logo=pwa&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

> **Status:** Live pilot paused pending business registration. Platform is fully operational.

---

## Preview

### Homepage

![Homepage](docs/screenshots/homepage.png)

*Landing page — role selection before authentication. User picks landlord or tenant before OAuth flow, which determines role assignment at signup.*

### Property Listings

![Property Listings](docs/screenshots/listings.png)

*Tenant-facing property browser — search by location, price range, and bedroom count. Results filtered client-side from a cached dataset.*

### Property View

![Property Detail](docs/screenshots/property-view.png)

*Full property detail — categorised room photos, amenities, utilities breakdown, monthly rent, security deposit, and direct message CTA.*

### In-app Messaging

![Messaging](docs/screenshots/messaging.png)

*Privacy-first conversation interface — landlord and tenant communicate entirely within the platform. No phone numbers or personal contact details exchanged.*

---

## What It Does

Long-term rental in Mauritius has no centralised platform. Landlords post on Facebook, tenants hunt across multiple groups, both parties share phone numbers with strangers before knowing if a property is even a fit.

Lakazhub solves both sides of that problem.

**For landlords:** Create an account, list properties with categorised room photos, set pricing and utilities, and manage availability. All tenant communication happens within the platform — no personal contact details exposed until both parties choose to share them.

**For tenants:** Browse verified listings, filter by location, price range, and bedroom count, view full property details including amenity and utility breakdowns, and message landlords directly. Install the platform as a PWA for a native-app-like experience without an app store.

---

## Architecture

Lakazhub is a Next.js PWA backed entirely by Supabase — database, auth, storage, and real-time subscriptions. There is no separate backend server; all data access goes through the Supabase client SDK and Next.js API routes for server-side operations.

```
┌─────────────────────────────────────────────────────────┐
│                  Next.js Application                     │
│                                                         │
│   ┌─────────────────┐      ┌─────────────────────────┐  │
│   │  Tenant Pages   │      │    Landlord Pages       │  │
│   │  /browse        │      │    /dashboard           │  │
│   │  /property/[id] │      │    /properties/manage   │  │
│   │  /messages      │      │    /messages            │  │
│   └────────┬────────┘      └────────────┬────────────┘  │
│            │                            │               │
│   ┌────────▼────────────────────────────▼────────────┐  │
│   │              Supabase Client SDK                 │  │
│   └──────┬──────────┬──────────┬────────────┬────────┘  │
└──────────┼──────────┼──────────┼────────────┼───────────┘
           │          │          │            │
    ┌──────▼──┐ ┌─────▼──┐ ┌────▼───┐ ┌──────▼──────┐
    │Postgres │ │  Auth  │ │Storage │ │  Realtime   │
    │(data)   │ │(OAuth) │ │(images)│ │(messaging)  │
    └─────────┘ └────────┘ └────────┘ └─────────────┘
```

**Why Supabase over a custom backend:** For a two-sided marketplace at this stage, the operational overhead of a custom backend server is unjustified. Supabase provides row-level Postgres with a REST API, OAuth, file storage, and WebSocket-based real-time subscriptions in one managed platform. The tradeoff is less control over query optimisation and scaling behaviour — an acceptable tradeoff for a product validating market fit.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth — email/password + OAuth (Google, Facebook, Apple) |
| Storage | Supabase Storage (property images) |
| Real-time | Supabase Realtime (WebSocket subscriptions) |
| Hosting | Vercel |
| PWA | Web manifest + service worker (cache-first) |

---

## Project Structure

```
lakazhub/
│
├── app/                          Next.js App Router
│   └── (dashboard)/
│       ├── (landing)/            Public marketing page + OAuth callback
│       ├── landlord-dashboard/   Landlord property management + messaging
│       └── tenant-dashboard/     Tenant property browsing + messaging
│
├── utils/
│   ├── types/                    TypeScript interfaces (Property, Profile, Conversation)
│   └── supabase/                 Supabase client + middleware configuration
│
├── public/
│   ├── manifest.json             PWA manifest
│   └── sw.js                     Service worker (cache-first)
│
└── middleware.ts                  Role-based route protection
```

---

## Local Development

### Prerequisites

- Node.js 18+
- A Supabase project (free tier is sufficient)

### Setup

```bash
git clone https://github.com/MathewM27/lakazhub
cd lakazhub
npm install
cp .env.example .env.local
```

Fill in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

```bash
npm run dev
```

> **Note:** Database schema was set up via the Supabase dashboard. SQL migration files for the full schema are not currently tracked in this repository — only the `add_phone_number` migration exists in code. A reproducible schema migration setup is a known improvement for a production relaunch.

---

## Validation and Pilot

Lakazhub was deployed and live in Mauritius. During a two-week pilot before pausing for business registration:

- **25+ tenant signups** with active browsing and search activity
- **2 landlords onboarded** with live property listings
- **In-platform messaging active** between landlords and tenants
- No financial transactions — the platform handled discovery and communication only

The platform is fully operational. Business registration requirements paused the rollout; the codebase is ready for relaunch.

---

## What I'd Build Next

The platform is functional at pilot scale. The changes required before handling real production load:

**Server-side filtering and pagination** — replace the full-table fetch with indexed Postgres queries, server-side filter parameters, and cursor-based pagination. Add Postgres full-text search on property name, description, and location.

**RLS policies in code** — migrate all row-level security policies out of the Supabase dashboard and into tracked SQL migration files. Currently the schema is not fully reproducible from the repository alone.

**Real-time availability for tenants** — add a Supabase Realtime subscription on the properties table so tenants see availability changes live rather than from a 30-minute cache.

**Role drift prevention** — add a Postgres trigger or Supabase Edge Function to keep `profiles.user_role` and `user_metadata.user_role` in sync, eliminating the risk of the two sources diverging.

**512×512 PWA icon** — add proper icon sizes and separate maskable/any entries for full Android launcher compatibility.

---

*Built by [Mathews Mwangi](https://mathewsmwangi.com) · [LinkedIn](https://linkedin.com/in/mathews-mwangi-972839219)*
