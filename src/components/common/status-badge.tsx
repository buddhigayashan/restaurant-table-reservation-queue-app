import { palette, radius, space, typography, statusTone } from '@/constants/restaurant-theme';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from './app-icon';
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = statusTone(status);
  const icon = ['cancelled', 'cancellation', 'inactive'].includes(status) ? 'close' : ['waiting', 'reserved', 'pending', 'cleaning'].includes(status) ? 'clock' : ['high', 'medium', 'no_show', 'rush', 'large_group'].includes(status) ? 'alert' : 'check';
  return <View style={[styles.badge, { backgroundColor: tone.background }]}><Icon name={icon} size={13} color={tone.foreground} /><Text style={[styles.label, { color: tone.foreground }]}>{label || status.replace(/_/g, ' ')}</Text></View>;
}
const styles = StyleSheet.create({ badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: space.xs, paddingHorizontal: space.sm, paddingVertical: 6, borderRadius: radius.chip, flexShrink: 1 }, label: { fontSize: typography.caption, fontWeight: '600', color: palette.cocoa, flexShrink: 1 } });
