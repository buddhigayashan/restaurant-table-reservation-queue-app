# Final integration testing

Branch: `integration/final-app`. The four member histories were merged without
squashing. The integrated changes are intentionally uncommitted pending physical
testing. Nothing is merged into `main` or pushed from this integration branch.

Both Milestone 01 requirements (FR1–FR9 and realtime/accessibility/security needs)
and Milestone 02 selected layouts/workload were reviewed. All 22 retained UI
reference images were inspected. Member testing documents describe earlier,
isolated branch behaviour; this document describes the integrated application.

## Preparation

- Run `npm run typecheck`, `npm run lint`, and `npm test`.
- Start `npm start`, scan the QR code on an iPhone, and test keyboard scrolling,
  bottom safe areas, Back, and text readability.
- Use a dedicated customer account and clearly identified reservations/queue
  visits for testing. Do not edit real guests' records. No data is seeded.
- Staff/manager/kitchen Email/Password users must already exist in Firebase Auth,
  with matching `staffAccounts/{uid}` profiles: UID, email, fullName, valid role,
  and `isActive: true`. No test provisioning helper is included.
- Use a second device/session for simultaneous customer and staff queue tests:
  one Firebase Auth session cannot represent two users at the same time.
- All integrated physical checks below are **pending**. Earlier member tests
  reported by the owner do not substitute for final cross-module testing.

## Ordered iPhone checklist

| Step | Action and expected result | Expected Firebase change |
| --- | --- | --- |
| 1 | Open `/`: real customer onboarding, no starter tabs or launcher. Next/Back/Skip preserve three slides. | None |
| 2 | Get Started opens Customer Login. | None |
| 3 | Sign Up creates a customer and opens Home; verify matching UID, name, email, phone and role. | Auth user + `users/{uid}`; no password in Firestore |
| 4 | Profile → Log Out returns to Customer Login; Back cannot expose protected data. | Auth session clears |
| 5 | Log In with correct credentials opens Home; incorrect credentials show an error. | Auth session only |
| 6 | Forgot Password sends a reset email, handles malformed email/network error, and returns to Login. | Auth reset request, no document write |
| 7 | Home shows customer name, live available-table count and queue estimate. Change table/queue state in the staff session to verify refresh. | Reads `tables` and active `queueEntries` |
| 8 | Book a Table: choose future date/time and guests. Tap twice/retry after network failure; ensure one reference/document. | One `reservations/{id}`, confirmation notice; parties ≥8 also create staff/kitchen alerts |
| 9 | Confirmation reads the saved owned document and displays matching details. Try Add to Calendar; see calendar notes below. | Calendar action does not change Firestore |
| 10 | View My Bookings shows the new reservation immediately; Upcoming/Past classification works. | Own-reservation realtime read |
| 11 | Edit the same reservation, preserving owner/createdAt. Test cancellation on a separate booking, preserving history. Changed date/time or insufficient assigned capacity releases the old table. | Same reservation updates; customer, staff and kitchen notices; linked table may become available |
| 12 | Join Queue: valid form creates one active entry. Repeat submit must reject duplicate active membership. | `queueEntries`, `queueState/order`, customer guard, joined notice |
| 13 | Live Queue displays position/wait/party/time. In staff session Call → Seat; customer updates without Refresh. Test Leave Queue on another visit; other parties reorder. | Status transitions and updated ordering; normal history retained |
| 14 | Notifications show joined/table-ready/booking changes; mark one/all read. Reopening tracking must not duplicate called/seated notices. | `customerNotifications.read` only for owned notices |
| 15 | Profile: edit name/phone, verify Home refresh; change password with current-password reauthentication; toggle notification preferences; Help opens. | Allowed `users` fields/preferences and Auth password; no ownership/email changes |
| 16 | Customer Logout clears the session. Attempt direct staff/kitchen/customer protected links while logged out. | Session only; guarded routes request login |
| 17 | Customer Login → Staff member? Sign in. Valid manager/staff enters Dashboard. Missing/inactive/mismatched staff profile denies entry and signs out. | Auth session + own staff-profile read |
| 18 | Dashboard counts reflect today's reservations, active queue, table occupancy/availability and cancellations/no-shows. | Realtime reads, no hardcoded counts |
| 19 | Reservations: search/date/status filters, Details heading `Reservation details`, assign suitable table, arrived → seated → completed. No-show only after arrival. | Reservation/activity + linked table + three separate alert/notification inboxes |
| 20 | Tables: add/edit number/capacity/area, filter statuses, change status, confirm delete only for unused table. Assigned/occupied tables reject unsafe actions. | `tables`, unique `tableNumbers` registry; ready alerts where applicable |
| 21 | Queue: customer and walk-in rows coexist. Call next/customer, seat with adequate available table, cancel. Confirm customer device reacts live. | Shared queue statuses/order/estimates, table occupied, idempotent customer notice |
| 22 | Walk-in: enter guest/party/optional phone and Add to Queue. Preview and saved estimate agree for unchanged queue state. | Compatible queue entry with `customerId: null`, `source: walk_in`; shared ordering; staff alerts for rush/large group |
| 23 | Staff Alerts: filters, chronological groups, read/unread and mark-all actions. | `staffAlerts.read` updates |
| 24 | Staff Profile shows authenticated name/email/role/active state. | Own-profile read |
| 25 | Manager opens Staff Accounts from Dashboard/Profile; search, edit, activate/deactivate another dedicated profile. Ordinary staff/kitchen direct access is blocked. | `staffAccounts` metadata only; no Auth users/passwords created |
| 26 | Sign out, then sign in as kitchen. Login opens Upcoming, not Dashboard or Staff Accounts. | Auth session + active kitchen profile |
| 27 | Kitchen Upcoming: horizontally scroll all 14 calendar dates including today. Select a day containing a reservation (e.g. October 12 when within range), search and verify details. | Shared reservation realtime read |
| 28 | Kitchen Today: today's guests/next-hour totals and special requests match the same reservations. | Realtime reads; cancelled/closed records excluded appropriately |
| 29 | Kitchen Alerts: large-party alert already created by booking; Generate large-group alerts handles older eligible records without duplicates. Acknowledge moves it into acknowledged history. | `kitchenAlerts` creation/acknowledgement; reservations untouched |
| 30 | Kitchen My account → Sign Out returns to Staff Login. Reopen protected links; no old data should display. | Session clears |

Also test missing/empty collections, temporary network loss and retry, inactive
profile changes while a screen is open, invalid form inputs, deep links with an
unknown or another customer's booking ID, and history after cancellation.

## Shared schemas and integration behaviour

- `users/{uid}`: uid, fullName, email, phoneNumber, customer role, createdAt;
  optional updatedAt and `notificationPreferences` (bookingUpdates/queueUpdates).
- `reservations`: customerId/name/email, date `YYYY-MM-DD`, time `HH:mm`, partySize,
  seatingPreference, specialRequest, status, createdAt/updatedAt. Optional tableId,
  tableNumber and staff activity remain backward compatible; released assignments
  may be null. Statuses: confirmed/pending/reserved, arrived, seated, completed,
  cancelled, no_show. Editing/cancelling is limited to an owned active future booking.
- `tables`: tableNumber, capacity, area, available/reserved/occupied/cleaning,
  timestamps; optional reservationId lock. One integrated screen and one guarded
  write implementation. Pankaja's public service names delegate to that implementation.
  `tableNumbers` prevents concurrent duplicate numbers and handles legacy records.
- `queueEntries`: customerId (null for walk-ins), customerName, optional phoneNumber
  and seatingPreference, partySize, position, estimatedWaitMinutes,
  waiting/called/seated/cancelled, joinedAt/updatedAt, optional source/table fields.
  `queueState/order` serializes customer, walk-in and staff operations; per-customer
  guards prevent duplicates. Estimate = next position × 5 minutes. Staff removal
  and customer departure update remaining positions/estimates and preserve history.
- `customerNotifications`: customerId, type, title/message, optional reservationId
  or queueEntryId, read, createdAt. Joined/called/seated/cancelled queue notices use
  deterministic IDs shared by staff actions and customer tracking. Preferences
  control inbox visibility; saved notification history is retained.
- `staffAlerts` and `kitchenAlerts` are separate inboxes. Customer booking changes
  immediately create both; large-party booking creation creates both. Staff
  reservation operations notify the kitchen/customer, and kitchen acknowledgements
  never reset on duplicate generation.
- `staffAccounts/{uid}`: uid/name/email/role/isActive/timestamps. Manager profile
  CRUD does not create Firebase Authentication credentials.

## Calendar verification

SDK 57 `expo-calendar ~57.0.5` requires a development/installed build and is not
supported by Expo Go. Expo Go safely displays explanatory feedback only when the
calendar button is tapped. See the [versioned Expo documentation](https://docs.expo.dev/versions/v57.0.0/sdk/calendar/).

In a development build containing the calendar plugin, test permission denial,
write-only permission on iOS, writable-calendar absence, successful event creation,
30-minute reminder and local start time. Permission is never requested at startup
or during booking. The calendar event lasts 90 minutes; this is an event convenience,
not restaurant capacity enforcement. Repeated taps in the current confirmation
screen are disabled after success. Adding the same event in a later session is an
explicit new action; device calendar deduplication across sessions is not implemented.

## Known limits before release

- Client role/ownership checks and transactions are meaningful app safeguards,
  **not server security enforcement**. Firestore security rules were not changed
  or deployed. Audit rules for own-profile/booking/notification access, active staff
  operations, manager-only profile writes, and cross-inbox writes before release.
- Current wait/home estimates require reads of active queue documents. Restrictive
  production rules should use a public aggregate summary rather than exposing
  other guests' queue records. That backend/rules hardening is not implemented here.
- Restaurant timezone follows the device's local clock. Booking options begin with approved evening slots and follow saved manager hours, intervals and closures; they are not live per-slot inventory.
  Table counts are current availability, not a guarantee for future bookings.
- Assigned tables use conservative active-reservation locks, not a scheduling engine.
- In-app notifications are supported; external SMS, push, automated reminders and
  automatic time-triggered no-show processing are not implemented.
- Home now uses bundled illustrative restaurant photography; see `visual-polish-report.md` and the asset license README. No restaurant identity or open status is invented.
- Restaurant Settings, Table Setup and Reports/Analytics are now implemented manager-only routes; see `final-route-audit.md` for the complete route map and new test steps. The legacy `/explore` route redirects to the real app.
- npm installation reported 34 existing dependency advisories (11 moderate,
  23 high); no audit fix/force upgrade was run. Dependency hardening remains a
  separate release check.
- Automated tests mock Firebase and cannot validate live deployed rules, indexes,
  real email delivery, native calendar permissions or physical rendering.

No temporary launcher, test-account/data helper, private credential, Admin SDK or
service-account file is part of the integrated application. `.env` remains local
and ignored. No live Firestore record/account was changed during integration.

## Final code-level audit additions

See [final-route-audit.md](final-route-audit.md) for all 38 route classifications, explicit back destinations, session handling, completed manager screens and expanded physical test steps. New manager settings/layout/report flows have automated coverage and still need device testing.
