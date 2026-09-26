# Tshinanne Transport — Completion & Production Readiness

## Purpose

This document records what has been implemented in the Tshinanne Transport application and what still must be completed before it can be used as a real, running production application by the business.

**Repository:** saxs-14/tshinanne-transport  
**Default branch:** main  
**Current status:** MVP application codebase completed; production setup and real-world verification remain.

---

## 0. 2026-09-26 session update — build actually verified, real bugs fixed

Earlier revisions of this document stated the production build had not been independently
verified because network access was unavailable. That build was attempted this session and
**it failed** — the codebase had real, uncaught defects:

- A missing closing brace in `src/pages/Deliveries.tsx` (the file did not compile at all).
- No `src/vite-env.d.ts`, so every `import.meta.env.VITE_FIREBASE_*` reference failed to typecheck.
- Several real TypeScript errors: a missing `category` field on the dashboard's local `Expense`
  type, a missing `driverId` field on Deliveries' local `TruckRecord` type, multiple
  `auth.currentUser` accesses that didn't null-check `auth` itself, an unsound truck `status`
  literal type, and a possibly-undefined odometer comparison in Maintenance's due-date logic.

All of the above were fixed. `npm run build` now completes successfully.

Additional hardening done this session:

- `src/pages/AccessDenied.tsx` existed but was never wired into the app — an inactive account
  would previously just see scattered "Unable to load…" errors instead of a clear message
  (Firestore rules always blocked the actual data correctly; this was a UX gap, not a security
  gap). `ProtectedRoute` now checks the signed-in user's `active` flag and shows `AccessDenied`
  with a sign-out action when it is `false`.
- Revenue/expense/profit math was duplicated three times (Dashboard, Finance, Reports) with
  hand-copied `reduce()` calls. Extracted into `src/lib/finance.ts` as the single source of
  truth for `paymentStatus`, `operatingCosts` (manual expenses + fuel, never double-counted),
  and `estimatedProfit` (revenue − operating costs). All three screens now call the same
  functions.
- Added `vitest` and 14 unit tests covering that finance module (payment status, revenue,
  outstanding balance, fuel/expense double-count prevention, profit, date-range validation).
  Run with `npm run test`. Wired into `.github/workflows/build.yml` so CI runs tests before build.
- `Trucks.tsx` truck deletion previously had no check for existing history — deleting a truck
  with recorded deliveries, fuel or maintenance would silently orphan those records. It now
  blocks deletion (with a message to set the truck inactive instead) if any such records exist.

Not done this session (needs the business owner's input/credentials, see Section 2):
production Firebase project, real accounts, real truck data, deployment, real-device testing.

---

## 1. What has been completed

### Project foundation
- React + TypeScript + Vite application created.
- Mobile-first application shell created.
- Responsive navigation and dashboard structure implemented.
- PWA manifest and truck icons added.
- Firebase integration structure added.
- Environment-variable configuration added.
- Firestore indexes configuration added.
- GitHub Actions build workflow added.

### Authentication and access control
- Firebase Authentication integration implemented.
- Email/password login implemented.
- Protected application routes implemented.
- Owner and driver roles implemented.
- Inactive users are blocked.
- Driver access is restricted from owner-only financial areas.
- Driver profile self-editing is restricted to display name and phone.
- Client-side public role creation is intentionally disabled.

### Fleet management
- Truck management implemented.
- Two TATA 1518 trucks are supported.
- Truck registration, odometer and status are tracked.
- Driver assignment is implemented.
- Driver reassignment clears the previous driver's assignment.
- Duplicate truck registration numbers are checked client-side.
- Drivers cannot edit fleet records.

### Deliveries
- Customer, truck, driver, sand type, quantity and pricing fields implemented.
- Delivery and payment statuses implemented.
- Amount paid and outstanding balance tracking implemented.
- Delivery history implemented.
- Driver delivery access is restricted to assigned deliveries.
- Driver delivery updates are limited to operational fields.
- Driver/truck consistency is enforced by Firestore rules.
- Delivery proof photo upload implemented.
- Proof upload validation includes image type and size limits.
- Proof uploads are blocked after delivery completion.

### Customers
- Customer management and search implemented.
- Customer contact/address information is stored.
- Delivery history can be associated with customers.

### Finance
- Owner-only finance screen implemented.
- Delivery revenue, payments received and outstanding amounts calculated.
- Manual expenses implemented.
- Estimated profit implemented.
- Fuel is treated as a separate source of operating cost to avoid double counting.
- Owner-only financial access enforced.

### Fuel
- Fuel recording implemented.
- Litres, amount, odometer, station and date are tracked.
- Driver fuel records are restricted to the driver's assigned truck.
- Driver-created fuel records require the authenticated driver's UID.
- Driver fuel odometer cannot be lower than the truck's current odometer according to Firestore rules.
- Fuel is included in dashboard, finance and reporting calculations.

### Maintenance
- Maintenance records implemented.
- Service, oil, tyres, brakes, repairs, parts and other categories supported.
- Cost, odometer, date and next-due information supported.
- Maintenance history implemented.
- Maintenance due detection implemented.
- Drivers can create records for their assigned truck.
- Maintenance editing/deletion is owner-only.

### Operations
- Driver operations screen implemented.
- Daily truck inspection checklist implemented.
- Delivery workflow includes On the way and Delivered.
- Delivery proof photo upload implemented.
- Phone-based location sharing is implemented as a user-triggered Google Maps link.
- Continuous GPS tracking is intentionally not implemented.

### Dashboard and reports
- Owner dashboard includes daily revenue, operating costs, estimated profit, outstanding amounts and maintenance status.
- Driver dashboard avoids exposing owner financial information.
- Reports support date-range filtering.
- Revenue, payments, outstanding balances, expenses, fuel and estimated profit are reported.
- Truck profitability includes recorded fuel.
- Invalid report date ranges are handled.

### Security rules
- Firestore security rules implemented and hardened.
- Storage security rules implemented and connected to Firebase configuration.
- Owner/driver permissions are enforced at the backend rule level for the implemented collections.
- Driver delivery updates are restricted.
- Driver fuel writes are restricted.
- Driver maintenance access is scoped to the assigned truck.
- Delivery proof Storage access is restricted to the owner or assigned active driver.
- Delivery proof uploads are limited to images under 10 MB.

### Documentation
- Project overview documented.
- Firestore data model documented.
- Development phases documented.
- Production launch checklist documented.
- Repository was searched for TODO/FIXME/placeholder/coming-soon markers; no remaining matches were found during the hardening review.

---

## 2. What is still missing before this is a real running application

The remaining work is primarily **production configuration, deployment, real-data setup and real-device verification**, rather than building the core MVP screens.

### A. Production Firebase setup — PARTIALLY DONE (2026-09-26)

1. ~~Create or select the production Firebase project.~~ **DONE** — `tshinanne-transport`
   (project number 96705889243), created via `firebase projects:create`.
2. Enable Firebase Authentication. **NOT DONE — see note below.**
3. Enable Email/Password sign-in. **NOT DONE — blocked on step 2.**
4. ~~Create the Firestore database.~~ **DONE** — native mode, `africa-south1` (Johannesburg)
   region, via `firebase firestore:databases:create`.
5. Enable Firebase Storage. **Deliberately deferred** — the owner chose to stay on the free
   Spark plan for now (see cost note below). Delivery-proof photo upload will show an error
   until this is enabled.
6. ~~Register the web application in Firebase.~~ **DONE** — via `firebase apps:create WEB`.
7. ~~Create the production environment configuration from .env.example.~~ **DONE** — local
   `.env` written with the real project's SDK config (gitignored, not committed).
8. ~~Add the real Firebase configuration values to the deployment environment.~~ **DONE
   locally** — still needed wherever this gets hosted/deployed (e.g. as CI/hosting secrets).
9. ~~Deploy firestore.rules.~~ **DONE** — `firebase deploy --only firestore:rules`.
10. Deploy storage.rules. **Deferred with Storage (step 5).**
11. ~~Deploy firestore.indexes.json.~~ **DONE** — `firebase deploy --only firestore:indexes`.

**Remaining manual step — Authentication:** A brand-new Firebase project's Authentication
product cannot be turned on purely via API/CLI — this was verified this session by calling the
Identity Toolkit config and `identityPlatform:initializeAuth` endpoints directly; both
consistently reported the API as unprovisioned even after enabling
`identitytoolkit.googleapis.com` in Cloud Console and waiting for propagation. It genuinely
requires one manual visit to the console the first time. To unblock:

1. Open https://console.firebase.google.com/project/tshinanne-transport/authentication
2. Click **Get started**.
3. Enable the **Email/Password** sign-in provider.

After that, Section B below (owner/driver accounts) can be completed — from the console directly
under **Authentication → Users → Add user**, or Claude can do it via the Admin SDK/CLI once
Auth is enabled.

**Important cost note:** Firebase Authentication and Firestore are usable on the free Spark
plan. Firebase Storage (needed for delivery-proof photos) currently requires the pay-as-you-go
Blaze plan to enable on a new project — Blaze still has a generous free monthly quota, but it
requires adding a billing/card method to the Google Cloud project. If/when the owner is ready
for delivery-proof photos, enable Storage in the console (or via `firebase init storage` +
`firebase deploy --only storage`) and Claude can deploy `storage.rules` immediately after —
it's already written and unchanged.

### B. Real user accounts — REQUIRED

Create the actual Firebase Authentication accounts.

#### Owner
Create the owner's Authentication account and matching users/{uid} document with:
- role = owner
- active = true
- assignedTruckId = null

#### Driver
Create the driver's Authentication account and matching users/{uid} document with:
- role = driver
- active = true
- assignedTruckId = the correct truck ID

**Status:** Not completed with live production accounts.

### C. Real truck data — REQUIRED

Enter the actual two TATA 1518 vehicles:
- Real registration numbers
- Real current odometers
- Correct driver assignment
- Correct active/inactive status

**Status:** Application supports this, but real business data has not been entered.

### D. Production deployment — REQUIRED

Deploy the application to a public production URL.

Recommended initial route:
- Firebase Hosting

The deployment must contain the production Firebase environment values and must use the production Firestore/Storage rules.

**Status:** Not deployed/verified as a live production application.

### E. Build and CI verification — LOCAL BUILD VERIFIED; CI RUN STILL REQUIRED

`npm install`, `npm run test` and `npm run build` were run locally in this session and all
three succeed (see Section 0). The GitHub Actions workflow (`.github/workflows/build.yml`) now
also runs tests before the build step.

Still required:
1. Push these changes and confirm the GitHub Actions workflow actually runs green on GitHub.
2. Fix any CI-environment-specific errors if they occur (none are expected — the failures found
   locally were genuine source bugs, not environment differences, and are now fixed).

**Status:** Local build/test — verified. Actual GitHub Actions run — not yet confirmed (requires
pushing this branch).

### F. Real-device acceptance testing — REQUIRED

Test the deployed application using the actual owner's and driver's phones.

Owner test:
- Login
- Dashboard
- Add customer
- Create delivery
- Record fuel
- Record expense
- Add maintenance
- View reports
- Verify profit calculations
- Verify both trucks

Driver test:
- Login
- See assigned truck
- Complete inspection
- Record fuel
- Create/handle assigned delivery
- Set delivery On the way
- Mark Delivered
- Upload proof
- Share location
- Confirm financial information is inaccessible

### G. Production data backup — REQUIRED

Establish a simple backup/export process before relying on the system for business records.

At minimum:
- Decide backup frequency.
- Keep Firebase ownership/recovery information controlled by the business owner.
- Document how business data will be recovered if needed.

---

## 3. Important limitations that are intentional

These are not unfinished bugs; they are deliberately deferred features.

### Dedicated GPS tracking
The current system uses phone-triggered location sharing. It does not continuously track trucks.

A future version can integrate dedicated GPS hardware.

### WhatsApp automation
The application does not currently send automated WhatsApp messages through a paid WhatsApp Business API.

A future version can add automated customer notifications.

### Full invoicing/accounting
The application tracks operational revenue, payments, expenses and estimated profit. It is not a replacement for a full accounting package.

### Online payment processing
No payment gateway has been integrated.

### Advanced pricing engine
There is no server-side sand-price catalogue or automatic pricing engine yet. This means delivery prices are entered as part of the delivery record.

### Offline-first synchronization
The application has PWA support, but a complete offline-first synchronization system has not been implemented.

### Automated administration
User provisioning currently requires Firebase-side administration. There is no secure custom admin backend for creating users and assigning roles.

---

## 4. Technical items worth hardening after the first production release

These are improvements rather than blockers for the core MVP:

1. Add a server-side unique truck-registration index if duplicate prevention must also cover malicious/direct Firestore writes.
2. Consider storing delivery-proof Storage paths rather than relying on tokenized download URLs when stronger sharing control is required.
3. Update truck current odometer transactionally when valid fuel/odometer records are submitted.
4. Add automated tests for important business rules.
5. Add a proper production error-monitoring solution.
6. Add offline persistence and synchronization if poor connectivity becomes a real operational problem.
7. Add secure backend/admin tooling for user provisioning.
8. Add automated invoice/quote generation if the business requires formal documents.

---

## 5. Final status

### Application code
**Core MVP: COMPLETE**

The repository contains the main application functionality for:
- Authentication
- Owner/driver access
- Trucks
- Drivers
- Customers
- Deliveries
- Finance
- Fuel
- Maintenance
- Operations
- Inspections
- Delivery proof
- Location sharing
- Dashboard
- Reports
- Firestore security
- Storage security
- PWA foundation
- CI configuration
- Launch documentation

### Live production application
**NOT YET COMPLETE**

The system becomes a real running business application only after the following are completed and verified:

1. Production Firebase project configured.
2. Authentication enabled.
3. Firestore and Storage enabled.
4. Production rules/indexes deployed.
5. Real owner account created.
6. Real driver account created.
7. Real two-truck records entered.
8. Production environment variables configured.
9. GitHub Actions/build verified successfully.
10. Application deployed.
11. Owner and driver tested on real phones.
12. Backup/recovery process established.

### Definition of done

The project should only be considered **fully live and production-ready** after the complete list above has been successfully tested in the real business environment.

Until then, it is best described as:

> **A completed MVP codebase that is prepared for production setup and real-world acceptance testing.**
