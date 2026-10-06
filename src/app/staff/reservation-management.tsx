import { useState } from 'react';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { ReservationRow, StaffAccess, StaffButton, StaffChips, StaffDataState, StaffDates, StaffField, StaffScreen, ui } from '@/components/staff/operations-ui';
import { useStaffAccess, useStaffRecords } from '@/features/staff-operations/hooks';
import { localDate } from '@/features/staff-operations/helpers';
import { listenOperationalReservations } from '@/services/staff/operations-listeners';

export default function ReservationManagementScreen() {
  const access = useStaffAccess();
  const records = useStaffRecords(access.uid, listenOperationalReservations);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(localDate());
  const [status, setStatus] = useState('All');
  const rows = records.rows.filter(item => item.date === date && item.customerName.toLowerCase().includes(search.toLowerCase()) && (status === 'All' || item.status === status)).sort((a, b) => a.time.localeCompare(b.time));
  return <StaffScreen title="Reservations" active="Reservations">
    <StaffAccess state={access} />
    {access.uid && <>
      <StaffField label="Search reservations" value={search} onChangeText={setSearch} placeholder="Customer name" />
      <StaffDates selected={date} onChange={setDate} />
      <StaffField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} autoCapitalize="none" />
      <StaffChips values={['All', 'confirmed', 'pending', 'arrived', 'seated', 'completed', 'cancelled', 'no_show']} selected={status} onChange={setStatus} />
      <StaffDataState state={records} empty="No reservations yet." />
      {!records.loading && !records.error && records.rows.length > 0 && !rows.length && <Text style={ui.muted}>No reservations match these filters.</Text>}
      {rows.map(item => <ReservationRow key={item.id} item={item} onPress={() => router.push({ pathname: '/staff/reservation-details', params: { reservationId: item.id } })} />)}
      <StaffButton title="Booking history" outline onPress={() => router.push('/staff/booking-history')} />
    </>}
  </StaffScreen>;
}
