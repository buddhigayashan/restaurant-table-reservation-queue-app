import { statusTone, accentCard } from '@/constants/restaurant-theme';
import { Icon } from '@/components/common/app-icon';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { StaffAccess, StaffButton, StaffDataState, StaffScreen, ui } from '@/components/staff/operations-ui';
import { useStaffAccess, useStaffClock, useStaffRecords } from '@/features/staff-operations/hooks';
import { localDate } from '@/features/staff-operations/helpers';
import { listenFloorTables, listenOperationalQueue, listenOperationalReservations, listenStaffAlerts } from '@/services/staff/operations-listeners';

export default function DashboardScreen() {
  const access = useStaffAccess();
  const now = useStaffClock();
  const reservations = useStaffRecords(access.uid, listenOperationalReservations);
  const tables = useStaffRecords(access.uid, listenFloorTables);
  const queue = useStaffRecords(access.uid, listenOperationalQueue);
  const alerts = useStaffRecords(access.uid, listenStaffAlerts);
  const today = reservations.rows.filter(item => item.date === localDate(now));
  const ready = ![reservations, tables, queue, alerts].some(state => state.loading || state.error);
  const metrics = [
    [today.length, 'Reservations today'],
    [queue.rows.filter(item => ['waiting', 'called'].includes(item.status)).length, 'Parties in queue'],
    [`${tables.rows.filter(item => item.status === 'occupied').length}/${tables.rows.length}`, 'Tables occupied'],
    [today.filter(item => item.status === 'no_show').length, 'No-shows'],
  ];
  const rush = alerts.rows.filter(item => item.type === 'rush' && !item.read).sort((a, b) => b.createdAtMillis - a.createdAtMillis)[0];
  return <StaffScreen title="Today" active="Dashboard" right={<Pressable accessibilityRole="link" accessibilityLabel="My staff profile" style={ui.icon} onPress={() => router.push('/staff/profile')}><Icon name="person" /></Pressable>}>
    <Text style={ui.small}>{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
    <StaffAccess state={access} />
    {access.uid && <>
      {[reservations, tables, queue, alerts].map((state, index) => <StaffDataState key={index} state={state} empty="" />)}
      {ready && <>
        <View style={[ui.row, { flexWrap: 'wrap' }]}>{metrics.map(([value, label]) => <View key={label} style={[ui.card, accentCard(label === 'No-shows' ? 'no_show' : label === 'Parties in queue' ? 'waiting' : label === 'Tables occupied' ? 'occupied' : 'confirmed'), { width: '48%', minHeight: 110 }]}><Text style={{ color: statusTone(label === 'No-shows' ? 'no_show' : label === 'Parties in queue' ? 'waiting' : label === 'Tables occupied' ? 'occupied' : 'confirmed').foreground, fontSize: 30, fontWeight: '700' }}>{value}</Text><Text style={ui.small}>{label}</Text></View>)}</View>
        <Text style={ui.small}>{tables.rows.filter(item => item.status === 'available').length} available tables · {today.filter(item => item.status === 'cancelled').length} cancellations today</Text>
        {rush && <View style={ui.card}><Text style={ui.heading}>◷ {rush.title}</Text><Text style={ui.muted}>{rush.message}</Text></View>}
      </>}
      <View style={ui.row}><View style={{ flex: 1 }}><StaffButton title="Walk-in" outline onPress={() => router.push('/staff/walk-in-registration')} /></View><View style={{ flex: 1 }}><StaffButton title="Reservations" onPress={() => router.push('/staff/reservation-management')} /></View><View style={{ flex: 1 }}><StaffButton title="Tables" outline onPress={() => router.push('/staff/table-floor-management')} /></View></View>
      <Text style={ui.heading}>Manage operations</Text>
      <StaffButton title="Booking history  ›" outline onPress={() => router.push('/staff/booking-history')} />
      <StaffButton title="Staff alerts  ›" outline onPress={() => router.push('/staff/alerts')} />
      {access.profile?.role === 'manager' && <><Text style={ui.heading}>Manager tools</Text>{([
        ['Staff Accounts', '/staff/account-management'],
        ['Restaurant Settings', '/staff/restaurant-settings'],
        ['Table Setup', '/staff/table-setup'],
        ['Reports & Analytics', '/staff/reports-analytics'],
      ] as const).map(([label, href]) => <StaffButton key={label} title={`${label}  ›`} outline onPress={() => router.push(href)} />)}</>}
    </>}
  </StaffScreen>;
}
