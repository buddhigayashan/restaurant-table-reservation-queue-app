# Application architecture

## Routes

Only route components and navigator layouts belong in src/app.
The customer, staff (including managers), and kitchen folders give each area
its own URL prefix and stack. Every planned screen currently returns null.
No authentication, role protection, or business logic has been implemented.
The (starter) group preserves the existing Expo demo at / and /explore.
Its group name does not appear in the URL. The root stack contains all areas.

## Feature code

src/features/customer, src/features/staff, and src/features/kitchen contain
area-specific components and hooks. Keep route files thin as features grow.
Shared reusable components belong in src/components/common; existing template
components remain in src/components. Shared hooks belong in src/hooks.

## Shared data and support

- src/config/firebase: future Firebase client configuration.
- src/services/auth: authentication operations.
- src/services/reservations: reservation operations.
- src/services/queue: queue operations.
- src/services/tables: table operations.
- src/services/staff: staff account operations.
- src/services/notifications: notification operations.
- src/types: shared TypeScript types; domain types will be defined with the data model.
- src/constants/theme.ts: existing colours, typography, and spacing.
- src/utils: small shared utility functions when needed.

Empty folders use .gitkeep so Git preserves them. Service folders contain only
scope notes. Do not add mock functions or invented domain models merely to fill
these folders. No extra dependencies are required for this structure.

## Screen naming

Customer notifications and profile use /customer/notifications and
/customer/profile. Edit and cancel share /customer/edit-cancel-booking.
Staff account management uses /staff/account-management; floor layout setup
uses /staff/table-setup. Kitchen Today View uses /kitchen/today.
Reservation identifiers can be added when reservation flows are implemented.

## Next steps

Validate the approved HCI prototype and agree on the Firebase data model before
implementing screens. Role-based route access and Firestore permissions will be
implemented with authentication; area folders alone do not enforce permissions.

