# Visual polish review

Branch: `integration/final-app`. Visual work remains unstaged and uncommitted. Physical iPhone visual review is pending.

## Shared visual system

`src/constants/restaurant-theme.ts` defines cream #FFF8F0, sand #F4E8D8, terracotta #C96B43, olive #3F5A46, gold #D4A24C, cocoa #2B2118 and white #FFFFFF. Muted text is #6E6258, darkened for contrast on sand. Primary button terracotta is #A84F2E for readable white labels. Semantic green, amber, muted red and teal use pale backgrounds with readable labels. Spacing, radii, type sizes, cards, input heights and button styling are shared. `src/constants/theme.ts` retains legacy exports and reexports the new theme.

Shared shells/components: customer UI, staff operations UI, common operations UI, Vimandya module UI, AppNavigation, AppIcon, SettingsRow and StatusBadge. Root navigator and splash background match the cream canvas. No native headers were reenabled.

## Bundled photography

Three local JPEGs in `assets/images/restaurant/`: onboarding-booking.jpg, onboarding-queue.jpg, onboarding-ready.jpg. Total approximately 730 KiB. `restaurant-images.ts` uses static local requires; Home reuses the booking photograph. All three were inspected. License/source details are in the asset README. These are generic illustrative restaurant photographs, not representations of the actual restaurant, its availability or branding. No additional images are required.

Onboarding retains its three approved messages and existing Skip/Next/Back/Get Started flow. Large rounded images, readable dark overlay captions, warm progress indicators and primary actions replace prototype cards. The queue-number overlay is explicitly labeled a preview. Home retains real availability/wait data and existing actions, with a restaurant hero, greeting and compact semantic summary cards. No invented open status was added.

## Screen coverage

Direct route styling/markup changes during this pass:

- Customer: onboarding, login, sign-up, home, booking-form, booking-confirmation, my-bookings, live-queue-tracking, notifications, profile, edit-personal-details, change-password, notification-settings.
- Staff: login, dashboard, reservation-details, guest-status, table-floor-management, queue-management, walk-in-registration, alerts, account-management, profile, restaurant-settings, table-setup, reports-analytics.
- Kitchen: upcoming-reservations, today, alerts.

Other production pages inherit the same shared shell/card/input/button/navigation styling: reset-password, join-queue, edit-cancel-booking, help-support, reservation-management and booking-history. Route names/entry/back destinations remain documented in `final-route-audit.md`.

Booking confirmation uses a professional green success area and real reservation-status summary. Queue position has a prominent status-colored panel. Notifications and operational alerts use narrow contextual accents with labeled read/status states. Profile uses a circular initials avatar and consistent settings rows. Operational screens retain efficient lists/grids without large photography. Kitchen Today highlights actual expected guests in olive. Reports preserve real analytics and use restrained terracotta bars. Floor layout preserves coordinates and table shapes.

Bottom navigation uses consistent icons, muted inactive labels, terracotta active states, subtle borders/shadow and existing safe-area handling. Public auth/onboarding pages remain without tabs. Back buttons use rounded subtle backgrounds and accessible touch targets.

## Semantic status system

- Reservations: confirmed/seated/completed green, arrived teal, cancelled muted red, no-show amber.
- Tables: available green, reserved gold/amber, occupied terracotta, cleaning teal.
- Queue: waiting amber, called/seated green, cancelled muted red.
- Alerts: info teal, medium amber, high muted red.

All statuses retain readable text. Contrast tests enforce at least 4.5:1 for tested text/surface combinations, including primary white labels and muted text on cards/cream/sand.

## Safety and validation

Pre-polish snapshots verified services, schemas/types, Firebase configuration, validation and hooks byte-for-byte unchanged. The session guard differs only in background colors; authentication behavior is identical. Route event-handler expressions and router navigation calls were compared against the pre-polish AST snapshot. All local branch tips remain unchanged. No real Firestore data was modified by this work.

- TypeScript: passed.
- Full lint: passed without warnings.
- All tests: 54 passed, including existing service/integration/navigation tests and three new visual-theme/contrast/local-asset checks.
- iOS/Hermes export: passed, 1,254 modules, all three JPEGs included. Output `.expo/visual-polish-ios` is ignored.
- Calendar remains development-build-only where required, with existing graceful Expo Go fallback.

No physical visual testing is claimed. A browser screenshot remained on the asynchronous account-loading guard; it was not treated as screen-level visual verification.

## Physical iPhone review still required

1. Review all three onboarding images/copy and CTA visibility on small iPhone sizes; swipe/scroll and Next/Back/Skip remain usable.
2. Check Home hero cropping, actual summaries and primary/secondary actions.
3. Check booking/edit form keyboard behavior, selected date/time contrast, confirmation and Calendar fallback.
4. Review waiting/called/seated/cancelled queue panels with real realtime state updates.
5. Check customer profile/subpages, notifications, all five tabs and safe-area/home-indicator spacing.
6. Review staff lists, colored table grid, walk-in selectors/summary, alerts, dashboard and manager settings/floor/reports.
7. Review Kitchen Upcoming 14-day selector, Today count and Alerts; verify account exit.
8. Exercise existing authentication, role routing, logout and integration checklist from `final-route-audit.md`.

Nothing was staged, committed, pushed or merged during this pass. Main and member branch tips were not changed.
