import { palette } from '@/constants/restaurant-theme';
import { useRestaurantSettings } from '@/features/customer/hooks/use-restaurant-settings';
import { bookingSlots } from '@/features/staff-operations/restaurant';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CustomerGate } from '@/features/customer/components/customer-gate';
import { Button, Feedback, Field, Header, Screen, styles } from '@/features/customer/components/ui';
import { useCustomer } from '@/features/customer/hooks/use-customer';
import { useSubmit } from '@/features/customer/hooks/use-submit';
import { bookingDates, bookingTimes, displayDate, displayTime } from '@/features/customer/booking-options';
import { createBookingReference, createCustomerReservation } from '@/services/reservations/customer';

export default function BookingFormScreen() {
  const customer = useCustomer();
  const policy = useRestaurantSettings();
  const params = useLocalSearchParams<{ time?: string }>();
  const [dates] = useState(bookingDates);
  const [date, setDate] = useState('');
  const [time, setTime] = useState(typeof params.time === 'string' && bookingTimes.includes(params.time) ? params.time : '');
  const [partySize, setPartySize] = useState(2);
  const [specialRequest, setSpecialRequest] = useState('');
  const reference = useRef<string | null>(null);
  const submit = useSubmit();
  const slots = date ? bookingSlots(policy.settings, date) : bookingTimes;
  return <CustomerGate customer={customer}><Screen>
    <Header title="Book a table" />
    <Text style={styles.section}>SELECT DATE</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{dates.map(option => <Pressable key={option.value} accessibilityLabel={displayDate(option.value)} accessibilityRole="button" accessibilityState={{ selected: date === option.value }} disabled={submit.loading} onPress={() => setDate(option.value)} style={[styles.chip, { width: 60, gap: 4 }, date === option.value && styles.selected]}><Text style={[styles.caption, date === option.value && styles.selectedText]}>{option.day}</Text><Text style={[styles.label, date === option.value && styles.selectedText]}>{option.number}</Text><Text style={[styles.caption, date === option.value && styles.selectedText]}>{option.month}</Text></Pressable>)}</ScrollView>
    <Text style={styles.section}>SELECT TIME</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{slots.map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: time === value }} disabled={submit.loading} onPress={() => setTime(value)} style={[styles.chip, { width: '31%' }, time === value && styles.selected]}><Text style={[styles.chipText, time === value && styles.selectedText]}>{displayTime(value)}</Text></Pressable>)}</View>
    <Text style={styles.section}>GUESTS</Text>
    <View style={[styles.card, styles.row, { justifyContent: 'space-between' }]}><Text style={[styles.label, { flex: 1 }]}>Number of guests</Text><Pressable accessibilityRole="button" accessibilityLabel="Decrease guests" disabled={partySize <= 1 || submit.loading} onPress={() => setPartySize(partySize - 1)} style={[styles.chip, { backgroundColor: palette.white }]}><Text>−</Text></Pressable><Text accessibilityLiveRegion="polite" style={styles.label}>{partySize}</Text><Pressable accessibilityRole="button" accessibilityLabel="Increase guests" disabled={submit.loading || partySize >= policy.settings.maxPartySize} onPress={() => setPartySize(partySize + 1)} style={[styles.chip, styles.selected]}><Text style={styles.selectedText}>+</Text></Pressable></View>
    <Text style={styles.section}>YOUR DETAILS</Text>
    <Field label="Full name" icon="person" value={customer.profile?.fullName || ''} editable={false} />
    <Field label="Phone number" icon="phone" value={customer.profile?.phoneNumber || ''} editable={false} />
    <Field label="Special requests (optional)" placeholder="Window seat if possible, celebrating an anniversary…" value={specialRequest} onChangeText={setSpecialRequest} multiline maxLength={500} editable={!submit.loading} />
    <Feedback message={policy.error || submit.error} />
    {date && !slots.length && <Text style={styles.caption}>The restaurant is closed on this date. Choose another date.</Text>}
    <View style={{ flex: 1 }} />
    <Text style={styles.caption}>Booking summary: {date ? displayDate(date) : 'Select date'} · {time ? displayTime(time) : 'Select time'} · {partySize} guests</Text>
    <Button title="Confirm Booking" disabled={policy.loading || !!policy.error || !date || !slots.includes(time) || partySize > policy.settings.maxPartySize} loading={submit.loading} onPress={() => submit.run(async () => {
      reference.current ??= createBookingReference();
      const reservation = await createCustomerReservation(reference.current, { date, time, partySize, seatingPreference: '', specialRequest });
      router.replace({ pathname: '/customer/booking-confirmation', params: { id: reservation.id, date: reservation.date, time: reservation.time, partySize: String(reservation.partySize), seatingPreference: reservation.seatingPreference, specialRequest: reservation.specialRequest } });
    })} />
  </Screen></CustomerGate>;
}
