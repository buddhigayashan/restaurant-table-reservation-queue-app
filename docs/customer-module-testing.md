# Wijesinghe customer module

Reference: docs/ui-reference/customer contains the four approved report images and
README. The wireframes define layout; high-fidelity overviews guide the small green
accents. Original illustrations and restaurant photo were not supplied separately,
so native illustration shapes and the approved restaurant image placeholder are used.

Opening / or /customer redirects to /customer/onboarding. The original Expo
starter component is retained in src/app/(starter)/index.tsx for reference.

## Reported physical iPhone verification

On 5 October 2026, the project owner reported successful Expo Go checks for
onboarding, sign-up, login, customer Home, booking submission, and confirmation.
They verified the Auth user, users/{uid} profile fields, reservations/{id} fields,
and UID linkage between Auth, the profile, and the reservation. These are manual
results reported by the owner; automated checks do not create Firebase data.
Password-reset email, persistent login, network retries, and the error cases
below still require their own manual checks.

## Manual Expo Go checks

1. Complete onboarding Next, Back, Skip, Get Started, and existing-account Login.
2. Check all forms on a small iPhone with keyboard open, scrolling, and larger text.
3. Check empty fields, malformed email/phone, short password, and mismatch errors.
4. Sign up using a test account. Inspect users/{uid}: uid, name, email, phone,
   customer role, server createdAt; no password fields.
5. Log in with valid and invalid credentials; check understandable errors.
6. Request a password reset and verify the email/link and return to Login.
7. Restart Expo Go and verify persistent login; Home should use the profile name.
8. Check home time chips pass their selection into the booking form.
9. Check missing date/time, past date/time, guest minimum, and request length.
10. Book with a test account. Tap twice rapidly: only one reference should be used.
    Inspect reservations/{id}: customer data, date/time, guests, requests, confirmed
    status, and server timestamps. Compare confirmation details to the document.
11. Simulate network failure and retry; inspect for duplicate reservations.
12. Follow My Bookings, Join Queue, Alerts, Profile links. Destinations remain
    the other members' blank placeholders, which is expected.
13. Open confirmation without parameters: it must not claim a booking was made.

## Limits

No live table/wait source or allocation rules are implemented in this member module.
Home displays unavailable values rather than example numbers. Time chips reproduce
the reference selections, not verified restaurant opening hours or capacity.
The form uses device-local date/time; restaurant timezone rules need team agreement.
Booking confirmation displays the result of a successful write, not an email-delivery
claim. Calendar integration and real entrance QR validation are outside this scope;
no fake scannable code is shown. The calendar control is explicitly disabled.

Firestore rules must allow customers to create/read their own profile and create
their own reservations while preventing self-assignment of staff privileges.
Rules, role security, actual reservation capacity, and integration with staff/table
management must be reviewed before production use. No rules were deployed here.
No real Auth account or Firestore write is performed by automated local checks.
