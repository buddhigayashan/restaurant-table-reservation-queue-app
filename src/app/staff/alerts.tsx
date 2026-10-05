import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { OperationFeedback, StaffAccess, StaffButton, StaffChips, StaffDataState, StaffScreen, ui } from '@/components/staff/operations-ui';
import { useOperation, useStaffAccess, useStaffRecords } from '@/features/staff-operations/hooks';
import { listenStaffAlerts } from '@/services/staff/operations-listeners';
import { readStaffAlerts } from '@/services/notifications/staff-alerts';

export default function AlertsScreen() {
  const access = useStaffAccess();
  const records = useStaffRecords(access.uid, listenStaffAlerts);
  const task = useOperation();
  const [filter, setFilter] = useState('All');
  const rows = records.rows.filter(item => filter === 'All' || filter === 'Bookings' && ['reservation_changed', 'new_booking'].includes(item.type) || filter === 'Cancellations' && item.type === 'cancellation' || filter === 'Unread' && !item.read).sort((a, b) => b.createdAtMillis - a.createdAtMillis);
  const unread = records.rows.filter(item => !item.read);
  return <StaffScreen title="Alerts" active="Alerts" right={access.uid ? <Pressable accessibilityRole="link" accessibilityLabel="Staff profile" style={ui.icon} onPress={() => router.push('/staff/profile')}><Text>♙</Text></Pressable> : undefined}>
    <StaffAccess state={access} />{access.uid && <>
      <StaffChips values={['All', 'Bookings', 'Cancellations', 'Unread']} selected={filter} onChange={setFilter} />
      <StaffDataState state={records} empty="No staff alerts yet." />
      {!records.loading && !records.error && records.rows.length > 0 && !rows.length && <Text style={ui.muted}>No alerts match this filter.</Text>}
      <OperationFeedback task={task} />
      {rows.map(item => <View key={item.id} style={[ui.card, item.read && { opacity: 0.6 }]}><View style={ui.row}><View style={ui.icon}><Text>{['rush', 'large_group', 'no_show'].includes(item.type) ? '△' : item.type === 'cancellation' ? '×' : '▣'}</Text></View><View style={{ flex: 1 }}><Text style={ui.heading}>{item.title}</Text><Text style={ui.small}>{item.message}</Text></View><View><Text style={ui.small}>{item.createdAtMillis ? new Date(item.createdAtMillis).toLocaleString() : 'Saving…'}</Text><Text style={ui.small}>{item.read ? 'Read' : '● Unread'}</Text></View></View><Text style={ui.small}>{item.severity}</Text>
        {!item.read && <StaffButton title="Mark as read" outline disabled={task.busy} onPress={() => task.run(() => readStaffAlerts([item.id]))} />}
        {item.reservationId && <StaffButton title="Open reservation" outline onPress={() => router.push({ pathname: '/staff/reservation-details', params: { reservationId: item.reservationId } })} />}
      </View>)}
      <StaffButton title="Mark all as read" outline disabled={task.busy || !unread.length} onPress={() => task.run(() => readStaffAlerts(unread.map(item => item.id)))} />
    </>}
  </StaffScreen>;
}
