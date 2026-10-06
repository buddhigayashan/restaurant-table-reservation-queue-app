import { useState } from 'react';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { ReservationRow, StaffAccess, StaffChips, StaffDataState, StaffField, StaffScreen, ui } from '@/components/staff/operations-ui';
import { useStaffAccess, useStaffClock, useStaffRecords } from '@/features/staff-operations/hooks';
import { historical, localDate } from '@/features/staff-operations/helpers';
import { listenOperationalReservations } from '@/services/staff/operations-listeners';

export default function BookingHistoryScreen() {
  const access = useStaffAccess();
  const now = useStaffClock();
  const records = useStaffRecords(access.uid, listenOperationalReservations);
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('All');
  const rows = records.rows.filter(item => historical(item, localDate(now)) && (!date || item.date === date) && (status === 'All' || item.status === status)).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  return <StaffScreen title="Booking history" active="Reservations" back><StaffAccess state={access} />{access.uid && <>
    <StaffField label="Filter date (YYYY-MM-DD, blank for all)" value={date} onChangeText={setDate} placeholder="All dates" autoCapitalize="none" />
    <StaffChips values={['All', 'completed', 'cancelled', 'no_show']} selected={status} onChange={setStatus} />
    <StaffDataState state={records} empty="No booking history." />
    {!records.loading && !records.error && records.rows.length > 0 && !rows.length && <Text style={ui.muted}>No historical reservations match these filters.</Text>}
    {rows.map(item => <ReservationRow key={item.id} item={item} onPress={() => router.push({ pathname: '/staff/reservation-details', params: { reservationId: item.id } })} />)}
  </>}</StaffScreen>;
}
