import { palette, radius, space, typography, visual } from '@/constants/restaurant-theme';
import { AppNavigation } from '@/components/common/app-navigation';
import { router, type Href } from 'expo-router';
import { Icon } from '@/components/common/app-icon';
import { StatusBar } from 'expo-status-bar';
import { useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export { Icon } from '@/components/common/app-icon';

export const colors = { ink: palette.cocoa, muted: palette.muted, surface: palette.sand, line: palette.border, green: palette.success };

export function Screen({ children, active }: PropsWithChildren<{ active?: string }>) {
  return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>{children}</ScrollView>
    {active && <AppNavigation area="customer" active={active} />}
  </KeyboardAvoidingView></SafeAreaView>;
}

export function Button({ title, onPress, loading = false, disabled = false, outline = false }: { title: string; onPress: () => void; loading?: boolean; disabled?: boolean; outline?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || loading, busy: loading }} disabled={disabled || loading} onPress={onPress}
    style={({ pressed }) => [styles.button, outline && styles.outline, (disabled || loading) && styles.disabled, pressed && { opacity: 0.75 }]}>
    {loading ? <ActivityIndicator color={outline ? colors.ink : palette.white} /> : <Text style={[styles.buttonText, outline && { color: palette.primary }]}>{title}</Text>}
  </Pressable>;
}

export function TextLink({ label, href }: { label: string; href: Href }) {
  return <Pressable accessibilityRole="link" onPress={() => router.push(href)} style={styles.link}><Text style={styles.linkText}>{label}</Text></Pressable>;
}

export function Header({ title, fallback = '/customer/home' }: { title: string; fallback?: Href }) {
  return <View style={styles.header}><Pressable accessibilityLabel="Go back" accessibilityRole="button" style={styles.iconButton} onPress={() => router.replace(fallback)}><Icon name="back" /></Pressable><Text style={styles.headerTitle}>{title}</Text><View style={styles.iconButton} /></View>;
}

export function Field({ label, icon, password = false, ...props }: TextInputProps & { label: string; icon?: Parameters<typeof Icon>[0]['name']; password?: boolean }) {
  const [visible, setVisible] = useState(false);
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><View style={styles.inputRow}>
    {icon && <Icon name={icon} size={18} />}
    <TextInput accessibilityLabel={label} placeholderTextColor={palette.muted} autoCapitalize={password ? 'none' : 'sentences'} {...props} secureTextEntry={password && !visible} style={[styles.input, props.multiline && { minHeight: 70, textAlignVertical: 'top' }, props.style]} />
    {password && <Pressable accessibilityLabel={visible ? 'Hide password' : 'Show password'} onPress={() => setVisible(!visible)} style={styles.eye}><Text style={styles.caption}>{visible ? 'Hide' : 'Show'}</Text></Pressable>}
  </View></View>;
}

export function Feedback({ message, success = false }: { message: string; success?: boolean }) {
  return message ? <Text accessibilityLiveRegion="polite" style={[styles.feedback, success && { color: palette.success, backgroundColor: palette.successSoft }]}>{message}</Text> : null;
}

export const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: visual.screen,
  page: { padding: space.page, gap: space.card, flexGrow: 1, width: '100%', maxWidth: 600, alignSelf: 'center' },
  title: { color: colors.ink, fontSize: typography.title, fontWeight: '700', lineHeight: 33 },
  subtitle: { color: colors.muted, fontSize: typography.body, lineHeight: 22 },
  caption: { color: colors.muted, fontSize: typography.caption, lineHeight: 18 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '500' },
  section: { color: colors.muted, fontSize: typography.caption, fontWeight: '500', marginTop: 8 },
  field: { gap: 8 }, inputRow: { flexDirection: 'row', alignItems: 'center', ...visual.input, paddingHorizontal: space.card, gap: 10 },
  input: { flex: 1, paddingVertical: 14, color: colors.ink, fontSize: typography.body }, eye: { paddingVertical: 14 },
  button: { ...visual.button, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: palette.white, fontWeight: '600', fontSize: typography.label }, outline: visual.outline, disabled: { opacity: 0.55 },
  link: { alignItems: 'center', paddingVertical: 10 }, linkText: { color: colors.ink, fontSize: 13 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerTitle: { color: colors.ink, fontSize: 17, fontWeight: '600' }, iconButton: { width: 44, height: 44, borderRadius: radius.round, backgroundColor: palette.sand, justifyContent: 'center', alignItems: 'center' },
  center: { alignItems: 'center', gap: 8 }, authHeading: { alignItems: 'center', gap: 8, paddingTop: 32, paddingBottom: 20 },
  logo: { width: 48, height: 48, backgroundColor: palette.olive, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  feedback: { padding: 12, backgroundColor: colors.surface, borderRadius: radius.input, color: palette.danger, fontSize: 13, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, card: { ...visual.card, gap: space.md },
  chip: { borderRadius: radius.chip, backgroundColor: colors.surface, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  selected: { backgroundColor: palette.primary }, chipText: { fontSize: 13, color: colors.ink }, selectedText: { color: palette.white },
});
