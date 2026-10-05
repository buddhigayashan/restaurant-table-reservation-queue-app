import type { PropsWithChildren } from 'react';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CustomerBooking } from '@/types/vimandya';

const customerLinks: [string, string, Href][] = [['⌂', 'Home', '/customer/home'], ['▣', 'Bookings', '/customer/my-bookings'], ['◷', 'Queue', '/customer/live-queue-tracking'], ['♧', 'Alerts', '/customer/notifications'], ['○', 'Profile', '/customer/profile']];
export function ModuleScreen({ children, title, active, back = false, right }: PropsWithChildren<{ title: string; active?: string; back?: boolean; right?: React.ReactNode }>) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
          <View style={styles.row}>
            {back && <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace(active ? '/customer/my-bookings' : '/staff/login')} style={styles.iconButton}><Text style={styles.name}>←</Text></Pressable>}
            <Text style={[styles.title, { flex: 1 }]}>{title}</Text>{right}
          </View>
          {children}
        </ScrollView>
        {active && <View style={styles.nav}>{customerLinks.map(([icon, label, path]) => <Pressable key={label} accessibilityRole="link" accessibilityState={{ selected: label === active }} onPress={() => router.replace(path)} style={styles.navItem}><Text style={[styles.navIcon, label === active && styles.dark]}>{icon}</Text><Text style={[styles.navText, label === active && styles.dark]}>{label}</Text></Pressable>)}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Button({ title, onPress, disabled = false, outline = false }: { title: string; onPress: () => void; disabled?: boolean; outline?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.button, outline && styles.outline, disabled && { opacity: 0.45 }]}><Text style={[styles.buttonText, outline && styles.dark]}>{title}</Text></Pressable>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 7 }}><Text style={styles.small}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor="#888" {...props} style={[styles.input, props.style]} /></View>;
}
export function Feedback({ task }: { task: { busy: boolean; error: string; message?: string } }) {
  return <>{task.busy && <ActivityIndicator color="#111" />}{!!task.error && <Text accessibilityLiveRegion="polite" style={styles.error}>{task.error}</Text>}{!!task.message && <Text accessibilityLiveRegion="polite" style={styles.muted}>{task.message}</Text>}</>;
}
export function AccessState({ access, staff = false }: { access: { loading: boolean; error: string; uid: string | null }; staff?: boolean }) {
  if (access.loading) return <ActivityIndicator color="#111" accessibilityLabel="Checking access" />;
  if (!access.uid) return <View style={styles.card}><Text style={styles.error}>{access.error || 'Please sign in.'}</Text><Button title={staff ? 'Staff sign in' : 'Customer sign in'} onPress={() => router.push(staff ? '/staff/login' : '/customer/login')} /></View>;
  return null;
}
export function RecordState({ state, empty }: { state: { loading: boolean; error: string; rows: unknown[]; retry: () => void }; empty: string }) {
  if (state.loading) return <ActivityIndicator color="#111" accessibilityLabel="Loading records" />;
  if (state.error) return <View style={styles.card}><Text style={styles.error}>{state.error}</Text><Button title="Retry" onPress={state.retry} outline /></View>;
  return state.rows.length === 0 ? <Text style={styles.muted}>{empty}</Text> : null;
}
export function PartySize({ value, onChange, disabled = false }: { value: number; onChange: (size: number) => void; disabled?: boolean }) {
  return <View style={styles.card}><View style={styles.row}><Text style={[styles.name, { flex: 1 }]}>♧ {value} {value === 1 ? 'guest' : 'guests'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Decrease party size" disabled={disabled || value <= 1} onPress={() => onChange(value - 1)} style={styles.iconButton}><Text style={styles.name}>−</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Increase party size" disabled={disabled || value >= 20} onPress={() => onChange(value + 1)} style={[styles.iconButton, { backgroundColor: '#111' }]}><Text style={{ color: '#fff', fontSize: 20 }}>+</Text></Pressable></View></View>;
}
export function Choices({ options, value, onChange, disabled = false }: { options: string[]; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return <View style={[styles.row, { flexWrap: 'wrap' }]}>{options.map(option => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: value === option, disabled }} disabled={disabled} onPress={() => onChange(option)} style={[styles.chip, value === option && { backgroundColor: '#111' }]}><Text style={[styles.small, value === option && { color: '#fff' }]}>{option}</Text></Pressable>)}</View>;
}
export function BookingCard({ booking, onPress }: { booking: CustomerBooking; onPress?: () => void }) {
  const [year, month, day] = booking.date.split('-');
  const monthName = month && Number(month) >= 1 && Number(month) <= 12 ? new Date(2000, Number(month) - 1, 1).toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'DATE';
  return <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={[styles.card, booking.status === 'cancelled' && { opacity: 0.6 }]}><View style={styles.row}><View style={styles.dateBadge}><Text style={{ color: '#fff', fontSize: 21, fontWeight: '700' }}>{day || '—'}</Text><Text style={{ color: '#fff', fontSize: 11 }}>{monthName}</Text></View><View style={{ flex: 1, gap: 4 }}><Text style={styles.name}>◷ {booking.time || 'Time unavailable'}</Text><Text style={styles.small}>♧ {booking.partySize} guests · {booking.seatingPreference}</Text><Text style={styles.small}>{year || ''}{booking.tableNumber ? ` · Table ${booking.tableNumber}` : ''}</Text></View><View style={{ gap: 8 }}><Text style={styles.badge}>{booking.status || 'Unknown'}</Text>{onPress && <Text style={{ textAlign: 'right' }}>›</Text>}</View></View></Pressable>;
}
export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' }, page: { padding: 20, gap: 18, flexGrow: 1, width: '100%', maxWidth: 600, alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#111' }, name: { fontSize: 15, fontWeight: '600', color: '#111' },
  small: { fontSize: 12, lineHeight: 18, color: '#666' }, muted: { fontSize: 13, lineHeight: 21, color: '#777' }, error: { fontSize: 13, lineHeight: 20, color: '#9B3030' }, dark: { color: '#111' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, card: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, gap: 10 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 14, color: '#111', fontSize: 14, minHeight: 48 },
  button: { backgroundColor: '#111', minHeight: 48, padding: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' }, outline: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#BBB' },
  iconButton: { minWidth: 44, minHeight: 44, borderRadius: 24, backgroundColor: '#F1F1F1', alignItems: 'center', justifyContent: 'center' }, chip: { padding: 12, minHeight: 44, borderRadius: 20, backgroundColor: '#F5F5F5' },
  nav: { flexDirection: 'row', padding: 8, borderTopWidth: 1, borderColor: '#EEE' }, navItem: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 4 }, navIcon: { fontSize: 19, color: '#AAA' }, navText: { fontSize: 10, color: '#999' },
  dateBadge: { backgroundColor: '#111', minWidth: 48, minHeight: 58, borderRadius: 8, alignItems: 'center', justifyContent: 'center', padding: 6 }, badge: { fontSize: 10, color: '#666', backgroundColor: '#EEE', padding: 5, borderRadius: 8 },
});
