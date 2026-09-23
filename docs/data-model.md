# Data Model

Initial Firestore collections:

## users

- uid
- displayName
- phone
- role: owner | driver
- active
- assignedTruckId

## trucks

- id
- registrationNumber
- make: TATA
- model: 1518
- driverId
- status
- currentOdometer
- notes

## customers

- id
- name
- phone
- address
- location
- notes
- createdAt

## deliveries

- id
- customerId
- truckId
- driverId
- sandType
- quantity
- price
- paymentStatus
- deliveryStatus
- orderDate
- deliveryDate
- notes

## expenses

- id
- truckId
- category
- amount
- description
- date
- receiptUrl
- createdBy

## fuelRecords

- id
- truckId
- litres
- amount
- odometer
- station
- date
- receiptUrl
- createdBy

## maintenanceRecords

- id
- truckId
- category
- description
- amount
- odometer
- date
- nextDueOdometer
- receiptUrl
- createdBy
