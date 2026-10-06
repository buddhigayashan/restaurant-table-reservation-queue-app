import { palette, radius, space, typography, visual, accentCard } from '@/constants/restaurant-theme';
import { StatusBadge } from './status-badge';
import { AppNavigation, StaffProfileLink } from './app-navigation';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PropsWithChildren } from 'react';
import type { ReservationRecord } from '@/types/operations';
export function OperationalScreen({ children, area, active }: PropsWithChildren<{
    area: 'kitchen' | 'staff';
    active: string;
}>) {
    return <SafeAreaView style={ui.safe}>
    <StatusBar style="dark"/>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.page}><StaffProfileLink />{children}</ScrollView>
    <AppNavigation area={area} active={active} />
  </KeyboardAvoidingView>
    </SafeAreaView>;
}
export function Action({ title, onPress, disabled = false, outline = false }: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    outline?: boolean;
}) {
    return <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled }} onPress={onPress} style={[ui.button, outline && ui.outline, disabled && { opacity: 0.55 }]}>
    <Text style={[ui.buttonText, outline && { color: palette.cocoa }]}>{title}</Text>
    </Pressable>;
}
export function Input({ label, ...props }: TextInputProps & {
    label: string;
}) {
    return <View style={{ gap: 6 }}>
    <Text style={ui.small}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor={palette.muted} {...props} style={[ui.input, props.style]}/>
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
        return <ActivityIndicator color={palette.primary} accessibilityLabel="Loading data"/>;
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
    return <View style={[ui.card, accentCard(record.status)]}>
    <View style={ui.row}>
    <View style={ui.party}>
    <Text style={{ color: palette.white, fontWeight: '700' }}>{record.partySize}</Text>
    </View>
    <View style={{ flex: 1, gap: 4 }}>
    <Text style={ui.name}>{record.customerName}</Text>
    <Text style={ui.small}>{record.tableNumber ? `Table ${record.tableNumber}` : 'Table unassigned'} · {record.seatingPreference || 'No seating preference'}</Text>
    </View>{countdown !== undefined && <Text style={ui.small}>in {countdown} min</Text>}</View>
    <View style={ui.row}><Text style={ui.small}>{record.time}</Text><StatusBadge status={record.status} /></View>{record.specialRequest ? <Text style={ui.tag}>{record.specialRequest}</Text> : null}{record.partySize >= 8 && <Text style={ui.tag}>LARGE GROUP</Text>}</View>;
}
export const ui = StyleSheet.create({
    safe: visual.screen, page: { padding: space.page, gap: space.card, flexGrow: 1, maxWidth: 600, width: '100%', alignSelf: 'center' },
    title: { fontSize: typography.title, fontWeight: '700', color: palette.cocoa }, name: { fontSize: typography.label, fontWeight: '600', color: palette.cocoa },
    muted: { fontSize: 13, lineHeight: 20, color: palette.muted }, small: { fontSize: typography.caption, lineHeight: 18, color: palette.muted },
    row: { flexDirection: 'row', gap: 12, alignItems: 'center' }, card: { ...visual.card, gap: space.md },
    tag: { fontSize: 11, color: palette.muted, backgroundColor: palette.white, padding: 6, borderRadius: 6, overflow: 'hidden' },
    party: { backgroundColor: palette.olive, width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    button: { ...visual.button, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: palette.white, fontSize: typography.body, fontWeight: '600' },
    outline: { backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border }, input: { ...visual.input, padding: space.card, fontSize: typography.body },
    chip: { padding: 12, borderRadius: radius.input, backgroundColor: palette.sand, minHeight: 44 }, selected: { backgroundColor: palette.primary },
    nav: { flexDirection: 'row', borderTopWidth: 1, borderColor: palette.border, padding: 8, justifyContent: 'space-around' }, navLink: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 5 }, navText: { fontSize: 11, color: palette.muted },
    error: { color: palette.danger, fontSize: 13, lineHeight: 20 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, table: { width: '30%', minHeight: 100, borderWidth: 1, borderColor: palette.border, borderRadius: radius.chip, padding: 10, alignItems: 'center', justifyContent: 'center', gap: 5 },
});
