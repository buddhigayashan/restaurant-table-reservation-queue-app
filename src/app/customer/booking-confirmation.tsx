import { palette } from '@/constants/restaurant-theme';
import { StatusBadge } from '@/components/common/status-badge';
import { useCustomer } from '@/features/customer/hooks/use-customer';
import { useRecords, useTask } from '@/features/vimandya/hooks';
import { listenCustomerBookings } from '@/services/reservations/customer';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Button, Header, Icon, Screen, styles, colors, Feedback } from '@/features/customer/components/ui';
import { displayDate, displayTime } from '@/features/customer/booking-options';

import { addBookingToCalendar } from '@/services/reservations/calendar';

export default function BookingConfirmationScreen() {
  const task = useTask();
  const params = useLocalSearchParams<{ id?: string; date?: string; time?: string; partySize?: string; seatingPreference?: string; specialRequest?: string }>();
  const customer = useCustomer();
  const records = useRecords(customer.user?.uid || null, listenCustomerBookings);
  const saved = records.rows.find(item => item.id === params.id);
  const value = (key: keyof typeof params) => saved && key in saved ? String(saved[key as keyof typeof saved] || '') : '';
  if (customer.loading || records.loading) return <Screen><ActivityIndicator color={palette.primary} /></Screen>;
  if (records.error) return <Screen><Header fallback="/customer/my-bookings" title="Booking confirmation" /><Feedback message={records.error} /><Button title="Retry" onPress={records.retry} /></Screen>;
  if (!value('id') || !value('date') || !value('time') || !value('partySize')) {
    return <Screen><Header fallback="/customer/my-bookings" title="Booking confirmation" /><Text style={styles.subtitle}>No booking details to display.</Text><Button title="Book a Table" onPress={() => router.replace('/customer/booking-form')} /></Screen>;
  }
  return <Screen>
    <Header fallback="/customer/my-bookings" title={saved?.status === 'confirmed' ? 'Booking Confirmed' : 'Booking details'} />
    <View style={[styles.center, { paddingVertical: 24, backgroundColor: palette.successSoft, borderRadius: 24 }]}><View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: palette.successSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Icon name="check" size={36} color={palette.success} /></View><Text style={styles.title}>{saved?.status === 'confirmed' ? 'You\u2019re booked!' : 'Your booking'}</Text><Text style={styles.subtitle}>Your reservation is {saved?.status}.</Text></View>
    <View style={[styles.card, { padding: 22, gap: 22 }]}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}><Text style={styles.caption}>BOOKING ID</Text><StatusBadge status={saved?.status || 'unknown'} /></View>
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
      <Text style={[styles.caption, { textAlign: 'center', paddingVertical: 24, backgroundColor: palette.successSoft, borderRadius: 24 }]}>Show your booking reference at the entrance.</Text>
    </View>
    <View style={{ flex: 1 }} />
    <Button title="View My Bookings →" onPress={() => router.replace('/customer/my-bookings')} />
    <Feedback message={task.error || task.message} success={!!task.message} />
    <Button title={task.message ? 'Added to Calendar' : 'Add to Calendar'} outline loading={task.busy} disabled={!!task.message || saved?.status !== 'confirmed'} onPress={() => task.run(async () => { await addBookingToCalendar({ id: value('id'), date: value('date'), time: value('time'), partySize: value('partySize') }); return 'Your booking was added to your calendar.'; })} />
  </Screen>;
}
