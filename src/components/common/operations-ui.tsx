import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PropsWithChildren } from 'react';
import type { ReservationRecord } from '@/types/operations';
export function OperationalScreen({ children, area, active }: PropsWithChildren<{
    area: 'kitchen' | 'staff';
    active: string;
}>) {
    const links: [
        string,
        Href
    ][] = area === 'kitchen' ? [
        ['Upcoming', '/kitchen/upcoming-reservations'], ['Today', '/kitchen/today'], ['Alerts', '/kitchen/alerts'],
    ] : [['Dashboard', '/staff/dashboard'], ['Reservations', '/staff/reservation-management'], ['Tables', '/staff/table-floor-management'], ['Queue', '/staff/queue-management'], ['Alerts', '/staff/alerts']];
    return <SafeAreaView style={ui.safe}>
    <StatusBar style="dark"/>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.page}>{children}</ScrollView>
    <View style={ui.nav}>{links.map(([label, href]) => <Pressable key={label} accessibilityRole="link" accessibilityState={{ selected: active === label }} onPress={() => router.replace(href)} style={ui.navLink}>
        <Text style={[ui.navText, active === label && { color: '#111', fontWeight: '700' }]}>{label}</Text>
        </Pressable>)}</View>
  </KeyboardAvoidingView>
    </SafeAreaView>;
}
export function Action({ title, onPress, disabled = false, outline = false }: {
    title: string;
    onPress?: () => void;
    disabled?: boolean;
    outline?: boolean;
}) {
    return <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled }} onPress={onPress} style={[ui.button, outline && ui.outline, disabled && { opacity: 0.45 }]}>
    <Text style={[ui.buttonText, outline && { color: '#111' }]}>{title}</Text>
    </Pressable>;
}
export function Input({ label, ...props }: TextInputProps & {
    label: string;
}) {
    return <View style={{ gap: 6 }}>
    <Text style={ui.small}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor="#888" {...props} style={[ui.input, props.style]}/>
    </View>;
}
export function Feedback({ message }: {
    message: string;
}) {
    return message ? <Text accessibilityLiveRegion="polite" style={ui.error}>{message}</Text> : null;
}
export function LiveState({ state, empty }: {
    state: {
        loading: boolean;
        error: string;
        rows: unknown[];
        retry: () => void;
    };
    empty: string;
}) {
    if (state.loading)
        return <ActivityIndicator color="#111" accessibilityLabel="Loading data"/>;
    if (state.error)
        return <View style={ui.card}>
        <Feedback message={state.error}/>
        <Action title="Retry" onPress={state.retry}/>
        </View>;
    return state.rows.length === 0 ? <Text style={ui.muted}>{empty}</Text> : null;
}
export function ReservationCard({ record, countdown }: {
    record: ReservationRecord;
    countdown?: number;
}) {
    return <View style={ui.card}>
    <View style={ui.row}>
    <View style={ui.party}>
    <Text style={{ color: '#fff', fontWeight: '700' }}>{record.partySize}</Text>
    </View>
    <View style={{ flex: 1, gap: 4 }}>
    <Text style={ui.name}>{record.customerName}</Text>
    <Text style={ui.small}>{record.tableNumber ? `Table ${record.tableNumber}` : 'Table unassigned'} · {record.seatingPreference || 'No seating preference'}</Text>
    </View>{countdown !== undefined && <Text style={ui.small}>in {countdown} min</Text>}</View>
    <Text style={ui.small}>{record.time} · {record.status}</Text>{record.specialRequest ? <Text style={ui.tag}>{record.specialRequest}</Text> : null}{record.partySize >= 8 && <Text style={ui.tag}>LARGE GROUP</Text>}</View>;
}
export const ui = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' }, page: { padding: 20, gap: 16, flexGrow: 1, maxWidth: 600, width: '100%', alignSelf: 'center' },
    title: { fontSize: 25, fontWeight: '700', color: '#111' }, name: { fontSize: 15, fontWeight: '600', color: '#111' },
    muted: { fontSize: 13, lineHeight: 20, color: '#737373' }, small: { fontSize: 12, lineHeight: 18, color: '#666' },
    row: { flexDirection: 'row', gap: 12, alignItems: 'center' }, card: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, gap: 10 },
    tag: { fontSize: 11, color: '#555', backgroundColor: '#fff', padding: 6, borderRadius: 6, overflow: 'hidden' },
    party: { backgroundColor: '#111', width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    button: { backgroundColor: '#111', padding: 14, borderRadius: 10, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    outline: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD' }, input: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 14, fontSize: 14, color: '#111', minHeight: 48 },
    chip: { padding: 12, borderRadius: 10, backgroundColor: '#F5F5F5', minHeight: 44 }, selected: { backgroundColor: '#111' },
    nav: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#EEE', padding: 8, justifyContent: 'space-around' }, navLink: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 5 }, navText: { fontSize: 11, color: '#888' },
    error: { color: '#9B3030', fontSize: 13, lineHeight: 20 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, table: { width: '30%', minHeight: 100, borderWidth: 1, borderColor: '#DDD', borderRadius: 12, padding: 10, alignItems: 'center', justifyContent: 'center', gap: 5 },
});
