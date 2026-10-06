# Pankaja kitchen and restaurant operations

Branch: `pankaja-kitchen-operations`. The common Firebase configuration is unchanged.
Approved references: `docs/ui-reference/pankaja/` (all five PNGs and README).
Tables follow selected Variant A; operational queue follows selected Variant C.

## Open the module in Expo Go

Run `npx expo start`, open the project on the iPhone, then use a route link:

`exp://YOUR_COMPUTER_IP:8081/--/kitchen/upcoming-reservations`

Replace the host/port with the Expo Go URL printed by Metro. Other direct paths:

- `/kitchen/today`
- `/kitchen/alerts`
- `/staff/table-floor-management`
- `/staff/queue-management`

Kitchen bottom navigation switches Upcoming / Today / Alerts. Staff Tables and
Queue navigation links use existing routes; other staff links retain their
existing placeholders. The global root and staff authentication are unchanged.
Direct navigation does not bypass Firestore security rules. Required permissions
must be provided by the project owner; this module does not deploy security rules.

## Data and behavior

- `reservations`: realtime read only, sorted by date/time. Existing customer
  fields are supported; `tableId` and `tableNumber` are optional. Dates must be
  `YYYY-MM-DD`, times `HH:mm`. The horizontal selector covers 14 calendar days
  starting today. Device-local time is used; test in restaurant time.
  Active statuses: confirmed, pending, reserved, arrived. Cancelled and completed
  records are excluded from upcoming/expected arrivals. Special requests display
  dietary/occasion information without requiring a new customer schema.
- `tables`: realtime grid, add/edit capacity and area, change status, confirmed
  deletion. New table numbers are uppercase IDs, immutable after creation.
  Occupied/reserved tables cannot be deleted. No graphical floor-layout editor.
- `queueEntries`: realtime waiting/called list. Call next, seat, cancel with
  confirmation. A transaction rechecks active entries, renumbers remaining
  positions, and optionally occupies an available table with sufficient capacity.
  Only one customer is called at a time. Terminal records remain for history.
  Active IDs are fetched before the transaction; newly joined entries participate
  in subsequent actions. This simple algorithm targets a small restaurant queue,
  with a 400-entry guard. Estimated waits are displayed, not recalculated.
- `kitchenAlerts`: realtime display and acknowledgement. The explicit "Check
  upcoming large groups" action creates one alert per active future reservation
  with eight or more guests, rechecking the reservation in a transaction.
  Existing acknowledgement is preserved. Rush/cancellation/change alerts already
  supplied by another workflow are displayed; no background notification engine
  or push notifications are introduced.

## Automated checks

`npx tsc --noEmit`

`node --test tests/pankaja-services.test.cjs`

The tests transpile the actual TypeScript services and mock the Firestore boundary.
They cover invalid reservation dates, next-hour filtering, table CRUD safeguards,
malformed table error handling, queue actions/order/table capacity, idempotent
alerts, and existing customer schema compatibility. They never write Firebase data.
They do not replace integration tests for real concurrent clients/security rules.

Implementation validation: TypeScript passed, six service tests passed, and Metro
compiled the iOS bundle containing all five routes. A read-only server query read
one existing reservation with compatible fields; no customer information was
printed and no reservation was changed. New module lint passed using locally
installed Expo ESLint tooling; full-project lint reports the pre-existing
`src/hooks/use-color-scheme.web.ts` synchronous state update in an effect.
Project manifests were preserved rather than adding unrelated lint setup changes.

## Physical iPhone results (2026-10-05)

The project owner confirmed successful physical Expo Go testing:

- Upcoming read real reservations, with October 12 selectable in the 14-day row.
- Today displayed the test large group and counted 10 guests in the next hour.
- Large-group alert generation, initial unacknowledged state, acknowledgement and
  movement to the acknowledged section worked.
- Tables displayed Firestore data and table creation succeeded.
- Operational queue workflow and active queue state worked.
- Empty states did not crash.

Final cleanup found one marked test document in each of `queueEntries`,
`reservations` and `kitchenAlerts`; all three were deleted after transactional
marker checks. Server queries then confirmed zero marked records in those
collections. Existing real reservations were verified unchanged.
The temporary launcher, test-data service and test-only alert marker propagation
were removed. The root starter file was restored from `5c68707`.

## Optional regression checks

1. Open each route using Expo Go and compare spacing, safe areas, navigation and
   keyboard behavior with the approved PNGs.
2. Observe an existing reservation in its date tab. Old reservations may not show
   in Upcoming/Today; a future/today reservation is needed for visible arrival
   tests. Verify realtime updates from a second authorized client without deleting
   existing customer records. Check empty collections and permission/offline errors.
3. Add explicitly disposable tables through this screen; edit capacity/area and
   cycle statuses. Test deletion confirmation and occupied/reserved safeguards.
4. Until the customer Join Queue module exists, use owner-created disposable
   `queueEntries` records with customerId, customerName, partySize, position,
   estimatedWaitMinutes, status=waiting, joinedAt and updatedAt timestamps.
   Test call/seat/cancel and sequential positions with two entries. Verify table
   assignment updates table status and insufficient capacity is rejected.
5. With an eligible future reservation, check large-group alerts twice, acknowledge
   one, and verify it remains acknowledged. Use owner-created disposable rush/change
   alerts to test other alert types. No test data was automatically seeded.

No other member features, staff authentication, customer queue entry, reservation
CRUD, security-rule deployment, backend, Firebase Admin or private credentials were
added. The completed module is isolated to the Pankaja branch.
