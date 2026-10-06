import { palette, radius, space, typography } from '@/constants/restaurant-theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from './app-icon';
export function SettingsRow({ title, onPress }: { title: string; onPress: () => void }) {
  const icon = title.includes('Password') ? 'lock' : title.includes('Notification') ? 'bell' : title.includes('Help') ? 'alert' : 'person';
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}><View style={styles.icon}><Icon name={icon} color={palette.olive} /></View><Text style={styles.label}>{title}</Text><Icon name="chevron" size={16} color={palette.muted} /></Pressable>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 60, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border, borderRadius: radius.card, paddingHorizontal: space.card, paddingVertical: space.sm }, icon: { width: 36, height: 36, borderRadius: radius.chip, backgroundColor: palette.successSoft, alignItems: 'center', justifyContent: 'center' }, label: { flex: 1, fontSize: typography.body, fontWeight: '500', color: palette.cocoa } });
