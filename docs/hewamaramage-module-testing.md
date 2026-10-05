# Hewamaramage staff operations

IT23831490 – Hewamaramage H.M.C.S. Branch `hewamaramage-staff-operations`.
Started from clean common Firebase commit `5c68707`; pulled the existing upstream
without merging any completed member feature branch. No new dependencies,
Firebase config changes, security-rule deployments or backend were introduced.

## Approved design and requirements

Inspected both local project reports in `C:/Users/User/Documents/Downloads/`:
`IT3060HCI2026_Milestone01_Group_WE_129.pdf` (printed pages 24–26) and
`IT3060HCI2026_Milestone02_Group_WE_129.pdf` (workload table and supplied staff
design pages). FR6 staff overview/operations; FR7 explicit arrived/seated/closed
transitions; FR8/9 shared reservation updates and kitchen inbox notices.
NFR1/3 snapshot synchronization; NFR2 honestly approximate wait; NFR4 approved
mobile structures; NFR6 staff profile/role checks. NFR5 peak-load testing and
automatic no-show scheduling remain future work; no automatic no-show engine.

Reference pack extracted to `docs/ui-reference/hewamaramage/`. All eight PNGs
and README inspected: page_10 (Dashboard/Reservations C), page_11 (Details C,
Guest Status), page_12 (Tables A), page_13 (Walk-in/Alerts C), page_14 (context
only), page_18 (authoritative selected staff wireframes), extra page_19 (context
only), page_22 (shared high-fidelity styling). Page_11's “Booking history” heading
actually shows Guest Status; this module uses that selected status flow and
approved reservation card language for a read-only history list. No settings,
advanced floor layout, reports, Login or account-management CRUD implemented.

## Routes

Existing routes implemented:

- `/staff/dashboard`
- `/staff/reservation-management`
- `/staff/reservation-details?reservationId=DOCUMENT_ID`
- `/staff/guest-status?reservationId=DOCUMENT_ID`
- `/staff/booking-history`
- `/staff/table-floor-management`
- `/staff/walk-in-registration`
- `/staff/alerts`

New necessary personal route: `/staff/profile` reads only the current account.
No personal account route existed; `/staff/account-management` belongs to
Vimandya and was left unchanged. Login and operational Queue remain placeholders
on this isolated branch. Approved navigation links to those existing routes for
later integration. Details/Guest Status require selection of an existing record.

## Firestore collections and compatibility

- `staffAccounts/{uid}`: uid, fullName, email, role, isActive. Operations require
  matching UID/email, active profile and staff/manager role; read-only personal
  profile also accepts active kitchen staff. No manager profile CRUD or Auth
  credential creation. Writes recheck staff authorization inside transactions.
- `reservations`: preserves customerId/customerName/customerEmail/date/time/
  partySize/seatingPreference/specialRequest/status/createdAt/updatedAt. Missing
  optional phoneNumber/tableId/tableNumber/activity fields are tolerated. Reads
  include existing Wijesinghe reservations without importing his branch.
  Operational statuses: confirmed, arrived, seated, completed, cancelled, no_show;
  existing pending/reserved records are supported. Terminal records cannot reopen.
  Arrival/seating require today's date; no-show requires elapsed arrival time.
  Optional activity array stores status, staffUid and device Timestamp for the
  displayed activity log. Server updatedAt remains authoritative; log clock is
  approximate. No reservation is deleted.
- `tables`: tableNumber, capacity, status, area, createdAt, updatedAt, same Pankaja
  schema and available/reserved/occupied/cleaning statuses. Optional reservationId
  lock is added only by assignment and cleared on release. Assignment checks
  capacity, current table status and other existing active links. Seating occupies
  the table; completion releases to cleaning, cancellation/no-show releases an
  unoccupied reservation table to available. Reassignment releases the old table.
  Add/edit/status/delete use modular services; deletion requires UI confirmation
  and refuses occupied/reserved/actively linked tables. History links are retained.
- `tableNumbers/{NORMALIZED_NUMBER}`: small uniqueness guard; existing tables are
  checked too. Create/rename/delete update guard in the same transaction. Pankaja
  table service integration must reconcile this guard and optional assignment lock;
  external writers bypassing them can still introduce duplicate numbers/conflicts.
- `queueEntries`: customerId=null for walk-ins, customerName, optional phoneNumber,
  partySize, seatingPreference, position, estimatedWaitMinutes, status=waiting,
  joinedAt/updatedAt server timestamps and source=walk_in. Existing customer entries
  are preserved. Compatible terminal statuses called/seated/cancelled are read for
  counts; this module does not implement operational Queue Management.
- `queueState/order`: activeIds plus updatedAt, same serialization guard as
  Vimandya joins. Walk-ins and customer joins through these guards get max active
  position + 1. Estimate is five minutes per position, not a guarantee. Completed
  entries are dropped from activeIds on the next join; history stays. Guard is
  bounded at 200 active entries. Pankaja/external writers not using this guard can
  still race; final integration needs concurrent-client tests.
- `staffAlerts`: type/title/message/severity/read/createdAt, optional reservationId
  or queueEntryId. Reservation operations write reservation_changed, cancellation
  or no_show alerts. A table becoming available writes table_ready. Walk-ins of
  eight or more guests write large_group; five or more active parties write rush.
  Alerts sorted newest first, All/Bookings/Cancellations/Unread filters, individual
  and all read actions. Read state is shared across staff, not per-user. External
  producers may supply new_booking alerts; no automatic booking event observer.
- `kitchenAlerts`: reservation operations write compatible reservation_change or
  cancellation messages (acknowledged=false) for Pankaja's later integration.
- `customerNotifications`: status operations on customer-owned reservations write
  booking_changed notices for Vimandya's later integration, with customerId and
  reservationId. No customer notification screen/queue action is reimplemented.

Dashboard snapshots report today's reservation document count, active queue PARTY
count, occupied/total tables, no-shows, available tables and cancellations. Counts
never use prototype fixture numbers. Rush summary appears only for an unread real
staffAlerts rush record. No fixed forecast is invented. Reservation/date/status
filtering, table grid and alert feed update through collection snapshot listeners.

## Authorization and limitations

Client guards supplement Firestore rules; they cannot protect data against arbitrary
clients when backend rules allow access. Rules are unchanged. Final hardening must
restrict active staff roles, allowed transitions, ownership and guard collections.
The Firebase staff Auth user and matching profile must already exist, and native
Auth persistence must hold a valid staff/manager session. This isolated branch's
Staff Login is intentionally not implemented. A fresh phone without a staff session
will show sign-in-required. Plan a separately authorized temporary sign-in strategy
before further isolated physical tests if needed. No authorization bypass is included.

Realtime whole-collection reads are simple for this academic restaurant dataset;
large deployments need date-window queries, pagination and indexes. Query reads
before transactions detect legacy table/queue links, but external non-cooperating
writers can race. Table assignment is a conservative immediate lock, not a future
time-slot scheduler: even a future confirmed linked reservation blocks table reuse
until released. Optional locks must be reconciled with Pankaja during integration.
No deletion of customer Auth/profile/reservation records, no scheduled jobs, push
notifications, SMS, Admin SDK, secrets or automatically seeded data.

## Automated validation

Run `npx tsc --noEmit` and `node --test tests/hewamaramage-services.test.cjs`.
The tests transpile real service modules against in-memory Firebase mocks. They
cover staff denial, atomic reservation lifecycle, capacity/assignment conflict,
reassignment, no-show timing, cancellation/history, compatible walk-ins/guard,
input rejection, table uniqueness/deletion protection, read alerts and legacy
optional fields. They never connect to Firestore or mutate real customer records.
TypeScript/lint/Metro compilation do not establish physical device or security-rule
success. Owner-reported physical results are recorded below; integration and negative cases
still need validation.

## Reported physical testing results

On 2026-10-06 the project owner confirmed successful iPhone Expo Go testing of
Dashboard realtime counts, reservation search/filter/details, table assignment,
guest status transitions, booking history, table operations, walk-in creation and
wait consistency, realtime alerts/read actions, staff profile and authorization.
The owner also confirmed successful cleanup of temporary Firebase test records and
the temporary Auth manager. These are owner-reported physical results, separate
from automated validation. No testing launcher, provisioning service or root
redirect is included in the production module.

The reservation heading is Reservation details. Walk-in preview, stored and returned
initial wait use estimateWalkInQueue; after submission the saved estimate remains
visible until the next form edit so realtime arrival of that party does not show
the next party's wait alongside the completed submission.

## Production regression and integration checklist

1. Confirm a genuine active staff/manager session and matching profile. Test absent,
   inactive, mismatched email and kitchen-only operational access denial separately.
2. Compare Dashboard C, Reservations/Details C, Guest Status, Tables A, Walk-in C and
   Alerts C with page_18 and sketches; verify safe areas, keyboard scroll, bottom nav.
3. Read real existing customer reservations without altering them. Check customer
   name/date/time/party/special request, selected date (14-day row scroll and typed
   date), search/status filters, missing optional fields and empty/error/retry states.
4. Using ONLY an owner-approved disposable reservation and tables, assign table,
   mark arrived, seated and completed. Check reservation/table atomic updates and
   activity log. Test small, cleaning, occupied/other-assigned tables and invalid
   transition rejection. Confirm no-show disallowed before arrival time.
5. Test cancellation/no-show on disposable bookings, history filters and kitchen/
   customer/staff notices. Never delete normal reservation history or mutate the
   real Buddhi Gayashan reservation during validation.
6. Add/edit a disposable table, test duplicate numbers, set statuses, confirm delete
   unused table and reject deletion of linked/occupied table. Check Pankaja schema.
7. Register a disposable walk-in with optional phone, party choices and 8+ exact
   input. Verify customerId=null, source, waiting status, timestamps, next position
   and wait. Confirm coexistence with customer-created entries without edits.
8. Verify alerts filters/read/all-read, table-ready/large-group/rush/no-show alerts,
   newest first and realtime changes; check profile read-only fields.
9. Test concurrent joins/assignments, denied permissions, offline/double taps. Later
   integrate staff login/account screens and customer/kitchen/queue workflows;
   do not claim those unmerged routes work on this branch today.
10. Owner removes only explicitly recorded disposable IDs/accounts after testing.
    Production never seeds records or provides test cleanup controls.
