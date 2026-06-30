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
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx               # Root layout (ThemeProvider, AuthProvider)
│   │   ├── page.tsx                  # Root — redirects to /dashboard
│   │   ├── signin/
│   │   │   └── page.tsx              # Sign-in form
│   │   ├── (protected)/
│   │   │   ├── layout.tsx            # AdminGuard + sidebar + content area
│   │   │   ├── dashboard/
│   │   │   ├── merchants/
│   │   │   ├── transactions/
│   │   │   ├── reports/
│   │   │   ├── analytics/
│   │   │   └── admin/
│   │   │       ├── manage/
│   │   │       ├── team/
│   │   │       └── pending-merchants/
│   │   └── api/
│   │       ├── admin/
│   │       │   ├── check/
│   │       │   ├── manage/
│   │       │   ├── manage/[id]/
│   │       │   ├── team/
│   │       │   ├── team/positions/
│   │       │   ├── partners/
│   │       │   └── pending-merchants/
│   │       ├── dashboard/stats/
│   │       ├── merchants/list/
│   │       ├── transactions/list/
│   │       ├── reports/summary/
│   │       ├── users/list/
│   │       ├── users/toggle-status/
│   │       └── posthog/query/
│   ├── components/
│   │   ├── analytics/               # PostHog analytics components
│   │   ├── dashboard/               # StatsCards
│   │   ├── layout/                  # AdminGuard, AppSidebar
│   │   ├── reports/                 # ReportsSummary
│   │   ├── transactions/            # TransactionsTable
│   │   ├── ui/                      # shadcn/ui primitives
│   │   └── users/                   # UsersTable
│   ├── hooks/
│   │   ├── useAuth.tsx              # AuthProvider + useAuth hook
│   │   └── use-mobile.tsx           # Mobile breakpoint hook
│   └── lib/
│       ├── api.ts                   # apiFetch() — fetch with Bearer token
│       ├── posthog.ts               # posthogQuery() — HogQL query client
│       ├── supabase.ts              # Supabase client singleton + helpers
│       └── utils.ts                 # cn() classname merger
├── USER_GUIDE.md
├── DEVELOPER_GUIDE.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts (v4 in CSS)
└── .env.local
```

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client-side Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side Admin API key (keep secret) |
| `POSTHOG_PERSONAL_API_KEY` | Yes | PostHog personal API token for HogQL queries |
| `POSTHOG_PROJECT_ID` | Yes | PostHog project numeric ID |
| `NEXT_PUBLIC_POSTHOG_HOST` | Yes | PostHog instance host (e.g. `https://us.i.posthog.com`) |

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

## API Routes

### Auth & Admin

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/admin/check` | GET | Bearer token | Verify JWT + look up admin record; returns `{admin, user}` or `{error}` |
| `/api/admin/manage` | GET, POST | super_admin | List all admins with merchant counts; create new admin (creates auth user if not found) |
| `/api/admin/manage/[id]` | DELETE | super_admin | Delete an admin record |
| `/api/admin/partners` | GET, POST | super_admin | List partners; create partner (optionally auto-creates default "Admin" level-1 position) |
| `/api/admin/team` | GET, POST | partner_admin | List team members scoped by position level; add new team member |
| `/api/admin/team/positions` | GET, POST | partner_admin | List position levels for a partner; create a new position |
| `/api/admin/pending-merchants` | GET, POST, DELETE | partner_admin | CRUD for pre-registered merchant IDs |

### Business Data

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/dashboard/stats` | GET | All admins | Today's merchant count, user count, transaction volume by tag (QR/CASH/CREDIT) |
| `/api/merchants/list` | GET | All admins | List merchants (scoped by partner for non-super-admin) |
| `/api/transactions/list` | GET | All admins | List transactions from completed/cancelled/pending tables, deduplicated |
| `/api/users/list` | GET | All admins | List merchant users with profiles and ban status |
| `/api/users/toggle-status` | POST | super_admin | Ban/unban a user via `supabaseAdmin.auth.admin.updateUserById` |
| `/api/reports/summary` | GET | All admins | Filtered transaction list for reports (date range, merchant filter) |

### Analytics

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/posthog/query` | POST | All admins | Proxy HogQL queries to PostHog Query API |

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
3. The analytics page (`src/app/(protected)/analytics/page.tsx`) fires 5 HogQL queries in parallel:
   - **Stats**: `SELECT count(), uniq(distinct_id), countIf(event='$pageview') FROM events ...`
   - **Chart**: `SELECT toDate(timestamp), count() FROM events WHERE event='$pageview' GROUP BY day ...`
   - **Pages**: `SELECT properties.$current_url, count(), uniq(person_id) FROM events ...`
   - **Viewers**: `SELECT e.properties.$current_url, e.distinct_id, p.properties['email'] FROM events e LEFT JOIN persons p ON p.id = e.person_id ...`
   - **Events**: `SELECT e.event, e.properties, e.timestamp, e.distinct_id, p.properties['email'] FROM events e LEFT JOIN persons p ON p.id = e.person_id ...`

### Available HogQL tables

- `events` — raw event data (columns: `event`, `properties`, `timestamp`, `distinct_id`, `person_id`)
- `persons` — person profiles (columns: `id`, `properties`, `created_at`, `is_identified`)
- `sessions` — session data

Person properties like email are accessed via JOIN: `LEFT JOIN persons p ON p.id = e.person_id` then `p.properties['email']`.

### Analytics components

| Component | File | Purpose |
|---|---|---|
| OverviewCards | `src/components/analytics/OverviewCards.tsx` | 4 stat cards |
| PageViewsChart | `src/components/analytics/PageViewsChart.tsx` | Line chart (recharts) |
| EventsTable | `src/components/analytics/EventsTable.tsx` | Event stream with filter + search |
| PagesTable | `src/components/analytics/PagesTable.tsx` | Top pages with expandable viewer list |
| SessionsTable | `src/components/analytics/SessionsTable.tsx` | Recent sessions with browser/OS/location |

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
