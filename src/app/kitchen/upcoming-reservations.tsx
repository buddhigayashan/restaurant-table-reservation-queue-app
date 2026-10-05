import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Input, OperationalScreen, ReservationCard, LiveState, ui } from '@/components/common/operations-ui';
import { useLiveRecords, useClock } from '@/features/kitchen/hooks/use-operations';
import { activeReservation, arrivalMillis, localDate } from '@/features/kitchen/operations';
import { listenKitchenReservations } from '@/services/reservations/kitchen';
export default function UpcomingReservationsScreen() {
    const state = useLiveRecords(listenKitchenReservations);
    const now = useClock();
    const [selected, setSelected] = useState(localDate());
    const [search, setSearch] = useState('');
    const dates = Array.from({ length: 14 }, (_, i) => { const date = new Date(now); date.setDate(date.getDate() + i); return { value: localDate(date), label: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }) }; });
    const records = state.rows.filter(record => record.date === selected && activeReservation(record) && arrivalMillis(record) >= now && record.customerName.toLowerCase().includes(search.toLowerCase()));
    return <OperationalScreen area="kitchen" active="Upcoming">
    <Text style={ui.title}>Upcoming</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{dates.map(date => <Pressable key={date.value} accessibilityRole="button" accessibilityState={{ selected: date.value === selected }} onPress={() => setSelected(date.value)} style={[ui.chip, date.value === selected && ui.selected]}>
        <Text style={{ color: date.value === selected ? '#fff' : '#111' }}>{date.label}</Text>
        </Pressable>)}</ScrollView>
    <Search value={search} onChange={setSearch}/>
    <LiveState state={state} empty="No reservations yet."/>
    {!state.loading && !state.error && records.length === 0 && state.rows.length > 0 && <Text style={ui.muted}>No upcoming reservations for this selection.</Text>}
    {records.map(record => <View key={record.id} style={{ gap: 6 }}>
        <Text style={ui.small}>{record.time}</Text>
        <ReservationCard record={record}/>
        </View>)}
  </OperationalScreen>;
}
function Search({ value, onChange }: {
    value: string;
    onChange: (value: string) => void;
}) { return <Input label="Search reservations" placeholder="Customer name" value={value} onChangeText={onChange}/>; }
