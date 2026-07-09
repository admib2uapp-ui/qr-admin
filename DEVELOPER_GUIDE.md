# QR4POS Admin Panel — Developer Guide

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.9 (App Router) |
| Language | TypeScript |
| CSS | Tailwind CSS v4 + `tailwindcss-animate` |
| UI Library | shadcn/ui (Radix primitives) |
| Auth | Supabase Auth (client-side SDK + Admin API) |
| Database | Supabase PostgreSQL (shared with `qr-web-nextjs`) |
| Charts | Recharts |
| Analytics | PostHog (HogQL Query API) |
| Icons | Lucide React |
| Dates | date-fns |

## Project Structure

```
qr-web-admin/
├── public/
├── scripts/
│   └── create-super-admin.ts       # Bootstrap first super admin
├── public/                          # Static assets (manifest.json, sw.js, icons)
│   └── sw.js                        # Service worker for push notifications
├── scripts/
│   └── create-super-admin.ts        # Bootstrap first super admin
├── src/
│   ├── app/
│   │   ├── globals.css              # Tailwind v4 + glassmorphism styles
│   │   ├── layout.tsx               # Root layout (Geist fonts, metadata, manifest)
│   │   ├── page.tsx                 # Redirects to /dashboard
│   │   ├── signin/page.tsx          # Sign-in form
│   │   ├── forgot-password/page.tsx  # Password reset flow
│   │   ├── update-password/page.tsx  # Set new password after reset
│   │   ├── (protected)/
│   │   │   ├── layout.tsx           # AdminGuard + SidebarProvider
│   │   │   ├── dashboard/page.tsx   # Today's overview stats
│   │   │   ├── merchants/
│   │   │   │   ├── page.tsx         # Merchant/user list
│   │   │   │   └── [id]/page.tsx    # Merchant detail
│   │   │   ├── transactions/page.tsx# Transaction list with filters
│   │   │   ├── reports/page.tsx     # Reports with chart
│   │   │   ├── analytics/page.tsx   # PostHog analytics (4 tabs)
│   │   │   ├── helpdesk/page.tsx    # Support ticket management
│   │   │   └── admin/
│   │   │       ├── manage/page.tsx  # Super admin: manage admins
│   │   │       ├── partners/
│   │   │       │   ├── page.tsx     # Super admin: list partners
│   │   │       │   └── [id]/page.tsx# Super admin: partner detail
│   │   │       ├── team/page.tsx    # Partner admin: team & positions
│   │   │       ├── pending-merchants/page.tsx # Partner admin: pre-register IDs
│   │   │       ├── bank-keys/page.tsx       # Partner admin: API key management
│   │   │       └── soundbox-report/page.tsx # Super admin: TTS usage report
│   │   └── api/
│   │       ├── admin/
│   │       │   ├── check/route.ts   # GET — verify JWT
│   │       │   ├── manage/route.ts  # GET/POST — list/create super admins
│   │       │   ├── manage/[id]/route.ts # DELETE — remove admin
│   │       │   ├── partners/route.ts# GET/POST — list/create partners
│   │       │   ├── partners/[id]/route.ts # GET/PATCH/DELETE — partner detail
│   │       │   ├── team/route.ts    # GET/POST — team members
│   │       │   ├── team/positions/route.ts # GET/POST — position levels
│   │       │   ├── pending-merchants/route.ts # GET/POST/DELETE
│   │       │   ├── bank-keys/
│   │       │   │   ├── status/route.ts    # GET — check key status
│   │       │   │   ├── generate/route.ts  # POST — generate keys
│   │       │   │   └── rotate/route.ts    # POST — rotate webhook secret
│   │       │   └── soundbox-report/route.ts # POST — TTS report proxy
│   │       ├── dashboard/stats/route.ts # GET — today's stats
│   │       ├── merchants/list/route.ts  # GET — list merchants
│   │       ├── merchants/[id]/route.ts  # GET/PATCH — merchant detail
│   │       ├── transactions/list/route.ts # GET — list transactions
│   │       ├── reports/summary/route.ts  # GET — filtered report
│   │       ├── users/list/route.ts       # GET — list users
│   │       ├── users/toggle-status/route.ts # POST — ban/unban user
│   │       ├── posthog/query/route.ts    # POST — HogQL query proxy
│   │       └── helpdesk/
│   │           ├── tickets/route.ts      # GET — list tickets
│   │           └── tickets/[id]/
│   │               ├── route.ts          # GET/PATCH — ticket detail
│   │               └── reply/route.ts    # POST — admin reply
│   ├── components/
│   │   ├── analytics/              # 5 components (OverviewCards, PageViewsChart, EventsTable, PagesTable, SessionsTable)
│   │   ├── dashboard/              # StatsCards
│   │   ├── layout/                 # AppSidebar, AdminGuard, PwaSetup
│   │   ├── merchants/              # MerchantInfo, MerchantTransactions
│   │   ├── mobile/                 # 11 mobile-specific components
│   │   ├── partners/               # BankKeySection
│   │   ├── pwa/                    # InstallPWA
│   │   ├── reports/                # ReportsSummary
│   │   ├── transactions/           # TransactionsTable
│   │   ├── ui/                     # 16 shadcn/ui primitives (includes confirm-dialog)
│   │   └── users/                  # UsersTable
│   ├── hooks/
│   │   ├── useAuth.tsx             # AuthProvider + useAuth context
│   │   ├── use-mobile.tsx          # Mobile breakpoint hook (768px)
│   │   └── usePushNotifications.ts # VAPID push notification subscription
│   └── lib/
│       ├── api.ts                  # apiFetch() — Bearer token injection
│       ├── posthog.ts              # posthogQuery() — HogQL to PostHog API
│       ├── supabase.ts             # Supabase client + admin client
│       └── utils.ts                # cn() — clsx + tailwind-merge
```

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client-side Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side Admin API key (bypasses RLS, keep secret) |
| `POSTHOG_PERSONAL_API_KEY` | Yes | PostHog personal API token for HogQL queries |
| `POSTHOG_PROJECT_ID` | Yes | PostHog project numeric ID |
| `NEXT_PUBLIC_POSTHOG_HOST` | Yes | PostHog instance host (e.g. `https://us.i.posthog.com`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | For PWA | VAPID public key for push notification subscription |
| `SOUNDBOX_WORKER_URL` | For soundbox | URL of the Soundbox TTS worker |
| `SOUNDBOX_ADMIN_TOKEN` | For soundbox | Auth token for Soundbox worker API |
| `KEY_MANAGER_URL` | For bank-keys | URL of the bank-key-manager Cloudflare Worker |
| `KEY_MANAGER_API_KEY` | For bank-keys | Shared secret for key-manager worker auth |

## Auth Flow

### Client side (sign-in)

1. `AuthProvider` (in `src/hooks/useAuth.tsx`) wraps the app, listens to `onAuthStateChange`
2. User submits email + password → `supabase.auth.signInWithPassword()`
3. On success, the app calls `GET /api/admin/check` with the access token
4. If the response confirms admin privileges, the user is redirected to `/dashboard`
5. If not, the user is signed back out and shown "Access denied"

### Server side (JWT verification)

Every API route follows this pattern:

```typescript
const token = req.headers.get('authorization')?.replace('Bearer ', '');
const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

const { data: admin } = await supabaseAdmin
  .from('admins')
  .select('*')
  .eq('user_id', user.id)
  .single();
if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
```

The `supabaseAdmin` client uses the **service role key** (`SUPABASE_SERVICE_ROLE_KEY`) and bypasses RLS.

### Session persistence

- `AuthProvider` checks for an existing session on mount via `getSession()`
- On page refresh, the provider verifies the session and calls `/api/admin/check`
- `AdminGuard` in `(protected)/layout.tsx` blocks rendering until auth state is resolved

## Role System

### Roles

| Role | Description |
|---|---|
| `super_admin` | Full system access — sees all partners, all merchants, all transactions |
| `partner_admin` | Scoped to `partner_id` — sees only their partner's data |

### Position Level Hierarchy (partner admins only)

Partner admins have a `position_level_id` pointing to `position_levels`:

```
position_levels {
  id, partner_id, position (string), level (1-5)
}
```

- Level 1 = highest ("Admin" — created by default when partner is created)
- Level 5 = lowest
- An admin can only manage team members at **higher level numbers** (lower rank) than their own
- E.g., level 1 can add levels 2-5; level 3 can add levels 4-5

### Data Scoping

API routes scope queries to `admin.partner_id` when the admin is not `super_admin`. Examples:

```typescript
let query = supabaseAdmin.from('merchants').select('*');
if (admin.role !== 'super_admin' && admin.partner_id) {
  query = query.eq('partner_id', admin.partner_id);
}
```

## Database Schema

This admin panel shares a Supabase project with `qr-web-nextjs`. The relevant tables are:

| Table | Key Columns |
|---|---|
| `admins` | `id`, `user_id` (→ `auth.users`), `email`, `role`, `partner_id`, `position_level_id` |
| `partners` | `id`, `name` |
| `position_levels` | `id`, `partner_id`, `position`, `level` (1-5) |
| `profiles` | `id` (→ `auth.users`), `email`, `full_name`, `company_name` |
| `merchants` | `id`, `merchant_id`, `merchant_name`, `user_id`, `partner_id`, `is_active` |
| `admin_pending_merchants` | `id`, `admin_id`, `merchant_id` |
| `transactions` | Pending transactions |
| `completed_transactions` | Successful transactions |
| `cancelled_transactions` | Failed transactions |

**Key relationships:**
- `merchants.partner_id` → `partners.id` (merchants scoped by partner)
- `transactions.merchant_id` → `merchants.id`
- `admins.partner_id` → `partners.id`

All database schema migrations live in the `qr-web-nextjs` project (`supabase/migrations/`).

## API Routes (All 19)

### Auth & Admin Management

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/admin/check` | GET | Bearer token | Verify JWT + look up admin record |
| `/api/admin/manage` | GET, POST | super_admin | List/create super admins |
| `/api/admin/manage/[id]` | DELETE | super_admin | Delete a super admin |

### Partner Management (super_admin)

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/admin/partners` | GET, POST | super_admin | List partners with merchant/admin counts; create partner + default level-1 position + first admin |
| `/api/admin/partners/[id]` | GET, PATCH, DELETE | super_admin | Partner detail (admins, merchants, positions), rename, delete (checks constraints) |

### Partner Admin Scoped

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/admin/team` | GET, POST | partner_admin | List team members scoped by position level; add team member (enforces hierarchy) |
| `/api/admin/team/positions` | GET, POST | partner_admin | List/create position levels (1-5) for partner |
| `/api/admin/pending-merchants` | GET, POST, DELETE | partner_admin | CRUD pre-registered merchant IDs for auto-linking |
| `/api/admin/bank-keys/status` | GET | partner_admin | Check if API key + webhook secret exist on the bank's Cloudflare Worker |
| `/api/admin/bank-keys/generate` | POST | partner_admin | Generate new API key + webhook secret, push via key-manager worker |
| `/api/admin/bank-keys/rotate` | POST | partner_admin | Rotate webhook secret only (API key unchanged) |

### Soundbox Report

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/admin/soundbox-report` | POST | super_admin | Proxy report request to Soundbox worker at `/api/v1/report` |

### Business Data

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/dashboard/stats` | GET | All admins | Today's merchant count, user count, transaction volume/count by tag (QR/CASH/CREDIT), recent 5 transactions |
| `/api/merchants/list` | GET | All admins | List merchants (scoped by partner for partner_admin) |
| `/api/merchants/[id]` | GET, PATCH | All admins | Merchant detail with linked user, team, recent 10 transactions; update fields |
| `/api/transactions/list` | GET | All admins | Transactions from completed/cancelled/pending tables, deduplicated, filterable/sortable |
| `/api/users/list` | GET | All admins | List merchant users with profiles, merchants, ban status |
| `/api/users/toggle-status` | POST | super_admin | Ban/unban a user via `supabaseAdmin.auth.admin.updateUserById` |
| `/api/reports/summary` | GET | All admins | Filtered transaction list for reports (date range + merchant filter) |

### Helpdesk

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/helpdesk/tickets` | GET | All admins | List tickets with optional `?status=` filter, merchant name, message count |
| `/api/helpdesk/tickets/[id]` | GET, PATCH | All admins | Ticket detail with message thread + linked transaction; update status (open/resolved/closed) |
| `/api/helpdesk/tickets/[id]/reply` | POST | All admins | Add admin reply to a ticket |

### Analytics

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/posthog/query` | POST | All admins | Proxy HogQL queries to PostHog Query API |

## Helpdesk / Support Tickets

The helpdesk system lets admins manage support tickets submitted by merchant users.

### How it works

- Tickets are created by merchant users in the `qr-web-nextjs` app and stored in `helpdesk_tickets` table
- Admin panel displays tickets with status filters: All / Open / Resolved / Closed
- Each ticket has an original message, optional linked transaction, and a message thread
- Admins can reply to tickets (stored in `helpdesk_ticket_messages`)
- Admins can change ticket status (open → resolved/closed). Resolving/Closing deletes messages.
- Partner admins are scoped to tickets from their own partner's merchants

### API endpoints

- `GET /api/helpdesk/tickets?status=open` — list with optional filter
- `GET /api/helpdesk/tickets/[id]` — full detail with messages + transaction
- `PATCH /api/helpdesk/tickets/[id]` — update status
- `POST /api/helpdesk/tickets/[id]/reply` — add admin reply

### Relevant tables

- `helpdesk_tickets` — id, merchant_id, transaction_id, ticket_type, reason, status, created_at
- `helpdesk_ticket_messages` — id, ticket_id, sender_type (user/admin), message, created_at

## PostHog Analytics

The analytics page uses PostHog's **HogQL Query API** to pull data directly from ClickHouse.

### Configuration

```env
POSTHOG_PERSONAL_API_KEY=phx_...
POSTHOG_PROJECT_ID=474652
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### How it works

1. `src/lib/posthog.ts` — `posthogQuery()` sends a POST to `$POSTHOG_HOST/api/projects/$POSTHOG_PROJECT_ID/query/`
2. `POST /api/posthog/query` — server-side proxy that calls `posthogQuery()` with the admin's auth token
3. The analytics page fires 5 HogQL queries in parallel:
   - **Overview**: page views, unique visitors, sessions, total events (7/30/90 days)
   - **Chart**: page views over time (Recharts line chart)
   - **Pages**: top pages with view/visitor counts + expandable viewer list (email + distinct_id)
   - **Events**: raw event stream with type filter + text search
   - **Sessions**: recent `$pageview` events with browser, OS, IP, location

### Available HogQL tables

- `events` — raw event data (event, properties, timestamp, distinct_id, person_id)
- `persons` — person profiles (id, properties, created_at)
- `sessions` — session data

## Soundbox / TTS Report

Super admins can view TTS (text-to-speech) usage across partners. This is a proxy to the Soundbox Cloudflare Worker.

### API

`POST /api/admin/soundbox-report` — forwards request body to `SOUNDBOX_WORKER_URL/api/v1/report` with `Authorization: Bearer SOUNDBOX_ADMIN_TOKEN`

### Components

| File | Purpose |
|---|---|
| `src/app/(protected)/admin/soundbox-report/page.tsx` | Report page with search, summary cards, partner table |
| `src/components/mobile/MobileSoundboxReport.tsx` | Mobile variant |

## PWA & Push Notifications

The admin panel supports installable PWA and push notifications.

### Components

| File | Purpose |
|---|---|
| `public/manifest.json` | PWA manifest (name: "QR4POS Admin") |
| `public/sw.js` | Service worker (basic install + push event listeners) |
| `src/components/pwa/InstallPWA.tsx` | "Install App" prompt (beforeinstallprompt) |
| `src/components/layout/PwaSetup.tsx` | Initializes push notification subscription on mount |
| `src/hooks/usePushNotifications.ts` | Subscribes to VAPID push via `supabaseAdmin` and stores token in `admin_device_tokens` |

### Env

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
```

## Mobile Components

The admin panel has 11 mobile-specific components in `src/components/mobile/` for responsive design. Each major page conditionally renders a mobile variant using `useIsMobile()` (768px breakpoint).

| Component | Route | Purpose |
|---|---|---|
| `BottomNav.tsx` | — | Fixed bottom nav bar (role-based items) |
| `MobileHeader.tsx` | — | Fixed top header with sidebar trigger |
| `MobileBankKeys.tsx` | `/admin/bank-keys` | Bank key management (stacked layout) |
| `MobileHelpdesk.tsx` | `/helpdesk` | Ticket list + detail with reply |
| `MobileManageAdmins.tsx` | `/admin/manage` | Super admin management |
| `MobileMerchantDetail.tsx` | `/merchants/[id]` | Merchant detail |
| `MobileMerchants.tsx` | `/merchants` | Merchant/user list |
| `MobilePartnerDetail.tsx` | `/admin/partners/[id]` | Partner detail |
| `MobilePartners.tsx` | `/admin/partners` | Partners list |
| `MobileSoundboxReport.tsx` | `/admin/soundbox-report` | TTS report |
| `MobileTransactions.tsx` | `/transactions` | Transaction list with expandable rows |

## Database Schema

The admin panel shares a Supabase project with `qr-web-nextjs`. The relevant tables are:

| Table | Key Columns |
|---|---|
| `admins` | `id`, `user_id` (→ `auth.users`), `email`, `role`, `partner_id`, `position_level_id` |
| `partners` | `id`, `name` |
| `position_levels` | `id`, `partner_id`, `position`, `level` (1-5) |
| `profiles` | `id` (→ `auth.users`), `email`, `full_name`, `company_name` |
| `merchants` | `id`, `merchant_id`, `merchant_name`, `user_id`, `partner_id`, `is_active` |
| `admin_pending_merchants` | `id`, `admin_id`, `merchant_id` |
| `transactions` | Pending transactions |
| `completed_transactions` / `cancelled_transactions` | Settled/failed transactions |
| `helpdesk_tickets` | `id`, `merchant_id`, `transaction_id`, `ticket_type`, `reason`, `status` |
| `helpdesk_ticket_messages` | `id`, `ticket_id`, `sender_type`, `message` |
| `admin_device_tokens` | Push notification device tokens |

**Key relationships:**
- `merchants.partner_id` → `partners.id`
- `transactions.merchant_id` → `merchants.id`
- `admins.partner_id` → `partners.id`
- `helpdesk_tickets.merchant_id` → `merchants.id`

## Key Libraries & Utilities

### `apiFetch()` (`src/lib/api.ts`)

Wraps `fetch()` with automatic Bearer token injection from the current Supabase session.

```typescript
const res = await apiFetch('/api/merchants/list');
const data = await res.json();
```

### `AuthProvider` / `useAuth()` (`src/hooks/useAuth.tsx`)

React context providing:
- `user` — Supabase auth user or null
- `adminUser` — admin record from `admins` table or null
- `loading` — true while auth state is resolving
- `signOut()` — signs out and clears state
- `refreshAdmin()` — re-fetches admin record

### `supabaseAdmin` (`src/lib/supabase.ts`)

Server-side Supabase client using the **service role key**. Can bypass RLS and manage auth users.

## Bank Key Generation Flow

Partner admins can generate and rotate API credentials for their bank's Cloudflare Worker through the admin panel. No keys are stored in Supabase.

### Architecture

```
Partner Admin (browser)
  │  JWT auth
  ▼
Admin Panel API Route (Next.js server)
  │  POST /secrets/set (Authorization: Bearer KEY_MANAGER_API_KEY)
  ▼
bank-key-manager Worker (Cloudflare)
  │  PATCH /accounts/{id}/workers/scripts/{worker}/secrets
  ▼
Target Bank Worker (e.g., seylan-api)
```

### Components

| File | Purpose |
|---|---|
| `src/app/(protected)/admin/bank-keys/page.tsx` | Page — renders desktop or mobile component based on `useIsMobile()` |
| `src/components/partners/BankKeySection.tsx` | Desktop UI: masked key display, generate/rotate buttons, confirm dialogs |
| `src/components/mobile/MobileBankKeys.tsx` | Mobile variant with stacked layout |
| `src/components/ui/confirm-dialog.tsx` | Reusable overlay dialog matching qr-web-nextjs pattern |

### Key derivation rules

```typescript
// Worker name: lowercase, strip non-alphanumeric, append "-api"
workerName = partner.name.toLowerCase().replace(/[^a-z0-9-]/g, '') + '-api';
// e.g., "People's Bank" → "peoplesbank-api"

// API key name: remove apostrophes, replace non-alpha with underscore, uppercase, append "_API_KEY"
apiKeyName = partner.name.replace(/'/g,'').replace(/[^A-Za-z0-9]+/g,'_')...toUpperCase() + '_API_KEY';
// e.g., "People's Bank" → "PEOPLES_BANK_API_KEY"
```

### Security

- Keys are **never stored** in Supabase or the admin panel's database
- The Cloudflare Worker is the sole source of truth for its secrets
- The `KEY_MANAGER_API_KEY` shared secret authenticates the admin panel → key-manager
- The key-manager's `CLOUDFLARE_API_TOKEN` must have `workers.secret:write` permission
- Keys are displayed **once** after generate/rotate (with a copy button), then only `****` masks are shown

### Env setup

```env
KEY_MANAGER_URL=https://bank-key-manager.qr4pos.workers.dev
KEY_MANAGER_API_KEY=<shared-secret-matching-key-manager-QR_ADMIN_API_KEY>
```

## Setup

### Prerequisites

- Node.js 20+
- npm
- Access to the shared Supabase project with `SUPABASE_SERVICE_ROLE_KEY`

### First-time setup

```bash
cp .env.example .env.local
# Fill in environment variables
npm install
npm run dev
```

### Creating the first super admin

```bash
npx tsx scripts/create-super-admin.ts admin@example.com mypassword
```

This creates an auth user, a profile, and an admin record with `role: 'super_admin'`.

### Adding subsequent admins

Use the **Manage Admins** page (`/admin/manage`) — super admins can add both super admins and partner admins. New admins receive the temporary password `123456`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npx tsc --noEmit` | Type-check without emitting |
| `npx tsx scripts/create-super-admin.ts <email> <password>` | Bootstrap the first super admin |
