import { palette, radius, space, typography, visual, accentCard } from '@/constants/restaurant-theme';
import { Icon } from '@/components/common/app-icon';
import { StatusBadge } from '@/components/common/status-badge';
import type { PropsWithChildren, ReactNode } from 'react';
import { AppNavigation } from '@/components/common/app-navigation';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calendarDays } from '@/features/staff-operations/helpers';
import type { StaffReservation } from '@/types/staff-operations';

export function StaffScreen({ children, title, active, back = false, right, fallback = '/staff/dashboard' }: PropsWithChildren<{ title: string; active?: string; back?: boolean; right?: ReactNode; fallback?: Href }>) {
  return <SafeAreaView style={ui.safe}><StatusBar style="dark" /><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.page}>
      <View style={ui.row}>{back && <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.replace(fallback)} style={ui.icon}><Icon name="back" /></Pressable>}<Text style={[ui.title, { flex: 1 }]}>{title}</Text>{right}</View>{children}
    </ScrollView>
    {active && <AppNavigation area="staff" active={active} />}
  </KeyboardAvoidingView></SafeAreaView>;
}
export function StaffButton({ title, onPress, disabled = false, outline = false }: { title: string; onPress: () => void; disabled?: boolean; outline?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[ui.button, outline && ui.outline, disabled && { opacity: 0.55 }]}><Text style={[ui.buttonText, outline && { color: palette.cocoa }]}>{title}</Text></Pressable>;
}
export function StaffField({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 6 }}><Text style={ui.small}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor={palette.muted} {...props} style={[ui.input, props.style]} /></View>;
}
export function StaffChips({ values, selected, onChange }: { values: string[]; selected: string; onChange: (value: string) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{values.map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: selected === value }} onPress={() => onChange(value)} style={[ui.chip, selected === value && { backgroundColor: palette.primary }]}><Text style={[ui.small, selected === value && { color: palette.white }]}>{value.replace('_', ' ')}</Text></Pressable>)}</ScrollView>;
}
export function StaffDates({ selected, onChange }: { selected: string; onChange: (value: string) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{calendarDays().map(item => <Pressable key={item.date} accessibilityRole="button" accessibilityLabel={item.date} accessibilityState={{ selected: selected === item.date }} onPress={() => onChange(item.date)} style={[ui.date, selected === item.date && { backgroundColor: palette.primary }]}><Text style={[ui.small, selected === item.date && { color: palette.white }]}>{item.weekday.toUpperCase()}</Text><Text style={[ui.heading, selected === item.date && { color: palette.white }]}>{item.day}</Text></Pressable>)}</ScrollView>;
}
export function StaffAccess({ state }: { state: { loading: boolean; error: string; uid: string | null } }) {
  if (state.loading) return <ActivityIndicator color={palette.primary} />;
  if (state.uid) return null;
  return <View style={ui.card}><Text style={ui.error}>{state.error}</Text><StaffButton title="Staff Login" onPress={() => router.push('/staff/login')} outline /></View>;
}
export function StaffDataState({ state, empty }: { state: { loading: boolean; error: string; rows: unknown[]; retry: () => void }; empty: string }) {
  if (state.loading) return <ActivityIndicator color={palette.primary} />;
  if (state.error) return <View style={ui.card}><Text style={ui.error}>{state.error}</Text><StaffButton title="Retry" onPress={state.retry} outline /></View>;
  if (!state.rows.length) return <Text style={ui.muted}>{empty}</Text>;
  return null;
}
export function OperationFeedback({ task }: { task: { busy: boolean; error: string; message: string } }) {
  return <>{task.busy && <ActivityIndicator color={palette.primary} />}{!!task.error && <Text accessibilityLiveRegion="polite" style={ui.error}>{task.error}</Text>}{!!task.message && <Text accessibilityLiveRegion="polite" style={ui.muted}>{task.message}</Text>}</>;
}
export function ReservationRow({ item, onPress }: { item: StaffReservation; onPress?: () => void }) {
  return <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={[ui.card, ui.row, accentCard(item.status)]}><View style={{ width: 50 }}><Text style={ui.heading}>{item.time || '—'}</Text><Text style={ui.small}>{item.date}</Text></View><View style={{ flex: 1, gap: 6 }}><Text style={ui.heading}>{item.customerName}</Text><Text style={ui.small}>{item.partySize} guests · {item.tableNumber ? `Table ${item.tableNumber}` : 'Unassigned'}</Text></View><StatusBadge status={item.status} />{onPress && <Icon name="chevron" color={palette.primary} />}</Pressable>;
}
export const ui = StyleSheet.create({
  safe: visual.screen, page: { padding: space.page, gap: space.card, flexGrow: 1, maxWidth: 600, width: '100%', alignSelf: 'center' },
  title: { color: palette.cocoa, fontSize: typography.title, fontWeight: '700' }, heading: { color: palette.cocoa, fontSize: typography.label, fontWeight: '600' }, small: { color: palette.muted, fontSize: typography.caption, lineHeight: 18 }, muted: { color: palette.muted, fontSize: 13, lineHeight: 21 }, error: { color: palette.danger, fontSize: 13, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, card: { ...visual.card, gap: space.md },
  input: { ...visual.input, padding: space.card, fontSize: typography.body },
  button: { ...visual.button, justifyContent: 'center', alignItems: 'center' }, buttonText: { color: palette.white, fontSize: typography.body, fontWeight: '600' }, outline: { backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border },
  chip: { backgroundColor: palette.sand, borderRadius: radius.round, padding: 12, minHeight: 44 }, date: { backgroundColor: palette.sand, borderRadius: 9, minWidth: 55, padding: 8, alignItems: 'center' },
  badge: { backgroundColor: palette.border, borderRadius: 8, padding: 5, color: palette.muted, fontSize: 10 }, icon: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: palette.sand },
  nav: { borderTopWidth: 1, borderColor: palette.border, padding: 8, flexDirection: 'row' }, navItem: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 4 },
});
