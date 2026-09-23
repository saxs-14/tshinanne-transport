# Tshinanne Transport — Completion & Production Readiness

## Purpose

This document records what has been implemented in the Tshinanne Transport application and what still must be completed before it can be used as a real, running production application by the business.

**Repository:** saxs-14/tshinanne-transport  
**Default branch:** main  
**Current status:** MVP application codebase completed; production setup and real-world verification remain.

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

### A. Production Firebase setup — REQUIRED

1. Create or select the production Firebase project.
2. Enable Firebase Authentication.
3. Enable Email/Password sign-in.
4. Create the Firestore database.
5. Enable Firebase Storage.
6. Register the web application in Firebase.
7. Create the production environment configuration from .env.example.
8. Add the real Firebase configuration values to the deployment environment.
9. Deploy firestore.rules.
10. Deploy storage.rules.
11. Deploy firestore.indexes.json.

**Status:** Not verified as completed in a live Firebase project.

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

### E. Build and CI verification — REQUIRED

The GitHub Actions build workflow exists, but the latest repository state has not been confirmed by a successful CI run.

Required:
1. Trigger the GitHub Actions workflow.
2. Confirm dependency installation succeeds.
3. Confirm npm run build succeeds.
4. Fix any CI errors if they occur.
5. Repeat until the production branch has a successful build.

**Important:** A successful local build has not been independently verified in this development environment because network access to GitHub was unavailable during the previous verification attempt.

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
