import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { OperationFeedback, StaffAccess, StaffButton, StaffDataState, StaffScreen, ui } from '@/components/staff/operations-ui';
import { useOperation, useStaffAccess, useStaffRecords } from '@/features/staff-operations/hooks';
import { listenFloorTables, listenOperationalReservations } from '@/services/staff/operations-listeners';
import { updateOperationalReservation } from '@/services/reservations/staff-operations';

export default function ReservationDetailsScreen() {
  const { reservationId } = useLocalSearchParams<{ reservationId?: string }>();
  const access = useStaffAccess();
  const records = useStaffRecords(access.uid, listenOperationalReservations);
  const tables = useStaffRecords(access.uid, listenFloorTables);
  const task = useOperation();
  const [tableId, setTableId] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const record = records.rows.find(item => item.id === reservationId);
  const closed = record && ['completed', 'cancelled', 'no_show'].includes(record.status);
  const selectedTableId = tableId || record?.tableId;
  return <StaffScreen title="Reservation details" back><StaffAccess state={access} />{access.uid && <>
    <StaffDataState state={records} empty="No reservations." />
    {!records.loading && !records.error && !record && <Text style={ui.muted}>Select a reservation from Reservation Management.</Text>}
    {record && <>
      <View style={ui.card}><View style={ui.row}><View style={ui.icon}><Text>♙</Text></View><View style={{ flex: 1 }}><Text style={ui.heading}>{record.customerName}</Text><Text style={ui.small}>{record.customerEmail || 'Email unavailable'}</Text>{!!record.phoneNumber && <Text style={ui.small}>{record.phoneNumber}</Text>}</View><Text style={ui.badge}>{record.status.replace('_', ' ')}</Text></View>
        <View style={ui.row}><View style={{ flex: 1 }}><Text style={ui.small}>DATE</Text><Text style={ui.heading}>{record.date || '—'}</Text></View><View style={{ flex: 1 }}><Text style={ui.small}>TIME</Text><Text style={ui.heading}>{record.time || '—'}</Text></View><View><Text style={ui.small}>PARTY</Text><Text style={ui.heading}>{record.partySize} guests</Text></View></View>
        <Text style={ui.small}>SEATING / SPECIAL REQUESTS</Text><Text style={ui.muted}>{record.seatingPreference}</Text><Text style={ui.muted}>{record.specialRequest || 'No special requests.'}</Text><Text style={ui.small}>{record.tableNumber ? `Assigned: Table ${record.tableNumber}` : 'No table assigned'}</Text>
      </View>
      {!closed && <><Text style={ui.heading}>Assign Table</Text><Text style={ui.small}>Available · Reserved · Occupied · Cleaning</Text><StaffDataState state={tables} empty="No tables available. Add tables in Table / Floor Management." />
        <View style={[ui.row, { flexWrap: 'wrap' }]}>{tables.rows.map(table => {
          const selectable = (table.status === 'available' || table.id === record.tableId) && table.capacity >= record.partySize;
          const selected = selectedTableId === table.id;
          return <Pressable key={table.id} accessibilityRole="button" accessibilityLabel={`Table ${table.tableNumber}, ${table.capacity} seats, ${table.status}`} accessibilityState={{ selected, disabled: !selectable || task.busy }} disabled={!selectable || task.busy} onPress={() => setTableId(table.id)} style={[ui.date, { width: '22%', opacity: selectable ? 1 : 0.4, borderWidth: 1, borderColor: '#DDD' }, selected && { backgroundColor: '#111' }]}><Text style={[ui.heading, selected && { color: '#fff' }]}>{table.tableNumber}</Text><Text style={[ui.small, selected && { color: '#fff' }]}>{table.capacity} seats</Text></Pressable>;
        })}</View>
        <StaffButton title="✓ Save & Assign" disabled={task.busy || !selectedTableId || selectedTableId === record.tableId} onPress={() => task.run(async () => { await updateOperationalReservation(record.id, { tableId: selectedTableId }); return 'Table assigned.'; })} />
      </>}
      <OperationFeedback task={task} />
      <StaffButton title={closed ? 'View Guest Status' : 'Update Status'} outline onPress={() => router.push({ pathname: '/staff/guest-status', params: { reservationId: record.id } })} />
      {!closed && record.status !== 'seated' && <StaffButton title="Cancel Reservation" outline disabled={task.busy} onPress={() => setConfirmCancel(true)} />}
      {confirmCancel && !closed && <View style={ui.card}><Text style={ui.heading}>Cancel this reservation?</Text><StaffButton title="Confirm cancellation" disabled={task.busy} onPress={() => task.run(async () => { await updateOperationalReservation(record.id, { status: 'cancelled' }); setConfirmCancel(false); return 'Reservation cancelled; history retained.'; })} /><StaffButton title="Keep reservation" outline onPress={() => setConfirmCancel(false)} /></View>}
    </>}
  </>}</StaffScreen>;
}
