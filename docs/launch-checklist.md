# Launch Checklist

## 1. Create and configure Firebase

1. Create or select the production Firebase project.
2. Enable **Authentication → Sign-in method → Email/Password**.
3. Create a Firestore database.
4. Enable Firebase Storage.
5. Register the web app and copy its Firebase configuration.
6. Create a local `.env` from `.env.example`.
7. Fill in all `VITE_FIREBASE_*` values.
8. Deploy Firestore and Storage rules from the repository.

## 2. Provision the owner

The application does not allow public client-side profile creation. This prevents a new authenticated user from choosing the owner role.

Create the owner account through Firebase Authentication, then create the matching Firestore document:

**Collection:** `users`  
**Document ID:** the Firebase Authentication UID

Required fields:

- `uid`: Authentication UID
- `displayName`: Tshinanne Mamagau
- `phone`: owner phone number
- `role`: `owner`
- `active`: `true`
- `assignedTruckId`: `null`

## 3. Provision the driver

Create the driver account through Firebase Authentication, then create the matching Firestore `users/{uid}` document.

Required fields:

- `uid`: Authentication UID
- `displayName`: driver's name
- `phone`: driver's phone number
- `role`: `driver`
- `active`: `true`
- `assignedTruckId`: the driver's truck document ID

## 4. Seed the two trucks

Create two documents in the `trucks` collection.

Both should use:

- `make`: `TATA`
- `model`: `1518`
- `status`: `active`
- `currentOdometer`: actual current odometer
- `registrationNumber`: actual registration number

Do not invent registration numbers. Enter the real vehicle registrations during production setup.

Assign the driver's UID to the second truck's `driverId` field.

Then set the driver's `assignedTruckId` to that truck document ID.

## 5. End-to-end acceptance test

### Owner
- Sign in successfully.
- View dashboard.
- View both trucks.
- Add/edit a customer.
- Create a delivery.
- Record an expense.
- Record fuel.
- Add maintenance.
- View reports and profit information.
- Confirm owner-only controls are available.

### Driver
- Sign in successfully.
- Confirm only the assigned truck is used for driver operations.
- Create fuel for the assigned truck.
- Complete the inspection checklist.
- Move an assigned delivery to **On the way**.
- Mark it **Delivered**.
- Upload delivery proof.
- Share/copy the current phone location.
- Confirm finance/profit data is not accessible.

### Security
- Confirm an inactive user cannot use the application.
- Confirm a driver cannot change their role, active status, or assigned truck through the client.
- Confirm a driver cannot update another driver's delivery.
- Confirm delivery proof is restricted to the owner or assigned driver.

## 6. Mobile/PWA test

Test on the owner's and driver's actual phones:

- Login
- Dashboard loading
- Add delivery
- Upload proof photo
- Location sharing
- Fuel entry
- Inspection
- Maintenance view
- Navigation between screens
- Portrait and landscape layouts
- Slow mobile connection
- Logout/login again

## 7. Backup and deployment

Before production use:

- Decide how often business data will be exported/backed up.
- Keep Firebase project ownership and recovery email under the business owner's control.
- Verify Firestore and Storage rules are deployed.
- Run the GitHub Actions build and resolve any failures.
- Deploy the production web app through Firebase Hosting.
- Perform one final owner + driver acceptance test after deployment.

## Important production notes

- Never commit `.env` or Firebase private credentials.
- Never put a service-account JSON file in the frontend repository.
- Real truck registration numbers and driver contact details should only be entered during production setup.
- Dedicated GPS hardware, WhatsApp Business API automation, invoicing/accounting integrations, and advanced analytics remain future enhancements.
