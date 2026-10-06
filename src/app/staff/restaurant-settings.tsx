import { palette } from '@/constants/restaurant-theme';
import { useState } from 'react';
import { ActivityIndicator, Switch, Text, View } from 'react-native';
import { StaffScreen, StaffField, StaffChips, StaffButton, OperationFeedback, ui } from '@/components/staff/operations-ui';
import { useRestaurantSettings } from '@/features/customer/hooks/use-restaurant-settings';
import { useOperation } from '@/features/staff-operations/hooks';
import { saveRestaurantSettings } from '@/services/staff/restaurant';
import type { RestaurantSettings } from '@/features/staff-operations/restaurant';
export default function RestaurantSettingsScreen() {
  const state = useRestaurantSettings(); const task = useOperation();
  const [draft, setDraft] = useState<RestaurantSettings | null>(null); const [date, setDate] = useState('');
  const form = draft || state.settings;
  return <StaffScreen title="Restaurant Settings" back>{state.loading ? <ActivityIndicator color={palette.primary} /> : state.error ? <Text style={ui.error}>{state.error}</Text> : <>
    <Text style={ui.heading}>Opening hours</Text>
    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name, index) => <View key={name} style={ui.card}><View style={ui.row}><Text style={[ui.heading, { flex: 1 }]}>{name}</Text><Switch accessibilityLabel={`${name} open`} disabled={task.busy} value={form.openingHours[index].enabled} onValueChange={enabled => setDraft({ ...form, openingHours: form.openingHours.map((day, i) => i === index ? { ...day, enabled } : day) })} /></View><View style={ui.row}>{(['open', 'close'] as const).map(key => <View key={key} style={{ flex: 1 }}><StaffField label={key === 'open' ? 'Opens (HH:mm)' : 'Closes (HH:mm)'} value={form.openingHours[index][key]} editable={!task.busy} onChangeText={value => setDraft({ ...form, openingHours: form.openingHours.map((day, i) => i === index ? { ...day, [key]: value } : day) })} /></View>)}</View></View>)}
    <Text style={ui.heading}>Booking intervals</Text><StaffChips values={['15', '30', '60']} selected={String(form.bookingIntervalMinutes)} onChange={value => { if (!task.busy) setDraft({ ...form, bookingIntervalMinutes: Number(value) }); }} />
    <StaffField label="Max party size (1-20)" keyboardType="number-pad" value={String(form.maxPartySize)} editable={!task.busy} onChangeText={value => setDraft({ ...form, maxPartySize: Number(value) })} />
    <Text style={ui.heading}>Closed dates</Text>{form.closedDates.map(item => <StaffButton key={item} title={`Remove ${item}`} outline disabled={task.busy} onPress={() => setDraft({ ...form, closedDates: form.closedDates.filter(value => value !== item) })} />)}
    <StaffField label="Closed date (YYYY-MM-DD)" value={date} editable={!task.busy} onChangeText={setDate} /><StaffButton title="+ Add date" outline disabled={!date || task.busy} onPress={() => { setDraft({ ...form, closedDates: [...new Set([...form.closedDates, date.trim()])] }); setDate(''); }} />
    <OperationFeedback task={task} /><StaffButton title="Save Changes" disabled={task.busy} onPress={() => task.run(async () => { await saveRestaurantSettings(form); setDraft(null); return 'Restaurant settings saved. Booking forms use these hours and limits.'; })} />
  </>}</StaffScreen>;
}
