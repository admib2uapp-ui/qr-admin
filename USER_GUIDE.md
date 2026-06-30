# QR4POS Admin Panel — User Guide

## Signing In

1. Open the admin panel URL (e.g., `https://admin.qr4pos.com`)
2. You'll be redirected to `/signin`
3. Enter your email and password (provided by your system administrator)
4. After successful login, you'll be taken to the Dashboard

If you see "Access Denied", your account exists but doesn't have admin privileges — contact your system administrator.

## Roles

There are two administrator roles:

| Role | Access |
|---|---|
| **Super Admin** | Full system access — sees all merchants, transactions, and reports across all partners. Can add/remove other admins. |
| **Partner Admin** | Scoped to their own partner organization. Can only see their own merchants, transactions, and team members. |

## Sidebar Navigation

The sidebar shows different links based on your role.

**All admins see:**
- Dashboard
- Transactions
- Merchants
- Reports
- Analytics

**Partner admins additionally see:**
- Pending Merchant IDs
- Team

**Super admins additionally see:**
- Manage Admins

---

## Dashboard (`/dashboard`)

Shows today's summary at a glance:

- **Total Volume** — total transaction amount today
- **Total Transactions** — number of transactions today
- **QR Volume** — volume from QR payments
- **Cash Volume** — volume from cash payments
- **Credit Volume** — volume from credit payments

*Super admins see totals across all partners. Partner admins see only their own partner's data.*

---

## Merchants (`/merchants`)

Lists all merchants (businesses/outlets using QR4POS).

- **Super admins** see all merchants across all partners
- **Partner admins** see only merchants belonging to their partner

**Actions:**
- Click a merchant to view details
- View the user profile linked to each merchant

---

## Pending Merchant IDs (`/admin/pending-merchants`)

*Partner admin only.*

This page lets you pre-register merchant IDs so that when a new merchant signs up with that ID in the QR4POS app, they are automatically linked to your partner organization.

**Actions:**
- **Add** a new pending merchant ID
- **View** your list of registered IDs
- **Delete** an ID that's no longer needed

---

## Transactions (`/transactions`)

Shows all transactions with powerful filtering:

- **Status filter**: Completed, Pending, Cancelled
- **Method filter**: QR, Cash, Credit
- **Date range**: Today, Yesterday, This Week, This Month, This Quarter, This Year, or custom
- **Search**: by reference number, invoice number, customer name, or merchant name
- **Sort**: click any column header to sort

*Partner admins only see their own partner's transactions.*

---

## Reports (`/reports`)

Generate summary reports with charts:

- **Date range** — pick start and end dates
- **Merchant filter** — narrow to a specific merchant
- **Chart** — daily, monthly, or yearly transaction volume
- **Settlement Amount** — total settled value in the period
- **Transaction Volume** — count of transactions in the period

---

## Analytics (`/analytics`)

PostHog-powered analytics showing how the QR4POS app is being used.

**Tabs:**

| Tab | What it shows |
|---|---|
| **Overview** | Page views, unique visitors, sessions, total events (last 7/30/90 days) |
| **Events** | Raw event stream — click "Event Type" to filter by specific events like `cash_recorded`, `qr_generated`, `payment_completed`, `$pageview` |
| **Pages** | Most visited pages with view/visitor counts. Click the arrow to expand and see which users viewed each page |
| **Sessions** | Recent browsing sessions with browser, OS, location, and page info |

**Tip:** Use the "7 Days / 30 Days / 90 Days" selector at the top to change the date range. Click "Refresh" to reload.

---

## Manage Admins (`/admin/manage`)

*Super admin only.*

Add or remove administrator accounts.

**Adding a new admin:**
1. Enter the admin's email address
2. Choose a role: **Super Admin** (full access) or **Partner Admin** (scoped to a new partner)
3. For Partner Admin, provide a partner name — a new partner organization and a default "Admin" position (level 1) will be created automatically
4. The new admin will be created with a temporary password (`123456`). Instruct them to sign in and change their password.

**Deleting an admin:**
Click the delete icon next to any admin to remove their access.

---

## Team Management (`/admin/team`)

*Partner admin only.*

Manage your partner's team members and position structure.

### Positions

Positions define a hierarchy with levels 1 (highest) to 5 (lowest). The default "Admin" position at level 1 is created automatically when your partner is created.

**Adding a position:**
1. Enter a position name (e.g., "Manager", "Supervisor")
2. Choose a level (1-5)

### Team Members

You can add team members at levels **lower than your own** — for example, if you're "Admin" (level 1), you can add members at levels 2-5. A member at level 2 can add members at levels 3-5, and so on.

**Adding a team member:**
1. Enter their email address
2. Enter their full name
3. Select a position (only positions at lower levels than yours are shown)
4. The member will be created with a temporary password (`123456`). They should sign in and change their password.

---

## Users (`/admin/users`)

*Listed as part of merchants view.*

View merchant users (the end-users of the QR4POS app). Super admins can enable/disable user accounts. Disabled users cannot sign in to the QR4POS app.

---

## FAQ

**Q: I forgot my password. What do I do?**
Contact your super admin to reset it. Password reset through the UI is not yet available.

**Q: Why can't I see certain merchants or transactions?**
You're logged in as a partner admin. You can only see data belonging to your partner organization.

**Q: How do I know who viewed a specific page in the analytics?**
Go to Analytics → Pages tab, click the arrow next to any page to expand it and see the list of users who visited that page.

**Q: Can I be both a super admin and a partner admin?**
No. Each admin account has exactly one role.

**Q: Why does the Manage Admins page show "Admin" in the position column?**
Admins with role "partner_admin" and position "Admin" are the top-level administrators of their partner org. Only partner admins at the "Admin" position level appear on the Manage Admins page.
