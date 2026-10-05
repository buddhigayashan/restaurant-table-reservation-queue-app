import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CustomerGate } from '@/features/customer/components/customer-gate';
import { Button, Icon, Screen, styles, colors } from '@/features/customer/components/ui';
import { useCustomer } from '@/features/customer/hooks/use-customer';
import { displayTime } from '@/features/customer/booking-options';

export default function HomeScreen() {
  const customer = useCustomer();
  const [time, setTime] = useState('18:30');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return <CustomerGate customer={customer}><Screen>
    <View style={[styles.row, { justifyContent: 'space-between' }]}><View style={{ flex: 1 }}><Text style={styles.caption}>Welcome back</Text><Text style={[styles.title, { fontSize: 22 }]}>{greeting}, {customer.profile?.fullName.split(' ')[0] || 'Customer'}</Text></View><Pressable style={styles.iconButton} accessibilityLabel="Customer notifications" onPress={() => router.push('/customer/notifications')}><Icon name="bell" /></Pressable></View>
    <View style={local.restaurant}><Text style={styles.caption}>Restaurant Interior View</Text></View>
    <View style={styles.row}><View style={[styles.card, { flex: 1 }]}><Text style={styles.caption}>Tables available tonight</Text><Text style={styles.title}>—</Text><Text style={styles.caption}>Not available yet</Text></View><View style={[styles.card, { flex: 1 }]}><Text style={styles.caption}>● Current wait</Text><Text style={styles.title}>— <Text style={styles.caption}>min</Text></Text><Text style={styles.caption}>Not available yet</Text></View></View>
    <Text style={styles.label}>Select a time</Text>
    <View style={styles.row}>{['18:00', '18:30', '19:00', '19:30'].map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: time === value }} onPress={() => setTime(value)} style={[styles.chip, { flex: 1, paddingHorizontal: 6 }, time === value && styles.selected]}><Text style={[styles.chipText, time === value && styles.selectedText]}>{displayTime(value).replace(' PM', '')}</Text></Pressable>)}</View>
    <Button title="Book a Table" onPress={() => router.push({ pathname: '/customer/booking-form', params: { time } })} />
    <Button title="Join Queue" outline onPress={() => router.push('/customer/join-queue')} />
    <View style={{ flex: 1 }} />
    <View style={local.nav}>{([
      ['Home', 'home', '/customer/home'],
      ['Bookings', 'calendar', '/customer/my-bookings'],
      ['Queue', 'clock', '/customer/join-queue'],
      ['Alerts', 'bell', '/customer/notifications'],
      ['Profile', 'person', '/customer/profile'],
    ] as const).map(([label, icon, href]) => <Pressable key={label} accessibilityRole="link" onPress={() => router.push(href)} style={local.navItem}><Icon name={icon} size={19} /><Text style={[styles.caption, label === 'Home' && { color: colors.ink }]}>{label}</Text></Pressable>)}</View>
  </Screen></CustomerGate>;
}
const local = StyleSheet.create({
  restaurant: { height: 240, backgroundColor: '#E8E8EC', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: colors.line, paddingTop: 16 }, navItem: { alignItems: 'center', gap: 6, minHeight: 44 },
});
