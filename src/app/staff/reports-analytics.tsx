import { palette } from '@/constants/restaurant-theme';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { StaffScreen, StaffChips, StaffDataState, ui } from '@/components/staff/operations-ui';
import { useStaffAccess, useStaffClock, useStaffRecords } from '@/features/staff-operations/hooks';
import { listenOperationalReservations, listenOperationalQueue, listenFloorTables } from '@/services/staff/operations-listeners';
import { operationalReport } from '@/features/staff-operations/reports';
export default function ReportsAnalyticsScreen() {
  const access = useStaffAccess(); const now = useStaffClock(); const [period, setPeriod] = useState('Today');
  const reservations = useStaffRecords(access.uid, listenOperationalReservations); const queue = useStaffRecords(access.uid, listenOperationalQueue); const tables = useStaffRecords(access.uid, listenFloorTables);
  const report = operationalReport(reservations.rows, queue.rows, tables.rows, period === 'Today' ? 1 : period === 'Week' ? 7 : 30, now);
  const ready = ![reservations, queue, tables].some(state => state.loading || state.error);
  const peak = report.peak.reduce((best, value) => value.guests > (best?.guests || 0) ? value : best, report.peak[0]);
  return <StaffScreen title="Reports & Analytics" back><StaffChips values={['Today', 'Week', 'Month']} selected={period} onChange={setPeriod} />{[reservations, queue, tables].map((state, index) => <StaffDataState key={index} state={state} empty="" />)}{ready && <>
    <View style={[ui.row, { flexWrap: 'wrap' }]}>{[[report.noShowRate === null ? '--' : `${report.noShowRate}%`, 'No-show rate'], [report.averageEstimate === null ? '--' : `${report.averageEstimate} min`, 'Average queue estimate'], [report.turnover === null ? '--' : `${report.turnover}x`, 'Completions / current table'], [String(report.guests), 'Expected guests']].map(([value, label]) => <View key={label} style={[ui.card, { width: '48%' }]}><Text style={ui.small}>{label}</Text><Text style={ui.title}>{value}</Text></View>)}</View>
    {!report.total && <Text style={ui.muted}>No reservations in this period.</Text>}
    <Text style={ui.heading}>Peak hours</Text>{report.peak.map(item => <View key={item.hour} style={ui.row}><Text style={ui.small}>{String(item.hour).padStart(2, '0')}:00</Text><View style={{ flex: 1 }}><View style={{ backgroundColor: palette.primary, height: 16, width: `${Math.max(2, item.guests / Math.max(...report.peak.map(item => item.guests)) * 100)}%`, borderRadius: 4 }} /></View><Text style={ui.small}>{item.guests}</Text></View>)}{!report.peak.length && <Text style={ui.muted}>No arrival data yet.</Text>}
    <Text style={ui.heading}>Wait estimate trend</Text>{report.trends.filter(item => item.estimate !== null).map(item => <View key={item.date} style={ui.row}><Text style={[ui.small, { flex: 1 }]}>{item.date}</Text><Text style={ui.heading}>{item.estimate} min</Text></View>)}{report.averageEstimate === null && <Text style={ui.muted}>No dated queue records in this period.</Text>}
    <Text style={ui.heading}>Recommendations</Text><View style={ui.card}><Text style={ui.muted}>{peak ? `Plan staffing and kitchen preparation around ${String(peak.hour).padStart(2, '0')}:00, the busiest recorded arrival hour (${peak.guests} expected guests).` : 'Recommendations appear when arrival records are available.'}</Text></View>
    <Text style={ui.small}>Guests exclude cancellations/no-shows. Queue values are stored estimates, not measured waiting durations. Turnover uses completed reservations divided by current table count. No invented comparison percentages.</Text>
  </>}</StaffScreen>;
}
