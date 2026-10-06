# Final route and application-shell audit

Authority: Milestone 01 FR1-FR9 and synchronization/usability requirements; Milestone 02 selected flows and approved reference packs under `docs/ui-reference/`. Restaurant management additions follow Hewamaramage `page_14.png` (report printed page 12). Audited on `integration/final-app`; physical integrated-device testing is pending.

## Every route

All area/root layouts are production navigators with native Stack headers hidden. Screens render approved custom headings. No duplicate, blank, unreachable required route or development launcher remains. `/explore` is a compatibility redirect; its Expo demo is excluded from production. `/` and `/customer` are intentional entry aliases, not duplicate implementations.

| Route | Classification | Entry source | Back/exit destination | Auth requirement | Bottom navigation / selected tab | Header |
| --- | --- | --- | --- | --- | --- | --- |
| `/explore` | intentionally unused legacy redirect | Legacy deep link only | Root | Public redirect | None | Redirect |
| `/` | production redirect alias | App launch | None | Public/session-aware | None | Redirect |
| `/customer/booking-confirmation` | production implemented | Booking success; historical booking; reservation notice | /customer/my-bookings | Customer; owned reservation id | None | Custom |
| `/customer/booking-form` | production implemented | Home Book a Table; My Bookings New booking | /customer/home | Customer | None | Custom |
| `/customer/change-password` | production implemented | Profile | /customer/profile | Customer; password reauthentication | Profile | Custom |
| `/customer/edit-cancel-booking` | production implemented | Editable upcoming booking | /customer/my-bookings | Customer; owned future reservationId | Bookings | Custom |
| `/customer/edit-personal-details` | production implemented | Profile | /customer/profile | Customer | Profile | Custom |
| `/customer/help-support` | production implemented | Profile | /customer/profile | Customer | Profile | Custom |
| `/customer/home` | production implemented | Customer sign-up/login; Home tab | None (tab) | Customer | Home | Custom |
| `/customer` | production redirect alias | Customer-area deep link | None | Public/session-aware | None | Redirect |
| `/customer/join-queue` | production implemented | Home Join Queue; queue screen | /customer/home | Customer | Queue | Custom |
| `/customer/live-queue-tracking` | production implemented | Join success; Queue tab; queue notice | Home button | Customer; owned entryId | Queue | Custom |
| `/customer/login` | production implemented | Get Started, logout, staff login | None | Public; signed-in users redirect to role home | None | Custom |
| `/customer/my-bookings` | production implemented | Bookings tab; confirmation | None (tab) | Customer | Bookings | Custom |
| `/customer/notification-settings` | production implemented | Profile | /customer/profile | Customer | Profile | Custom |
| `/customer/notifications` | production implemented | Notifications tab; Home bell | None (tab) | Customer | Notifications | Custom |
| `/customer/onboarding` | production implemented | Root, customer index | Previous slide within onboarding | Public; signed-in users redirect to role home | None | Custom |
| `/customer/profile` | production implemented | Profile tab | /customer/home | Customer | Profile | Custom |
| `/customer/reset-password` | production implemented | Customer Login | /customer/login | Public; signed-in users redirect to role home | None | Custom |
| `/customer/sign-up` | production implemented | Customer Login | Login link | Public; signed-in users redirect to role home | None | Custom |
| `/kitchen/alerts` | production implemented | Alerts tab | None (tab); My account exit | Active kitchen/manager/staff | Alerts | Custom |
| `/kitchen/today` | production implemented | Today tab | None (tab); My account exit | Active kitchen/manager/staff | Today | Custom |
| `/kitchen/upcoming-reservations` | production implemented | Kitchen login; Upcoming tab | None (tab); My account exit | Active kitchen/manager/staff | Upcoming | Custom |
| `/staff/account-management` | production implemented | Manager Dashboard/Profile | /staff/dashboard | Active manager only | None | Custom |
| `/staff/alerts` | production implemented | Alerts tab; Dashboard | None (tab) | Active manager/staff | Alerts | Custom |
| `/staff/booking-history` | production implemented | Dashboard; Reservation Management | /staff/dashboard | Active manager/staff | Reservations | Custom |
| `/staff/dashboard` | production implemented | Manager/staff login; Dashboard tab | None (tab) | Active manager/staff | Dashboard | Custom |
| `/staff/guest-status` | production implemented | Reservation Details | Selected Reservation Details; reservation list if no ID | Active manager/staff; reservationId | None | Custom |
| `/staff/login` | production implemented | Customer Login, staff/kitchen logout | Customer Login button | Public; signed-in users redirect to role home | None | Custom |
| `/staff/profile` | production implemented | Dashboard/Alerts account icon; Queue/Kitchen My account | Role home: Dashboard or Kitchen Upcoming | Any active staff role | None | Custom |
| `/staff/queue-management` | production implemented | Queue tab | None (tab) | Active manager/staff | Queue | Custom |
| `/staff/reports-analytics` | production implemented | Manager Dashboard | /staff/dashboard | Active manager only | None | Custom |
| `/staff/reservation-details` | production implemented | Reservation Management; History; alert | /staff/reservation-management | Active manager/staff; reservationId | None | Custom |
| `/staff/reservation-management` | production implemented | Dashboard action; Reservations tab | None (tab) | Active manager/staff | Reservations | Custom |
| `/staff/restaurant-settings` | production implemented | Manager Dashboard | /staff/dashboard | Active manager only | None | Custom |
| `/staff/table-floor-management` | production implemented | Tables tab; Dashboard; Table Setup | None (tab); editors close inline | Active manager/staff | Tables | Custom |
| `/staff/table-setup` | production implemented | Manager Dashboard | /staff/dashboard | Active manager only | None | Custom |
| `/staff/walk-in-registration` | production implemented | Dashboard Walk-in | /staff/dashboard | Active manager/staff | None | Custom |

## Session and navigation decisions

Unauthenticated `/` -> onboarding -> Get Started -> Login. Login exposes Sign Up, Forgot Password and Staff Sign In. Sign-up/login success replaces to Home. Reset sends a Firebase email and displays useful success/error feedback; its back destination is Login. Existing valid sessions redirect public screens to the customer's Home, staff/manager Dashboard, or Kitchen Upcoming after profile loading. Area guards render loading before protected UI, require active matching staff profiles, and redirect wrong roles; invalid profiles expose no management controls. Logout uses Firebase signOut followed by replace. History returning to a protected screen cannot bypass the guard.

Customer footer: Home, Queue, Bookings, Notifications, Profile. One component owns destinations and selection; Notifications accepts the existing Alerts active alias. Detail/edit screens use explicit back destinations rather than uncertain browser/stack history. Read-only historical bookings open owned booking details. Notice taps mark unread notices read, then open owned reservation/queue details with the receiving route's correct parameter name. Already-read notices with no target are disabled because they have no further action.

Staff footer: Dashboard, Reservations, Tables, Queue, Alerts. Dashboard exposes walk-in, history, profile and manager tools. Account Management, Restaurant Settings, Table Setup and Reports are manager-only routes and manager-only write services where applicable. Kitchen footer: Upcoming, Today, Alerts. Every kitchen screen exposes My account -> read-only Staff Profile -> Firebase Sign Out -> Staff Login. Kitchen users cannot access manager tools or restaurant operations.

All four shared shells use a white safe-area view, scrolling content, iOS keyboard avoidance, handled keyboard taps, suitable page padding and a single footer inside the safe area. Staff shell now explicitly uses a dark status bar. Primary buttons share black backgrounds, minimum 52px height and 12px radius. Inputs/cards retain approved layout families. Actual notch, keyboard, gesture and home-indicator behavior still require an iPhone.

## Completeness fixes

- Excluded Expo demo through a compatibility redirect.
- Signed-in public-screen redirects and profile-loading guard eliminate return-to-onboarding loops.
- Explicit customer/staff detail back destinations, including kitchen-safe profile exit.
- Linked notification cards and read-only historical booking cards to real owned records.
- Kept fixed Reservation details heading and shared walk-in wait calculation.
- Completed previously blank Restaurant Settings: weekly opening/closing hours and enabled days, intervals, max party size, closed dates, validation and manager-only persistence.
- Completed Table Setup: real tables/seating totals, selectable grid, directional position changes, round/square shapes, reset unsaved changes, save layout, links to guarded add/edit/delete table operations. No fake tables are seeded.
- Completed Reports: Today/last 7 days/last 30 days, actual no-show rate, expected guests, completions per current table, stored queue estimates, peak-hour bars, date trends and evidence-based busiest-hour advice. No fabricated historical comparisons or measured wait durations.
- Arrived guests receive an idempotent table-ready customer notice whether assignment precedes or follows arrival; retries preserve its read state.
- Replaced outdated architecture-only service READMEs; reviewed all TODO/placeholder search matches. Remaining input placeholders, empty-state null returns and Firebase unavailable error handlers are intentional.

## Data compatibility

Existing `reservations`, `queueEntries`, `tables`, `customerNotifications`, `staffAlerts`, `kitchenAlerts`, `users`, `staffAccounts` retain shared ownership, date/time and status fields. No incompatible replacement schema was introduced. `restaurantSettings/general` adds openingHours (7 Sunday-first day records with enabled/open/close), bookingIntervalMinutes (15/30/60), maxPartySize (1-20), closedDates (YYYY-MM-DD), updatedAt. Forms listen to settings; reservation creation/edit transactions enforce saved policy; cancellation remains possible after a restaurant closure. Missing settings preserve the legacy service behavior, while forms start with existing 17:00-21:00 half-hour choices.

`tables` optionally adds layoutRow (0-49), layoutColumn (0-3), shape (round/square). Layout writes preserve status/capacity/reservation links and reject overlapping positions, deleted tables and non-manager writes. Current layout save supports up to 100 tables. Queue readers optionally decode joinedAt/updatedAt timestamps for reports; legacy untimestamped entries remain operational but do not fabricate dated report evidence.

Table writes and wait estimates continue to use shared integrated services. Reservation status compatibility includes legacy pending/reserved read values and production confirmed/arrived/seated/completed/cancelled/no_show writes. Queue statuses remain waiting/called/seated/cancelled. Customer reservation and queue changes are reflected in staff/kitchen/customer listeners. Reports are derived reads, not another store of counters.

## Validation and practical limits

TypeScript: passed. Full lint: passed without warnings. Tests: 51 passed (all member services, integration, 6 navigation/static checks and 6 management regressions). Automated tests mock Firebase and do not touch live data. iOS Hermes bundle: passed, 1,235 modules; exported to ignored `.expo/final-audit-ios`.

This is implementation-ready for integrated physical testing, not an assertion of release readiness. Calendar remains implemented, explicitly development-build-only for SDK 57 and handled gracefully in Expo Go; booking never depends on calendar access. Server Firestore rule hardening, live-rule/index validation, SMS/push, scheduled reminders/no-show jobs, measured wait telemetry, restaurant-timezone configuration and future-slot capacity scheduling remain release/integration limitations. The original restaurant interior bitmap was not supplied; Home retains the approved neutral image area. Floor arranging uses mobile directional controls rather than a drag gesture. Reports show stored estimates, not measured waits.

Client role checks do not replace server rules. Rules must allow customers to read restaurantSettings/general and managers to write it plus optional table-layout fields. No rules were deployed and no real Firestore records were altered during this audit. Settings save and all other writes occur only after a user's explicit action.

## Exact remaining physical tests

1. Fresh unauthenticated launch, all onboarding slides, Get Started, Sign Up/Login/Reset links and reset email delivery.
2. Customer create booking -> saved confirmation -> My Bookings; edit/cancel, past read-only details, back destinations and retry states.
3. Customer Join Queue -> tracking; separate staff session calls/seats/cancels -> realtime customer state/notice; leave and rejoin; walk-in interleaving and wait consistency.
4. Notification read/all-read and target navigation; preferences persistence and inbox filtering.
5. Profile name/phone persistence in Home, password reauthentication, settings/help and logout; gesture Back after logout must remain guarded.
6. Manager/staff login, missing/inactive staff denial, role redirects on public/deep-linked routes, manager-only rejection for ordinary staff/kitchen.
7. Staff Dashboard counts, reservation search/date/status, assign table before AND after arrival, one table-ready notice, seated/completed/no-show/cancel status and linked table/history effects.
8. Tables add/edit/status/delete guards, queue actions, walk-in, alerts read state, Staff Accounts metadata-only CRUD and Staff Profile exit.
9. Manager Restaurant Settings save/reopen, invalid hours/closed dates, customer form/live policy enforcement and existing booking cancellation after policy change.
10. Manager Table Setup select/move/shape/reset/save/reopen; capacity/status/link preservation; add/edit links and collision guards.
11. Reports periods/empty/error states, real record totals, dated queue trends and absence of fabricated waits.
12. Kitchen Upcoming 14 scrolling days (including 2026-10-12 when in range), Today next-hour counts, alert acknowledgement, all tabs and account logout.
13. On all roles: notch/Dynamic Island, home indicator, dark status bar, exactly one title/footer, long names/large text, keyboard scrolling, empty/error/offline/retry behavior.
14. Development build only: Calendar unsupported-Go feedback, denied/granted permission, correct event time/reminder and repeated-tap protection.

The existing full integration checklist in `docs/final-integration-testing.md` remains applicable. No code was staged, committed or pushed by this audit; main and member refs remain unchanged.

Final Git snapshot: 57 modified tracked files, 21 new files, zero staged files. Integration HEAD remains `79a7437`; main and all four member refs are unchanged. No commit or push was made during the audit.
