import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { AccessState, BookingCard, Button, Feedback, Field, ModuleScreen, PartySize, RecordState, styles } from '@/components/vimandya/module-ui';
import { useModuleAccess, useNow, useRecords, useTask } from '@/features/vimandya/hooks';
import { editableBooking } from '@/features/vimandya/validation';
import { changeCustomerBooking, listenCustomerBookings } from '@/services/reservations/customer';
import type { BookingChanges, CustomerBooking } from '@/types/vimandya';

export default function EditCancelBookingScreen() {
  const { reservationId } = useLocalSearchParams<{ reservationId?: string }>();
  const access = useModuleAccess('customer');
  const state = useRecords(access.uid, listenCustomerBookings);
  const booking = state.rows.find(item => item.id === reservationId);
  return <ModuleScreen title="Manage booking" active="Bookings" back>
    <AccessState access={access} />
    {access.uid && <>
      <RecordState state={state} empty="No booking found." />
      {!state.loading && !state.error && !booking && <Text style={styles.error}>Select a reservation from My bookings. Only your bookings are accessible.</Text>}
      {booking && <BookingEditor key={booking.id} booking={booking} />}
    </>}
  </ModuleScreen>;
}
function BookingEditor({ booking }: { booking: CustomerBooking }) {
  const [form, setForm] = useState<BookingChanges>({ date: booking.date, time: booking.time, partySize: booking.partySize, seatingPreference: booking.seatingPreference, specialRequest: booking.specialRequest });
  const [confirm, setConfirm] = useState(false);
  const task = useTask();
  const now = useNow();
  const editable = editableBooking(booking, now);
  return <>
    <BookingCard booking={booking} />
    <Text style={styles.name}>Booking details</Text>
    {!editable && <Text style={styles.muted}>This booking can no longer be changed or cancelled.</Text>}
    <Field label="▣ Date (YYYY-MM-DD)" value={form.date} onChangeText={date => setForm({ ...form, date })} editable={editable && !task.busy} autoCapitalize="none" placeholder="2026-10-12" />
    <Field label="◷ Time (24-hour HH:mm)" value={form.time} onChangeText={time => setForm({ ...form, time })} editable={editable && !task.busy} placeholder="18:30" />
    <PartySize value={form.partySize} onChange={partySize => setForm({ ...form, partySize })} disabled={!editable || task.busy} />
    <Field label="Seating preference" value={form.seatingPreference} onChangeText={seatingPreference => setForm({ ...form, seatingPreference })} editable={editable && !task.busy} />
    <Field label="Special requests" value={form.specialRequest} onChangeText={specialRequest => setForm({ ...form, specialRequest })} multiline editable={editable && !task.busy} maxLength={500} />
    <Feedback task={task} />
    <Button title="Save Changes" disabled={!editable || task.busy} onPress={() => task.run(async () => { await changeCustomerBooking(booking.id, form); router.replace('/customer/my-bookings'); })} />
    <Button title="Cancel Booking" outline disabled={!editable || task.busy} onPress={() => setConfirm(true)} />
    {confirm && editable && <View style={styles.card}><Text style={styles.name}>Cancel this booking?</Text><Text style={styles.muted}>Your reservation history will be kept.</Text><Button title="Confirm cancellation" disabled={task.busy} onPress={() => task.run(async () => { await changeCustomerBooking(booking.id, null); router.replace('/customer/my-bookings'); })} /><Button title="Keep booking" outline onPress={() => setConfirm(false)} /></View>}
  </>;
}
