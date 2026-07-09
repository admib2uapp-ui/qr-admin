# QR4POS Admin Panel — New Features Roadmap

Priority order: **P0** (high impact, core missing), **P1** (medium impact), **P2** (nice to have).

---

## ✅ 0. Bank API Key Management

**Status:** Live — built for partner admins.

Partner admins can generate and rotate their bank worker's API keys directly from the admin panel. Keys are pushed to the target Cloudflare Worker via a dedicated key-manager worker. No keys are stored in the database.

### What was built
- New `/admin/bank-keys` page for partner admins
- "API Keys" nav item in sidebar (Company section)
- 3 API routes: `/api/admin/bank-keys/status` (GET), `/api/admin/bank-keys/generate` (POST), `/api/admin/bank-keys/rotate` (POST)
- `BankKeySection` component (desktop) + `MobileBankKeys` component (mobile)
- `ConfirmDialog` reusable overlay component
- `bank-key-manager` Cloudflare Worker (separate service in `qr-backend/key-manager/`)

---

## ✅ 1. Merchant Detail & Edit Page

**Status:** Live

A clickable merchant detail page at `/merchants/[id]` showing business info, linked user, team members, recent transactions (10), and inline editing for merchant name.

### Implemented
- `GET /api/merchants/[id]` — returns merchant details + linked profile + team + recent 10 transactions
- `PATCH /api/merchants/[id]` — update merchant_name, partner_id
- `/merchants/[id]/page.tsx` — detail page with MerchantInfo + MerchantTransactions components
- Mobile variant at `MobileMerchantDetail.tsx`
- Partner admins scoped to their own merchants

---

## 2. P0 — Merchant Payment / Subscription Management

### Description
Add a "Subscriptions" section showing each merchant's payment status, due dates, missed days, and payment history. Allow admins to manually update payment status or add a payment record.

### Why
The DB already tracks `payment_status`, `payment_due_time`, `consecutive_missed_days`, and `payment_history`. Without an admin UI, this data is invisible and unusable. This is critical if merchants pay a daily fee.

### Files to create/modify

**New API route: `src/app/api/merchants/payments/route.ts`**
```
GET  /api/merchants/payments → list all merchants with payment status, filterable by status
```

**New API route: `src/app/api/merchants/[id]/payments/route.ts`**
```
GET    /api/merchants/[id]/payments → payment history for a merchant
POST   /api/merchants/[id]/payments → record a manual payment (amount, notes)
PATCH  /api/merchants/[id]          → update payment_status, payment_due_time
```

**New page: `src/app/(protected)/subscriptions/page.tsx`**
- Shows table: Merchant Name, Status (Paid/Overdue/Pending), Due Date, Missed Days, Last Payment, Actions
- Color-coded status badges: green (paid), red (overdue), yellow (pending)
- Click merchant → navigate to merchant detail (payment section)
- Bulk actions: mark as paid, send reminder

**Update sidebar (`AppSidebar.tsx`)**
- Add "Subscriptions" link under Reports section for all admins

### DB tables affected
- `merchants` (read + write `payment_status`, `payment_due_time`)
- `payment_history` (read + write)

### UI mockup (subscriptions page)
```
┌─────────────────────────────────────────────────────────────┐
│  Subscriptions                       [Filter: All / Overdue] │
├────────┬──────────┬────────┬──────────┬──────────┬──────────┤
│  Merchant │ Status   │ Due     │ Missed  │ Last     │ Action   │
│           │          │ Date    │ Days    │ Payment  │          │
├────────┼──────────┼────────┼──────────┼──────────┼──────────┤
│  Green    │ 🔴 Overdue │ 20 Jun  │ 3       │ 15 Jun   │ [Mark Paid] │
│  Grocery  │           │         │         │ LKR 500  │           │
├────────┼──────────┼────────┼──────────┼──────────┼──────────┤
│  Blue     │ 🟢 Paid    │ 25 Jun  │ 0       │ 25 Jun   │ [View]   │
│  Ocean    │           │         │         │ LKR 500  │           │
└────────┴──────────┴────────┴──────────┴──────────┴──────────┘
Summary: 45 Active | 3 Overdue | 2 Pending
```

### Acceptance criteria
- Table lists all merchants with payment status
- Color-coded status badges
- Filter by status (All / Paid / Overdue / Pending)
- Click "Mark Paid" records a payment in `payment_history`
- Summary row at bottom showing counts
- Partner admins scoped

---

## ✅ 3. Partner Management Page

**Status:** Live

Full CRUD for partner organizations under `/admin/partners` (super_admin only).

### Implemented
- `GET /api/admin/partners` — list with merchant count + admin count
- `POST /api/admin/partners` — create partner + default level-1 Admin position + first admin
- `GET /api/admin/partners/[id]` — detail with admins, merchants, positions
- `PATCH /api/admin/partners/[id]` — rename partner
- `DELETE /api/admin/partners/[id]` — delete (blocked if admins/merchants exist)
- `/admin/partners/page.tsx` — list page with create form
- `/admin/partners/[id]/page.tsx` — detail page with edit/delete/teams/merchants
- Mobile variants: `MobilePartners.tsx`, `MobilePartnerDetail.tsx`

---

## ✅ 4. Helpdesk / Support Tickets

**Status:** Live

Full ticket management system under `/helpdesk`. Admins can view, filter, reply, and resolve tickets.

### Implemented
- `GET /api/helpdesk/tickets` — list tickets with `?status=` filter, merchant name, message count
- `GET /api/helpdesk/tickets/[id]` — detail with full message thread + linked transaction
- `PATCH /api/helpdesk/tickets/[id]` — update status (open/resolved/closed)
- `POST /api/helpdesk/tickets/[id]/reply` — add admin reply
- `/helpdesk/page.tsx` — ticket list + side panel detail with reply textarea + status dropdown
- Mobile variant: `MobileHelpdesk.tsx`
- Partner admins scoped to their own merchants' tickets

---

## 5. P0 — App Settings Page

### Description
A settings page where super admins can configure global app settings stored in `app_config`.

### Why
The `app_config` table has `payments_enabled` and `daily_fee_amount` but no way to change them without raw SQL access.

### Files to create/modify

**New API route: `src/app/api/admin/settings/route.ts`**
```
GET  /api/admin/settings → return all app_config rows as key-value map
PATCH /api/admin/settings → update one or more config values
```

**New page: `src/app/(protected)/admin/settings/page.tsx`**
- Cards for each config setting:
  - **Payments**: Toggle payments enabled/disabled globally with a confirmation dialog
  - **Daily Fee**: Input field for daily fee amount with save button
  - Future: Theme color, bank settings, notification config
- Save confirmation / success toast
- Audit log entry on change

**Update sidebar (`AppSidebar.tsx`)**
- Add "Settings" link under Admin section (super_admin only)

### DB tables affected
- `app_config` (read + write)
- New `audit_logs` table (optional, for recording who changed what)

### UI mockup
```
┌─────────────────────────────────────────────────┐
│  App Settings                                   │
├─────────────────────────────────────────────────┤
│  🟢 Payments Enabled [Toggle]                   │
│  All payment processing across the app          │
├─────────────────────────────────────────────────┤
│  Daily Fee Amount   [ LKR 500.00 ] [Save]       │
│  Amount charged per merchant per day            │
├─────────────────────────────────────────────────┤
│  PostHog Analytics [Configure →]                │
│  Connected to project 474652                    │
└─────────────────────────────────────────────────┘
```

### Acceptance criteria
- Super admins can toggle payments on/off
- Super admins can update daily fee amount
- Changes persist to `app_config` table
- Changes take effect immediately (merchant app reads config)
- Confirmation dialog for destructive actions (disabling payments)

---

## 6. P1 — Merchant Map View

### Description
A map view showing all merchant locations using stored latitude/longitude data. Helps visualize merchant distribution geographically.

### Files to create/modify

**No new API needed** — reuse `/api/merchants/list` (ensure lat/lng is returned).

**New page: `src/app/(protected)/map/page.tsx`**
- Full-page map using Leaflet (free, no API key needed) or Google Maps
- Markers for each merchant with lat/lng
- Click marker → popup with merchant name, status, link to merchant detail
- Cluster markers when zoomed out (Leaflet.markercluster)
- Filter by partner, payment status

**Update sidebar (`AppSidebar.tsx`)**
- Add "Map" link under Reports section for all admins

### npm dependencies to add
- `leaflet`, `@types/leaflet`, `react-leaflet`
- `leaflet.markercluster` (optional, for clustering)

### UI mockup
```
┌────────────────────────────────────────────────────┐
│  Merchant Map    [Filter: All Partners ▼]          │
├────────────────────────────────────────────────────┤
│                                                    │
│           🟢 🟢                                    │
│      🟢         🟡     🟢                          │
│           🟢        🟢                             │
│  🟢                    🟢                          │
│       🟡     🟢                                    │
│                                                    │
│  Legend: 🟢 Active  🟡 Overdue  🔴 Inactive        │
│  Total: 45 merchants shown                         │
└────────────────────────────────────────────────────┘
```

### Acceptance criteria
- Map renders with merchant markers
- Markers color-coded by payment status or active state
- Click marker shows merchant name + link to detail
- Filters work (partner, status)
- Responsive layout

---

## 7. P1 — Export to CSV

### Description
Add CSV export buttons to Transactions, Reports, and Merchants pages so admins can download data for offline analysis.

### Files to create/modify

**New utility: `src/lib/export.ts`**
```typescript
export function downloadCSV(data: Record<string, any>[], filename: string): void
// Converts array of objects to CSV, triggers browser download
```

**Update `TransactionsTable.tsx`**
- Add "Export CSV" button next to filter controls
- Export current filtered/sorted data (not raw API data)

**Update `ReportsSummary.tsx`**
- Add "Export CSV" button
- Export the filtered transaction list

**Update `UsersTable.tsx`**
- Add "Export CSV" button
- Export current user list

**Update analytics components** (optional)
- Export events, sessions, page views

### Implementation details
- No API changes needed — export happens client-side from already-fetched data
- CSV with BOM for Excel compatibility with Unicode
- Date-formatted filenames: `transactions-2026-06-30.csv`

### Acceptance criteria
- CSV download button visible on Transactions, Reports, Merchants pages
- Downloaded CSV opens correctly in Excel/Google Sheets
- CSV includes relevant columns with headers
- Unicode (Sinhala/Tamil) text displays correctly

---

## 8. P1 — Transaction Detail Modal

### Description
Click a transaction row to see full details in a modal/drawer instead of just inline text.

### Why
Currently transactions show truncated data in a table. Admins need to see the full transaction object, raw properties, bank response, etc.

### Files to create/modify

**New component: `src/components/transactions/TransactionDetail.tsx`**
- Modal or slide-over panel
- Sections:
  - **Basic**: Reference No, Invoice No, Amount, Method, Status, Date
  - **Merchant**: Name, QR ID
  - **Customer**: User ID, Email, Name
  - **Raw Data**: JSON viewer (collapsible) showing the full transaction row

**Update `TransactionsTable.tsx`**
- Make rows clickable
- Click → open TransactionDetail modal with the transaction data
- The component already has all the data; just needs to pass it to the modal

### npm dependencies to add
None needed — use existing shadcn Dialog or Sheet components

### UI mockup
```
┌───────────────────────────────────┐
│  Transaction Details         [✕]  │
├───────────────────────────────────┤
│  Reference    2406180012345       │
│  Invoice      INV-2026-001        │
│  Amount       LKR 15,000.00       │
│  Method       QR                  │
│  Status       ✅ Completed        │
│  Date         30 Jun 2026 14:30   │
├───────────────────────────────────┤
│  Merchant                         │
│  Name         Green Grocery       │
│  QR ID        LKXXXX1234567890     │
├───────────────────────────────────┤
│  Customer                         │
│  Name         Kamal Perera        │
│  Email        kamal@example.com   │
├───────────────────────────────────┤
│  Raw Data                         │
│  ▼ { "id": 123, "reference_no":.. │
│     "amount": 15000, ... }        │
└───────────────────────────────────┘
```

### Acceptance criteria
- Click any transaction row → detail modal opens
- Modal shows all relevant fields
- Raw JSON data expandable/collapsible
- Close modal with ✕ or click outside
- Works with keyboard (Escape to close)

---

## 9. P1 — Admin Profile / Password Change

### Description
Allow admins to change their own password from within the admin panel.

### Files to create/modify

**New API route: `src/app/api/admin/profile/route.ts`**
```
PATCH /api/admin/profile → update password (current_password, new_password)
```

**New page or modal: `src/app/(protected)/profile/page.tsx`**
- Show current admin info (email, role, partner name)
- Password change form: current password, new password, confirm new password
- Save button with validation
- Success/error feedback

**Update sidebar (`AppSidebar.tsx`)**
- Add "Profile" link in Account section (before Sign Out)

### Implementation notes
- Use `supabase.auth.admin.updateUserById()` for server-side password change
- Or use `supabase.auth.updateUser()` if the admin's own auth session can do it
- Validate current password by attempting sign-in

### Acceptance criteria
- Form validates all fields
- Current password verified before allowing change
- New password must meet requirements (min 6 chars)
- Success toast on change
- "Profile" link in sidebar for all admins

---

## 10. P2 — Referral System Management

### Description
View referral codes and points per merchant, see referral chains.

### Files to create/modify

**Option A**: Show referral info on the Merchant Detail page (add a "Referral" section)
- referral_code, referral_points, referred_by_code
- Who referred this merchant?
- How many merchants did this merchant refer?

**Option B** (if needed): Dedicated referrals page

### Implementation
- Add referral fields to existing merchant queries
- Create a new endpoint to get referral stats
- Show on merchant detail page as a read-only info card

---

## 11. P2 — Audit Log

### Description
Track admin actions (login, user disable, admin create/delete) for accountability.

### DB migration needed
```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID REFERENCES admins(id),
  action TEXT NOT NULL,          -- 'admin.login', 'user.disable', 'admin.create', etc.
  target_type TEXT,              -- 'user', 'merchant', 'admin', 'config'
  target_id TEXT,                -- the affected entity's ID
  details JSONB,                 -- additional info
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### New page: `src/app/(protected)/admin/audit/page.tsx`
- Table with columns: Time, Admin, Action, Target, Details
- Filters: date range, action type, admin

### Update existing routes
Add audit logging calls to key actions:
- `/api/admin/manage` POST → `audit_logs` insert
- `/api/admin/manage/[id]` DELETE → `audit_logs` insert
- `/api/users/toggle-status` POST → `audit_logs` insert
- `/api/admin/settings` PATCH → `audit_logs` insert
- Sign-in (in `/api/admin/check`) → `audit_logs` insert

---

## 12. P2 — Push Notifications

### Description
Send broadcast notifications to merchant devices from the admin panel.

### Files to create/modify

**New page: `src/app/(protected)/admin/notifications/page.tsx`**
- Form: Title, Body, Target (All / Specific Merchant / By Partner)
- Send button with confirmation
- History of sent notifications

**New API: `src/app/api/admin/notifications/send/route.ts`**
```
POST /api/admin/notifications/send → send notification via Supabase Edge Function
```

### Implementation
- Reuse the existing `notify_push_on_completed_transaction()` trigger pattern
- Create a new Edge Function or reuse existing push infrastructure
- Query `device_tokens` for target devices

---

## 13. P2 — Server-side Pagination

### Description
Add offset/limit pagination to large list endpoints (transactions, users, merchants).

### Files to modify

**API routes** — add `?page=1&pageSize=50` params:
- `src/app/api/transactions/list/route.ts`
- `src/app/api/users/list/route.ts`
- `src/app/api/merchants/list/route.ts`

Return `{ data, total, page, pageSize }` instead of flat array.

**Frontend components** — add pagination UI:
- Previous/Next buttons
- Page number display
- Total count display

### benefits
- Reduces initial load time for large datasets
- Lower memory usage on client
- Better UX for scrolling/searching

---

## 14. P2 — Webhook Logs

### Description
View payment verification webhook call history.

### New page: `src/app/(protected)/admin/webhooks/page.tsx`
- Table: Time, Status (success/fail), Merchant, Amount, HMAC Valid
- Click to see raw request/response payload
- Filter by status, date

### Implementation
- Create a `webhook_logs` table to log all `/api/verify` calls
- Update `/api/verify` route to log each request
- Build admin UI on top of logs table

---

## Summary by Implementation Order

| # | Feature | Section | Priority | Est. Effort | Pages | API Routes |
|---|---------|---------|----------|-------------|-------|------------|
| 1 | Merchant Detail & Edit Page | §1 | P0 | 1-2 days | 1 new | 1-2 new |
| 2 | Merchant Payment / Subscription Management | §2 | P0 | 1-2 days | 1 new | 3 new |
| 3 | Partner Management Page | §3 | P0 | 1 day | 1 new | 2 new |
| 4 | Helpdesk / Support Tickets | §4 | P0 | 2-3 days | 1 new | 3 new |
| 5 | App Settings Page | §5 | P0 | 0.5 day | 1 new | 1 new |
| 6 | Merchant Map View | §6 | P1 | 1 day | 1 new | 0 |
| 7 | Export to CSV | §7 | P1 | 0.5 day | 0 (add button) | 0 |
| 8 | Transaction Detail Modal | §8 | P1 | 0.5 day | 0 (modal) | 0 |
| 9 | Admin Profile / Password Change | §9 | P1 | 0.5 day | 1 new | 1 new |
| 10 | Referral System Management | §10 | P2 | 0.5 day | 0 | 0 |
| 11 | Audit Log | §11 | P2 | 1.5 days | 1 new + migration | 0 (+ updates) |
| 12 | Push Notifications | §12 | P2 | 1-2 days | 1 new | 1 new + Edge Function |
| 13 | Server-side Pagination | §13 | P2 | 1 day | 0 | 3 updates |
| 14 | Webhook Logs | §14 | P2 | 1 day | 1 new + migration | 1 update |
