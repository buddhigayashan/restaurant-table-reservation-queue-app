# Reservations services

Reserved for shared reservations operations when this feature is implemented.
Future services should import db from '@/config/firebase'.
customer.ts creates a customer reservation at reservations/{id}. The form retains
one generated reference across retries and uses server timestamps for writes.
Reservation listing, editing, cancellation, capacity, and staff management are
outside this module.
