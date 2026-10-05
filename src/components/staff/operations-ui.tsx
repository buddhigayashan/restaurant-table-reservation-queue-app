import type { PropsWithChildren, ReactNode } from 'react';
import { router, type Href } from 'expo-router';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calendarDays } from '@/features/staff-operations/helpers';
import type { StaffReservation } from '@/types/staff-operations';

const links: [string, string, Href][] = [['▦', 'Dashboard', '/staff/dashboard'], ['▣', 'Reservations', '/staff/reservation-management'], ['▦', 'Tables', '/staff/table-floor-management'], ['♧', 'Queue', '/staff/queue-management'], ['♧', 'Alerts', '/staff/alerts']];
export function StaffScreen({ children, title, active, back = false, right }: PropsWithChildren<{ title: string; active?: string; back?: boolean; right?: ReactNode }>) {
  return <SafeAreaView style={ui.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.page}>
      <View style={ui.row}>{back && <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/staff/dashboard')} style={ui.icon}><Text style={ui.heading}>←</Text></Pressable>}<Text style={[ui.title, { flex: 1 }]}>{title}</Text>{right}</View>{children}
    </ScrollView>
    {active && <View style={ui.nav}>{links.map(([icon, label, path]) => <Pressable key={label} accessibilityRole="link" accessibilityState={{ selected: active === label }} style={ui.navItem} onPress={() => router.replace(path)}><Text style={{ fontSize: 18, color: active === label ? '#111' : '#AAA' }}>{icon}</Text><Text style={{ fontSize: 10, color: active === label ? '#111' : '#999' }}>{label}</Text></Pressable>)}</View>}
  </KeyboardAvoidingView></SafeAreaView>;
}
export function StaffButton({ title, onPress, disabled = false, outline = false }: { title: string; onPress: () => void; disabled?: boolean; outline?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[ui.button, outline && ui.outline, disabled && { opacity: 0.4 }]}><Text style={[ui.buttonText, outline && { color: '#111' }]}>{title}</Text></Pressable>;
}
export function StaffField({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 6 }}><Text style={ui.small}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor="#888" {...props} style={[ui.input, props.style]} /></View>;
}
export function StaffChips({ values, selected, onChange }: { values: string[]; selected: string; onChange: (value: string) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{values.map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: selected === value }} onPress={() => onChange(value)} style={[ui.chip, selected === value && { backgroundColor: '#111' }]}><Text style={[ui.small, selected === value && { color: '#fff' }]}>{value.replace('_', ' ')}</Text></Pressable>)}</ScrollView>;
}
export function StaffDates({ selected, onChange }: { selected: string; onChange: (value: string) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{calendarDays().map(item => <Pressable key={item.date} accessibilityRole="button" accessibilityLabel={item.date} accessibilityState={{ selected: selected === item.date }} onPress={() => onChange(item.date)} style={[ui.date, selected === item.date && { backgroundColor: '#111' }]}><Text style={[ui.small, selected === item.date && { color: '#fff' }]}>{item.weekday.toUpperCase()}</Text><Text style={[ui.heading, selected === item.date && { color: '#fff' }]}>{item.day}</Text></Pressable>)}</ScrollView>;
}
export function StaffAccess({ state }: { state: { loading: boolean; error: string; uid: string | null } }) {
  if (state.loading) return <ActivityIndicator color="#111" />;
  if (state.uid) return null;
  return <View style={ui.card}><Text style={ui.error}>{state.error}</Text><StaffButton title="Staff Login" onPress={() => router.push('/staff/login')} outline /></View>;
}
export function StaffDataState({ state, empty }: { state: { loading: boolean; error: string; rows: unknown[]; retry: () => void }; empty: string }) {
  if (state.loading) return <ActivityIndicator color="#111" />;
  if (state.error) return <View style={ui.card}><Text style={ui.error}>{state.error}</Text><StaffButton title="Retry" onPress={state.retry} outline /></View>;
  if (!state.rows.length) return <Text style={ui.muted}>{empty}</Text>;
  return null;
}
export function OperationFeedback({ task }: { task: { busy: boolean; error: string; message: string } }) {
  return <>{task.busy && <ActivityIndicator color="#111" />}{!!task.error && <Text accessibilityLiveRegion="polite" style={ui.error}>{task.error}</Text>}{!!task.message && <Text accessibilityLiveRegion="polite" style={ui.muted}>{task.message}</Text>}</>;
}
export function ReservationRow({ item, onPress }: { item: StaffReservation; onPress?: () => void }) {
  return <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={[ui.card, ui.row]}><View style={{ width: 50 }}><Text style={ui.heading}>{item.time || '—'}</Text><Text style={ui.small}>{item.date}</Text></View><View style={{ flex: 1, gap: 6 }}><Text style={ui.heading}>{item.customerName}</Text><Text style={ui.small}>{item.partySize} guests · {item.tableNumber ? `Table ${item.tableNumber}` : 'Unassigned'}</Text></View><Text style={ui.badge}>{item.status.replace('_', ' ')}</Text>{onPress && <Text>›</Text>}</Pressable>;
}
export const ui = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' }, page: { padding: 20, gap: 16, flexGrow: 1, maxWidth: 600, width: '100%', alignSelf: 'center' },
  title: { color: '#111', fontSize: 24, fontWeight: '700' }, heading: { color: '#111', fontSize: 15, fontWeight: '600' }, small: { color: '#666', fontSize: 11, lineHeight: 17 }, muted: { color: '#777', fontSize: 13, lineHeight: 21 }, error: { color: '#9B3030', fontSize: 13, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, card: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, gap: 10 },
  input: { backgroundColor: '#F5F5F5', color: '#111', fontSize: 14, borderRadius: 10, padding: 14, minHeight: 48 },
  button: { backgroundColor: '#111', padding: 14, minHeight: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }, buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' }, outline: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#BBB' },
  chip: { backgroundColor: '#F5F5F5', borderRadius: 20, padding: 12, minHeight: 44 }, date: { backgroundColor: '#F5F5F5', borderRadius: 9, minWidth: 55, padding: 8, alignItems: 'center' },
  badge: { backgroundColor: '#EEE', borderRadius: 8, padding: 5, color: '#555', fontSize: 10 }, icon: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#F5F5F5' },
  nav: { borderTopWidth: 1, borderColor: '#EEE', padding: 8, flexDirection: 'row' }, navItem: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 4 },
});
