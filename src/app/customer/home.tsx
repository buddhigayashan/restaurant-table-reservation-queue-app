import { palette, radius } from '@/constants/restaurant-theme';
import { Image } from 'expo-image';
import { restaurantImages } from '@/constants/restaurant-images';
import { useRestaurantSettings } from '@/features/customer/hooks/use-restaurant-settings';
import { bookingSlots } from '@/features/staff-operations/restaurant';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CustomerGate } from '@/features/customer/components/customer-gate';
import { Button, Icon, Screen, styles, Feedback } from '@/features/customer/components/ui';
import { useCustomer } from '@/features/customer/hooks/use-customer';
import { useHomeSummary } from '@/features/customer/hooks/use-home-summary';

import { dateValue, displayTime } from '@/features/customer/booking-options';

export default function HomeScreen() {
  const customer = useCustomer();
  const policy = useRestaurantSettings();
  const slots = bookingSlots(policy.settings, dateValue(new Date()));
  const summary = useHomeSummary(customer.user?.uid);
  const [time, setTime] = useState('18:30');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return <CustomerGate customer={customer}><Screen active="Home">
    <View style={[styles.row, { justifyContent: 'space-between' }]}><View style={{ flex: 1 }}><Text style={styles.caption}>Welcome back</Text><Text style={[styles.title, { fontSize: 22 }]}>{greeting}, {customer.profile?.fullName.split(' ')[0] || 'Customer'}</Text></View><Pressable style={styles.iconButton} accessibilityLabel="Customer notifications" onPress={() => router.push('/customer/notifications')}><Icon name="bell" /></Pressable></View>
    <View style={local.restaurant}><Image source={restaurantImages.hero} contentFit="cover" accessibilityLabel="Illustrative restaurant dining room" style={local.heroImage} /></View>
    <View style={styles.row}><View style={[styles.card, { flex: 1, backgroundColor: palette.successSoft, borderColor: palette.successSoft }]}><Icon name="tables" color={palette.success} /><Text style={styles.caption}>Tables available now</Text><Text style={styles.title}>{summary.tables ?? '—'}</Text><Text style={styles.caption}>Live table status</Text></View><View style={[styles.card, { flex: 1, backgroundColor: palette.sand, borderColor: palette.sand }]}><Icon name="clock" color={palette.warning} /><Text style={styles.caption}>Current wait</Text><Text style={styles.title}>{summary.wait ?? '—'} <Text style={styles.caption}>min</Text></Text><Text style={styles.caption}>Estimate for joining now</Text></View></View>
    <Feedback message={summary.error || policy.error} />
    <Text style={styles.label}>Select a time</Text>
    <View style={styles.row}>{slots.slice(0, 4).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: time === value }} onPress={() => setTime(value)} style={[styles.chip, { flex: 1, paddingHorizontal: 6 }, time === value && styles.selected]}><Text style={[styles.chipText, time === value && styles.selectedText]}>{displayTime(value).replace(' PM', '')}</Text></Pressable>)}</View>
    <Button title="Book a Table" onPress={() => router.push({ pathname: '/customer/booking-form', params: { time: slots.includes(time) ? time : '' } })} />
    <Button title="Join Queue" outline onPress={() => router.push('/customer/join-queue')} />
    <View style={{ flex: 1 }} />

  </Screen></CustomerGate>;
}
const local = StyleSheet.create({
  restaurant: { width: '100%', aspectRatio: 1.55, maxHeight: 280, backgroundColor: palette.sand, borderRadius: radius.hero, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
});
