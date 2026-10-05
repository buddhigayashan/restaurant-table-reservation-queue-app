# Vimandya queue, bookings, notifications and staff accounts

IT23847576 – Vimandya U.J.P. Branch: `vimandya-queue-bookings`.
Based on common Firebase commit `5c68707`; no other feature branch was merged.
Firebase configuration, environment, and dependency manifests are unchanged.

## Report and UI traceability

Reviewed local reports in `C:/Users/User/Documents/Downloads/`:

- `IT3060HCI2026_Milestone01_Group_WE_129.pdf`: sections 11.1–11.2, printed
  pages 24–26. This module supports FR2 waiting estimates, FR3 live queue,
  FR4 table-ready in-app notices, FR5 editing/cancellation before arrival,
  customer cancellation in FR7, and reservation-change communication in FR9.
  NFR1/3 use Firestore snapshots; NFR2 labels approximate estimates honestly;
  NFR4 uses the approved forms/lists; NFR6 adds ownership and role checks.
  NFR5 full peak-load performance remains untested. External push delivery,
  no-show automation and unrelated restaurant dashboard features are outside
  this assignment's explicitly limited scope.
- `IT3060HCI2026_Milestone02_Group_WE_129.pdf`: cover workload allocation,
  printed pages 5–8 for selected customer/staff Variant A, pages 15/18 for
  wireframes and page 20 for shared high-fidelity styling.
- Inspected every PNG and README in `docs/ui-reference/vimandya/`.
  Selected wireframes define structure; sketches clarify staff search/toggles.
  No made-up restaurant names, fixed queues or seeded screen records.

## Routes and assigned screens

| Screen | Existing route |
| --- | --- |
| Join Queue | `/customer/join-queue` |
| Live Queue Tracking | `/customer/live-queue-tracking` |
| My Bookings | `/customer/my-bookings` |
| Edit / Cancel Booking | `/customer/edit-cancel-booking?reservationId=DOCUMENT_ID` |
| Customer Notifications | `/customer/notifications` |
| Staff Login | `/staff/login` |
| Staff Accounts | `/staff/account-management` |

Customer navigation links to existing Home, Bookings, Queue, Alerts and Profile
routes. New booking and customer sign-in link to the other members' placeholders
on this isolated branch. No customer authentication/creation screen was implemented.
Staff managers navigate to Accounts after login; kitchen/staff navigate to their
existing Upcoming/Dashboard placeholders, which remain unimplemented here.

## Firestore schemas and services

- `users/{uid}`: existing customer fullName, phoneNumber and role=customer.
  Requires a real Firebase Authentication customer session; no anonymous/fake UID.
- `queueEntries`: customerId, customerName, phoneNumber, partySize,
  seatingPreference, position, estimatedWaitMinutes, status, joinedAt, updatedAt.
  Statuses waiting/called/seated/cancelled match Pankaja's operations module.
  Join creates a new document, preserving earlier cancelled/seated visits.
  Leave changes status to cancelled; never deletes history.
- `queueState/order`: activeIds and updatedAt. Transactional serial guard for
  joining customers; re-reads queued documents to discard completed entries.
  `queueState/customer-{uid}`: entryId and updatedAt; prevents duplicate active
  joins for a customer across devices/retries. Existing operational/walk-in
  entries are included by a pre-transaction active query. Customer joins through
  this service serialize through the order document. Arbitrary external walk-in
  writers do not share that guard, so their simultaneous inserts may temporarily
  create equal positions; Pankaja sorts/reindexes during operational actions.
  New joins use max active position + 1. Small-restaurant guard: 200 active entries.
- `reservations`: unchanged customerId/customerName/customerEmail/date/time/
  partySize/seatingPreference/specialRequest/status/createdAt/updatedAt contract.
  Optional tableId/tableNumber are preserved, not required. Updates write only
  allowed editable fields; cancellation sets status=cancelled. Services recheck
  ownership, active status and future arrival within the transaction.
- `customerNotifications`: customerId, type, title, message, read, createdAt,
  optional reservationId/queueEntryId. Booking edits/cancellation create notices
  atomically with the reservation write. Queue joins/leaves create notices; tracking
  called/seated entries creates deterministic `{entryId}-{status}` notices without
  overwriting an existing read state. All reads/mark-read operations check ownership.
- `kitchenAlerts`: booking edits/cancellation also write reservation_change or
  cancellation notices atomically (title, message, reservationId, severity,
  acknowledged=false, createdAt). This is integration support for FR9; no kitchen
  screen or operational service is implemented on this branch.
- `staffAccounts/{uid}`: uid, fullName, email, role (manager/staff/kitchen),
  isActive, createdAt, updatedAt. Search, add/edit profile, activate/deactivate.
  Manager authorization is rechecked before and inside writes. UID is immutable
  on editing; self-deactivation/demotion is prohibited.

Listener locations: `src/services/queue/customer.ts`,
`src/services/reservations/customer.ts`, `src/services/notifications/customer.ts`,
`src/services/staff/accounts.ts`. Auth/profile changes are also listened to so
screens stop displaying records after sign-out or lost profile access.

## Estimates, notices and remaining limitations

The queue estimate uses five minutes per position as an initial approximation.
Join displays active-party count and an estimate; actual arrival depends on table
turnover. Tracking displays the shared stored position/wait and immediately reacts
to status/position updates from restaurant operations. Position gaps after a
customer leaves persist until operational reindexing; no customer writes modify
other customers' queue documents. Waiting time is not a guaranteed SLA.

Called/seated notifications are generated while that customer's tracking screen
is open. There is no background/closed-app notifier, SMS or push. Other producers
may supply booking_confirmed and reservation_reminder documents, which this inbox
can display; this module does not invent an external scheduling service.

Dates are local restaurant/device calendar dates in YYYY-MM-DD; time is 24-hour
HH:mm. Test the phone in restaurant time. Edit inputs keep the approved labeled
card/form hierarchy; no new native picker dependency was added. Party sizes are
whole numbers 1–20. Cancelled/completed/past entries are shown under Past; unknown
or missing optional fields are tolerated. Staff login uses email, not a lookup by ID.

## Staff Authentication versus profile management

Firebase Auth Email/Password credentials must already exist. Managers use the
Auth user's exact UID/email when adding a Firestore staff profile; adding a profile
does not create credentials or change another user's password. The first manager
Auth user and matching active manager profile must be provisioned in Firebase
Console by the project owner. No Admin SDK/private keys or credential-creation
backend was introduced. Password reset uses Firebase's existing email action.

Staff sign-in verifies active staff profile, matching UID/email, and valid role.
Missing/inactive/invalid staff profiles are denied and signed out after successful
Authentication. Manager-only operations also validate role at the service layer.
Staff sign-in replaces the current Firebase session; test customer flows first.

Client checks are additional protections, not a replacement for Firestore rules.
No security rules were changed/deployed. Test-mode rules can still permit malicious
clients to bypass checks; final-project hardening must restrict ownership/roles,
queue guard writes and allowed transitions. Queue estimate/join currently need read
permission on active queue records and guard documents; strictly private production
rules would need a trusted aggregate/counter design. Test rule permissions before
claiming production security. Do not relax rules merely to bypass an error.

## Automated validation

`npx tsc --noEmit`

`node --test tests/vimandya-services.test.cjs`

Tests mock the Firebase boundary and execute real TypeScript services: duplicate
guards, input validation, queue/booking ownership, terminal queue history, atomic
booking notices, idempotent/read-preserving table-ready notices, invalid staff
profiles and manager restrictions. No Firebase connection or real data mutation.
Concurrent multi-client transactions, security rules, offline behavior and physical
iPhone appearance still require manual testing. No runtime/device result is claimed
from TypeScript or a successful Metro bundle.

Validation on 2026-10-05: TypeScript passed; changed-file Expo ESLint passed;
nine service tests passed; Metro built the iOS bundle containing all seven route
components. Automated checks did not write/delete Firestore records; physical
results are reported separately below.

## Direct device testing

Run npx expo start and open the assigned routes with Expo Router deep links.
Edit / Cancel Booking requires selecting a reservation from My Bookings first.
The root starter route is restored to the common Firebase base. Temporary manager
Authentication and staff profile cleanup was confirmed successful by the owner.

## Reported physical iPhone results

The owner reports successful queue creation/tracking (position 1, estimated wait,
party size and joined time), viewing and cancelling an existing reservation,
and displaying queue-join and cancellation notifications. Staff Authentication,
matching active manager profile validation, navigation to Staff Accounts and
manager profile display also passed. These are owner-reported physical results;
remaining negative cases and integrated flows below still require testing.

## Additional physical iPhone/Firebase checklist

1. Use an existing signed-in customer session from the completed customer module,
   with a valid users/{uid} profile. An isolated fresh install with no session shows
   sign-in-required; general customer login is another member's unmerged placeholder.
   Do not fake authentication. Validate customer flows before staff sign-in replaces
   the session. Fresh-session end-to-end testing needs the customer module later.
2. Join with valid name/phone, party size and seating; check the shared queue schema,
   then try joining again/from another device. Exactly one active entry should remain.
3. From an authorized second client, change only the disposable test entry from
   waiting to called to seated. Verify tracking, position/wait, notices, mark-read,
   mark-all-read and no duplicate table-ready notice after reopening tracking.
4. Test Leave confirmation and cancellation history; rejoin with a new entry.
5. Use only the customer's disposable future reservation to test changes/cancellation.
   Verify createdAt/customerId and optional table fields remain; notices and kitchen
   change alert are written. Confirm another customer's reservation ID is inaccessible.
   **Do not change or cancel the real Buddhi Gayashan reservation.**
6. Test Upcoming/Past bookings, empty lists, missing optional fields, invalid/past
   date/time, double taps, offline errors and denied permissions.
7. Owner provisions disposable Auth accounts and matching staff profiles in Console:
   active manager, active staff/kitchen, inactive account and a user without a profile.
   Test each login path, manager search/add/edit/toggle, denial for other roles, and
   self-deactivation protection. Credentials must never be placed in source files.
8. Compare every screen with the five approved PNGs on iPhone; verify safe areas,
   keyboard scrolling, button size, notification read states and customer navigation.
9. After later integration, test customer join → Pankaja operations → customer live
   tracking, and booking edit → kitchen visibility/alerts. Those other feature screens
   remain placeholders here, so their end-to-end flows are not claimed tested.

Use owner-managed disposable records/accounts for mutation checks and record their
exact IDs for manual cleanup. No fixtures are automatically seeded, no real existing
reservations are changed during automated checks.
