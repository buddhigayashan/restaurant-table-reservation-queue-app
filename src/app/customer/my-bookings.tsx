import { useState } from 'react';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { AccessState, BookingCard, Button, Choices, ModuleScreen, RecordState, styles } from '@/components/vimandya/module-ui';
import { useModuleAccess, useNow, useRecords } from '@/features/vimandya/hooks';
import { editableBooking } from '@/features/vimandya/validation';
import { listenCustomerBookings } from '@/services/reservations/customer';

export default function MyBookingsScreen() {
  const access = useModuleAccess('customer');
  const state = useRecords(access.uid, listenCustomerBookings);
  const now = useNow();
  const [tab, setTab] = useState('Upcoming');
  const records = state.rows.filter(booking => editableBooking(booking, now) === (tab === 'Upcoming'));
  if (tab === 'Past') records.reverse();
  return <ModuleScreen title="My bookings" active="Bookings">
    <AccessState access={access} />
    {access.uid && <>
      <Choices options={['Upcoming', 'Past']} value={tab} onChange={setTab} />
      <RecordState state={state} empty="You have no reservations yet." />
      {!state.loading && !state.error && state.rows.length > 0 && records.length === 0 && <Text style={styles.muted}>No {tab.toLowerCase()} bookings.</Text>}
      {records.map(booking => <BookingCard key={booking.id} booking={booking} onPress={editableBooking(booking, now) ? () => router.push({ pathname: '/customer/edit-cancel-booking', params: { reservationId: booking.id } }) : () => router.push({ pathname: '/customer/booking-confirmation', params: { id: booking.id } })} />)}
      <Button title="+ New booking" onPress={() => router.push('/customer/booking-form')} />
    </>}
  </ModuleScreen>;
}
