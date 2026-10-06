import { palette, radius, space, typography, visual, accentCard } from '@/constants/restaurant-theme';
import { Icon } from '@/components/common/app-icon';
import { StatusBadge } from '@/components/common/status-badge';
import type { PropsWithChildren } from 'react';
import { AppNavigation } from '@/components/common/app-navigation';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CustomerBooking } from '@/types/vimandya';

export function ModuleScreen({ children, title, active, back = false, right }: PropsWithChildren<{ title: string; active?: string; back?: boolean; right?: React.ReactNode }>) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
          <View style={styles.row}>
            {back && <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.replace(active === 'Queue' ? '/customer/home' : active ? '/customer/my-bookings' : '/staff/dashboard')} style={styles.iconButton}><Icon name="back" /></Pressable>}
            <Text style={[styles.title, { flex: 1 }]}>{title}</Text>{right}
          </View>
          {children}
        </ScrollView>
        {active && <AppNavigation area="customer" active={active} />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Button({ title, onPress, disabled = false, outline = false }: { title: string; onPress: () => void; disabled?: boolean; outline?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.button, outline && styles.outline, disabled && { opacity: 0.55 }]}><Text style={[styles.buttonText, outline && styles.dark]}>{title}</Text></Pressable>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 7 }}><Text style={styles.small}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor={palette.muted} {...props} style={[styles.input, props.style]} /></View>;
}
export function Feedback({ task }: { task: { busy: boolean; error: string; message?: string } }) {
  return <>{task.busy && <ActivityIndicator color={palette.primary} />}{!!task.error && <Text accessibilityLiveRegion="polite" style={styles.error}>{task.error}</Text>}{!!task.message && <Text accessibilityLiveRegion="polite" style={styles.muted}>{task.message}</Text>}</>;
}
export function AccessState({ access, staff = false }: { access: { loading: boolean; error: string; uid: string | null }; staff?: boolean }) {
  if (access.loading) return <ActivityIndicator color={palette.primary} accessibilityLabel="Checking access" />;
  if (!access.uid) return <View style={styles.card}><Text style={styles.error}>{access.error || 'Please sign in.'}</Text><Button title={staff ? 'Staff sign in' : 'Customer sign in'} onPress={() => router.push(staff ? '/staff/login' : '/customer/login')} /></View>;
  return null;
}
export function RecordState({ state, empty }: { state: { loading: boolean; error: string; rows: unknown[]; retry: () => void }; empty: string }) {
  if (state.loading) return <ActivityIndicator color={palette.primary} accessibilityLabel="Loading records" />;
  if (state.error) return <View style={styles.card}><Text style={styles.error}>{state.error}</Text><Button title="Retry" onPress={state.retry} outline /></View>;
  return state.rows.length === 0 ? <Text style={styles.muted}>{empty}</Text> : null;
}
export function PartySize({ value, onChange, disabled = false }: { value: number; onChange: (size: number) => void; disabled?: boolean }) {
  return <View style={styles.card}><View style={styles.row}><Text style={[styles.name, { flex: 1 }]}>♧ {value} {value === 1 ? 'guest' : 'guests'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Decrease party size" disabled={disabled || value <= 1} onPress={() => onChange(value - 1)} style={styles.iconButton}><Text style={styles.name}>−</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Increase party size" disabled={disabled || value >= 20} onPress={() => onChange(value + 1)} style={[styles.iconButton, { backgroundColor: palette.primary }]}><Text style={{ color: palette.white, fontSize: 20 }}>+</Text></Pressable></View></View>;
}
export function Choices({ options, value, onChange, disabled = false }: { options: string[]; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return <View style={[styles.row, { flexWrap: 'wrap' }]}>{options.map(option => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: value === option, disabled }} disabled={disabled} onPress={() => onChange(option)} style={[styles.chip, value === option && { backgroundColor: palette.primary }]}><Text style={[styles.small, value === option && { color: palette.white }]}>{option}</Text></Pressable>)}</View>;
}
export function BookingCard({ booking, onPress }: { booking: CustomerBooking; onPress?: () => void }) {
  const [year, month, day] = booking.date.split('-');
  const monthName = month && Number(month) >= 1 && Number(month) <= 12 ? new Date(2000, Number(month) - 1, 1).toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'DATE';
  return <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={[styles.card, accentCard(booking.status), booking.status === 'cancelled' && { backgroundColor: palette.cream }]}><View style={styles.row}><View style={styles.dateBadge}><Text style={{ color: palette.white, fontSize: 21, fontWeight: '700' }}>{day || '—'}</Text><Text style={{ color: palette.white, fontSize: 11 }}>{monthName}</Text></View><View style={{ flex: 1, gap: 4 }}><Text style={styles.name}>◷ {booking.time || 'Time unavailable'}</Text><Text style={styles.small}>♧ {booking.partySize} guests · {booking.seatingPreference}</Text><Text style={styles.small}>{year || ''}{booking.tableNumber ? ` · Table ${booking.tableNumber}` : ''}</Text></View><View style={{ gap: 8 }}><StatusBadge status={booking.status || 'unknown'} />{onPress && <Icon name="chevron" color={palette.primary} />}</View></View></Pressable>;
}
export const styles = StyleSheet.create({
  safe: visual.screen, page: { padding: space.page, gap: space.card, flexGrow: 1, width: '100%', maxWidth: 600, alignSelf: 'center' },
  title: { fontSize: typography.title, fontWeight: '700', color: palette.cocoa }, name: { fontSize: typography.label, fontWeight: '600', color: palette.cocoa },
  small: { fontSize: typography.caption, lineHeight: 18, color: palette.muted }, muted: { fontSize: 13, lineHeight: 21, color: palette.muted }, error: { fontSize: 13, lineHeight: 20, color: palette.danger }, dark: { color: palette.cocoa },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, card: { ...visual.card, gap: space.md },
  input: { ...visual.input, padding: space.card, fontSize: typography.body },
  button: { ...visual.button, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: palette.white, fontSize: typography.body, fontWeight: '600' }, outline: { backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border },
  iconButton: { minWidth: 44, minHeight: 44, borderRadius: 24, backgroundColor: palette.sand, alignItems: 'center', justifyContent: 'center' }, chip: { padding: 12, minHeight: 44, borderRadius: radius.round, backgroundColor: palette.sand },
  nav: { flexDirection: 'row', padding: 8, borderTopWidth: 1, borderColor: palette.border }, navItem: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 4 }, navIcon: { fontSize: 19, color: palette.muted }, navText: { fontSize: 10, color: palette.muted },
  dateBadge: { backgroundColor: palette.primary, minWidth: 48, minHeight: 58, borderRadius: 8, alignItems: 'center', justifyContent: 'center', padding: 6 }, badge: { fontSize: 10, color: palette.muted, backgroundColor: palette.border, padding: 5, borderRadius: 8 },
});
