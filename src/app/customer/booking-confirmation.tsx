import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Header, Icon, Screen, styles, colors } from '@/features/customer/components/ui';
import { displayDate, displayTime } from '@/features/customer/booking-options';

export default function BookingConfirmationScreen() {
  const params = useLocalSearchParams<{ id?: string; date?: string; time?: string; partySize?: string; seatingPreference?: string; specialRequest?: string }>();
  const value = (key: keyof typeof params) => typeof params[key] === 'string' ? params[key] as string : '';
  if (!value('id') || !value('date') || !value('time') || !value('partySize')) {
    return <Screen><Header title="Booking confirmation" /><Text style={styles.subtitle}>No booking details to display.</Text><Button title="Book a Table" onPress={() => router.replace('/customer/booking-form')} /></Screen>;
  }
  return <Screen>
    <Header title="Booking Confirmed" />
    <View style={[styles.center, { paddingVertical: 24 }]}><View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: '#DDF5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Icon name="check" size={36} /></View><Text style={styles.title}>You’re booked!</Text><Text style={styles.subtitle}>Your reservation is confirmed.</Text></View>
    <View style={[styles.card, { padding: 22, gap: 22 }]}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}><Text style={styles.caption}>BOOKING ID</Text><Text style={[styles.caption, { color: '#137A50' }]}>● Confirmed</Text></View>
      <Text selectable style={{ fontSize: 20, fontWeight: '700', color: colors.ink }}>#{value('id')}</Text>
      <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.line }} />
      {[
        ['Date', displayDate(value('date'))],
        ['Time', displayTime(value('time'))],
        ['Guests', `${value('partySize')} people`],
        ['Table area', value('seatingPreference') || 'No preference'],
        ['Requests', value('specialRequest') || 'None'],
      ].map(([label, detail]) => <View key={label} style={[styles.row, { alignItems: 'flex-start', justifyContent: 'space-between' }]}><Text style={styles.caption}>{label}</Text><Text style={[styles.label, { flex: 1, textAlign: 'right', lineHeight: 20 }]}>{detail}</Text></View>)}
      <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.line }} />
      <Text style={[styles.caption, { textAlign: 'center', paddingVertical: 24 }]}>Show your booking reference at the entrance.</Text>
    </View>
    <View style={{ flex: 1 }} />
    <Button title="View My Bookings →" onPress={() => router.push('/customer/my-bookings')} />
    <Button title="Add to Calendar (unavailable)" outline disabled />
  </Screen>;
}
