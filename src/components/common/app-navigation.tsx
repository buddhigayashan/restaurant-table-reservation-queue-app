import { palette, radius, space } from '@/constants/restaurant-theme';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/app-icon';


export function AppNavigation({ area, active }: { area: 'customer' | 'staff' | 'kitchen'; active?: string }) {
  const links: [string, Parameters<typeof Icon>[0]['name'], Href][] = area === 'customer' ? [
    ['Home', 'home', '/customer/home'], ['Queue', 'clock', '/customer/live-queue-tracking'], ['Bookings', 'calendar', '/customer/my-bookings'], ['Notifications', 'bell', '/customer/notifications'], ['Profile', 'person', '/customer/profile'],
  ] : area === 'kitchen' ? [['Upcoming', 'calendar', '/kitchen/upcoming-reservations'], ['Today', 'clock', '/kitchen/today'], ['Alerts', 'bell', '/kitchen/alerts']] : [
    ['Dashboard', 'home', '/staff/dashboard'], ['Reservations', 'calendar', '/staff/reservation-management'], ['Tables', 'tables', '/staff/table-floor-management'], ['Queue', 'clock', '/staff/queue-management'], ['Alerts', 'bell', '/staff/alerts'],
  ];
  return <View style={styles.nav}>{links.map(([label, icon, href]) => <Pressable key={label} accessibilityRole="link" accessibilityState={{ selected: active === label || (active === 'Alerts' && label === 'Notifications') }} onPress={() => router.replace(href)} style={styles.item}><View style={[styles.iconWrap, (active === label || (active === 'Alerts' && label === 'Notifications')) && styles.activeIcon]}><Icon name={icon} size={20} color={active === label || (active === 'Alerts' && label === 'Notifications') ? palette.primary : palette.muted} /></View><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, (active === label || (active === 'Alerts' && label === 'Notifications')) && styles.selected]}>{label}</Text></Pressable>)}</View>;
}

export function StaffProfileLink() {
  return <Pressable accessibilityRole="link" accessibilityLabel="Staff profile and sign out" onPress={() => router.push('/staff/profile')} style={styles.profile}><Icon name="person" /><Text style={styles.label}>My account</Text></Pressable>;
}
const styles = StyleSheet.create({
  iconWrap: { borderRadius: radius.round, paddingHorizontal: space.md, paddingVertical: 4 }, activeIcon: { backgroundColor: palette.primarySoft },
  nav: { flexDirection: 'row', borderTopWidth: 1, borderColor: palette.border, paddingTop: space.sm, paddingBottom: space.sm, paddingHorizontal: space.xs, backgroundColor: palette.cream, shadowColor: palette.cocoa, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 2 },
  item: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 5 }, label: { color: palette.muted, fontSize: 11 }, selected: { color: palette.primary, fontWeight: '700' },
  profile: { alignSelf: 'flex-end', flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 44 },
});
