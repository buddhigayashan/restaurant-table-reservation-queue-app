import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StatusBar } from 'expo-status-bar';
import { useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const colors = { ink: '#111111', muted: '#727272', surface: '#F5F5F5', line: '#E6E6E6', green: '#12B981' };

export function Icon({ name, size = 20 }: { name: 'back' | 'person' | 'mail' | 'phone' | 'lock' | 'bell' | 'check' | 'calendar' | 'home' | 'clock'; size?: number }) {
  const names = {
    back: { ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' },
    person: { ios: 'person', android: 'person', web: 'person' },
    mail: { ios: 'envelope', android: 'mail', web: 'mail' },
    phone: { ios: 'phone', android: 'call', web: 'call' },
    lock: { ios: 'lock', android: 'lock', web: 'lock' },
    bell: { ios: 'bell', android: 'notifications', web: 'notifications' },
    check: { ios: 'checkmark', android: 'check', web: 'check' },
    calendar: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' },
    home: { ios: 'house', android: 'home', web: 'home' },
    clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  } as const;
  return <SymbolView name={names[name]} size={size} tintColor={colors.ink} />;
}

export function Screen({ children }: PropsWithChildren) {
  return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>{children}</ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}

export function Button({ title, onPress, loading = false, disabled = false, outline = false }: { title: string; onPress?: () => void; loading?: boolean; disabled?: boolean; outline?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || loading, busy: loading }} disabled={disabled || loading} onPress={onPress}
    style={({ pressed }) => [styles.button, outline && styles.outline, (disabled || loading) && styles.disabled, pressed && { opacity: 0.75 }]}>
    {loading ? <ActivityIndicator color={outline ? colors.ink : '#fff'} /> : <Text style={[styles.buttonText, outline && { color: colors.ink }]}>{title}</Text>}
  </Pressable>;
}

export function TextLink({ label, href }: { label: string; href: Href }) {
  return <Pressable accessibilityRole="link" onPress={() => router.push(href)} style={styles.link}><Text style={styles.linkText}>{label}</Text></Pressable>;
}

export function Header({ title, fallback = '/customer/home' }: { title: string; fallback?: Href }) {
  return <View style={styles.header}><Pressable accessibilityLabel="Go back" accessibilityRole="button" style={styles.iconButton} onPress={() => router.canGoBack() ? router.back() : router.replace(fallback)}><Icon name="back" /></Pressable><Text style={styles.headerTitle}>{title}</Text><View style={styles.iconButton} /></View>;
}

export function Field({ label, icon, password = false, ...props }: TextInputProps & { label: string; icon?: Parameters<typeof Icon>[0]['name']; password?: boolean }) {
  const [visible, setVisible] = useState(false);
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><View style={styles.inputRow}>
    {icon && <Icon name={icon} size={18} />}
    <TextInput accessibilityLabel={label} placeholderTextColor="#969696" autoCapitalize={password ? 'none' : 'sentences'} {...props} secureTextEntry={password && !visible} style={[styles.input, props.multiline && { minHeight: 70, textAlignVertical: 'top' }, props.style]} />
    {password && <Pressable accessibilityLabel={visible ? 'Hide password' : 'Show password'} onPress={() => setVisible(!visible)} style={styles.eye}><Text style={styles.caption}>{visible ? 'Hide' : 'Show'}</Text></Pressable>}
  </View></View>;
}

export function Feedback({ message, success = false }: { message: string; success?: boolean }) {
  return message ? <Text accessibilityLiveRegion="polite" style={[styles.feedback, success && { color: '#137A50', backgroundColor: '#E9F8F0' }]}>{message}</Text> : null;
}

export const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: '#fff' },
  page: { padding: 24, gap: 16, flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  title: { color: colors.ink, fontSize: 26, fontWeight: '700', lineHeight: 33 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '500' },
  section: { color: colors.muted, fontSize: 12, fontWeight: '500', marginTop: 8 },
  field: { gap: 8 }, inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 14, minHeight: 52, gap: 10 },
  input: { flex: 1, paddingVertical: 14, color: colors.ink, fontSize: 14 }, eye: { paddingVertical: 14 },
  button: { backgroundColor: colors.ink, minHeight: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 14 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 }, outline: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.ink }, disabled: { opacity: 0.45 },
  link: { alignItems: 'center', paddingVertical: 10 }, linkText: { color: colors.ink, fontSize: 13 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerTitle: { color: colors.ink, fontSize: 17, fontWeight: '600' }, iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  center: { alignItems: 'center', gap: 8 }, authHeading: { alignItems: 'center', gap: 8, paddingTop: 32, paddingBottom: 20 },
  logo: { width: 48, height: 48, backgroundColor: colors.ink, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  feedback: { padding: 12, backgroundColor: colors.surface, borderRadius: 10, color: '#9E3030', fontSize: 13, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12 },
  chip: { borderRadius: 12, backgroundColor: colors.surface, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  selected: { backgroundColor: colors.ink }, chipText: { fontSize: 13, color: colors.ink }, selectedText: { color: '#fff' },
});
