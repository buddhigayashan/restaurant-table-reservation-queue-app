import { palette } from '@/constants/restaurant-theme';
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { OperationFeedback, StaffAccess, StaffButton, StaffDataState, StaffScreen, ui } from '@/components/staff/operations-ui';
import { useOperation, useStaffAccess, useStaffClock, useStaffRecords } from '@/features/staff-operations/hooks';
import { allowedTransitions, arrivalMillis, localDate } from '@/features/staff-operations/helpers';
import { listenOperationalReservations } from '@/services/staff/operations-listeners';
import { updateOperationalReservation } from '@/services/reservations/staff-operations';
import type { ReservationStatus } from '@/types/staff-operations';

export default function GuestStatusScreen() {
  const { reservationId } = useLocalSearchParams<{ reservationId?: string }>();
  const access = useStaffAccess();
  const records = useStaffRecords(access.uid, listenOperationalReservations);
  const now = useStaffClock();
  const task = useOperation();
  const [confirmNoShow, setConfirmNoShow] = useState(false);
  const record = records.rows.find(item => item.id === reservationId);
  const transitions = record ? allowedTransitions(record.status) : [];
  const choices: [ReservationStatus, string][] = [['confirmed', 'Confirm Reservation'], ['arrived', 'Mark Arrived'], ['seated', 'Mark Seated'], ['completed', 'Mark Completed'], ['no_show', 'Mark No-show']];
  return <StaffScreen title="Guest status" back fallback={reservationId ? { pathname: '/staff/reservation-details', params: { reservationId } } : '/staff/reservation-management'}><StaffAccess state={access} />{access.uid && <>
    <StaffDataState state={records} empty="No reservations." />
    {!records.loading && !records.error && !record && <Text style={ui.muted}>Select a reservation first.</Text>}
    {record && <>
      <View style={ui.card}><View style={ui.row}><Text style={[ui.heading, { flex: 1 }]}>{record.customerName}</Text><Text style={ui.badge}>{record.status.replace('_', ' ')}</Text></View><Text style={ui.small}>{record.tableNumber ? `Table ${record.tableNumber}` : 'Unassigned'}</Text><Text style={ui.muted}>{record.date} · {record.time} · Party of {record.partySize}</Text></View>
      <Text style={ui.small}>STATUS</Text>
      {['arrived', 'seated', 'completed'].map((status, index) => <View key={status} style={[ui.row, { paddingVertical: 10 }]}><View style={[ui.icon, { backgroundColor: record.status === status ? palette.cocoa : palette.border }]}><Text style={{ color: record.status === status ? palette.white : palette.muted }}>{index + 1}</Text></View><View><Text style={ui.heading}>{status[0].toUpperCase() + status.slice(1)}</Text><Text style={ui.small}>{record.status === status ? 'Current status' : record.activity.some(item => item.status === status) ? 'Recorded' : 'Not current'}</Text></View></View>)}
      <OperationFeedback task={task} />
      {choices.map(([status, title]) => {
        const disabled = task.busy || !transitions.includes(status) || (['arrived', 'seated'].includes(status) && record.date !== localDate(now)) || (status === 'no_show' && !(arrivalMillis(record) <= now.getTime()));
        return <StaffButton key={status} title={title} outline={status === 'no_show'} disabled={disabled} onPress={() => status === 'no_show' ? setConfirmNoShow(true) : task.run(async () => { await updateOperationalReservation(record.id, { status }); return 'Guest status updated.'; })} />;
      })}
      {confirmNoShow && transitions.includes('no_show') && <View style={ui.card}><Text style={ui.heading}>Record this guest as a no-show?</Text><StaffButton title="Confirm no-show" disabled={task.busy} onPress={() => task.run(async () => { await updateOperationalReservation(record.id, { status: 'no_show' }); setConfirmNoShow(false); return 'No-show recorded.'; })} /><StaffButton title="Keep reservation" outline onPress={() => setConfirmNoShow(false)} /></View>}
      <Text style={ui.small}>ACTIVITY LOG</Text>
      {[...record.activity].reverse().map((event, index) => <Text key={index} style={ui.small}>• {event.status.replace('_', ' ')} · {event.atMillis ? new Date(event.atMillis).toLocaleString() : 'Time unavailable'}</Text>)}
      <Text style={ui.small}>• Booking created · {record.createdAtMillis ? new Date(record.createdAtMillis).toLocaleString() : 'Time unavailable'}</Text>
    </>}
  </>}</StaffScreen>;
}
