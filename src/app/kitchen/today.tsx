import { Text, View } from 'react-native';
import { OperationalScreen, ReservationCard, LiveState, ui } from '@/components/common/operations-ui';
import { useLiveRecords, useClock } from '@/features/kitchen/hooks/use-operations';
import { activeReservation, arrivalMillis, localDate, nextHour } from '@/features/kitchen/operations';
import { listenKitchenReservations } from '@/services/reservations/kitchen';
export default function TodayScreen() {
    const state = useLiveRecords(listenKitchenReservations);
    const now = useClock();
    const today = state.rows.filter(record => record.date === localDate(new Date(now)) && activeReservation(record));
    const soon = nextHour(today, now);
    return <OperationalScreen area="kitchen" active="Today">
    <View style={[ui.row, { justifyContent: 'space-between' }]}>
    <Text style={ui.title}>● Next hour</Text>
    <Text style={ui.small}>{new Date(now).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
    </View>
    <Text style={ui.muted}>Live arrivals for your kitchen staff</Text>
    <View style={[ui.card, { backgroundColor: '#111' }]}>
    <Text style={{ color: '#AAA', fontSize: 12 }}>TOTAL EXPECTED · NEXT HOUR</Text>
    <Text style={{ fontSize: 38, color: '#fff', fontWeight: '700' }}>{state.loading || state.error ? '—' : soon.reduce((sum, record) => sum + record.partySize, 0)}</Text>
    <Text style={{ color: '#DDD' }}>Guests arriving</Text>
    </View>
    <LiveState state={state} empty="No reservations yet."/>
    {!state.loading && !state.error && soon.length === 0 && <Text style={ui.muted}>No arrivals expected in the next hour.</Text>}
    {soon.map(record => <ReservationCard key={record.id} record={record} countdown={Math.max(0, Math.ceil((arrivalMillis(record) - now) / 60000))}/>)}
    <Text style={ui.name}>Today · {state.error || state.loading ? '—' : today.reduce((sum, record) => sum + record.partySize, 0)} expected guests</Text>
    {today.filter(record => !soon.some(item => item.id === record.id)).map(record => <ReservationCard key={record.id} record={record}/>)}
  </OperationalScreen>;
}
