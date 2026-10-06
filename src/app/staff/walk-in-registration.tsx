import { palette, radius } from '@/constants/restaurant-theme';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { OperationFeedback, StaffAccess, StaffButton, StaffChips, StaffDataState, StaffField, StaffScreen, ui } from '@/components/staff/operations-ui';
import { useOperation, useStaffAccess, useStaffRecords } from '@/features/staff-operations/hooks';
import { listenOperationalQueue } from '@/services/staff/operations-listeners';
import { registerWalkIn } from '@/services/queue/walk-in';
import { estimateWalkInQueue } from '@/features/staff-operations/helpers';

export default function WalkInRegistrationScreen() {
  const access = useStaffAccess();
  const queue = useStaffRecords(access.uid, listenOperationalQueue);
  const task = useOperation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [largeParty, setLargeParty] = useState(false);
  const [preference, setPreference] = useState('No preference');
  const [submittedWait, setSubmittedWait] = useState<number | null>(null);
  // A realtime join adds this party to the queue. Keep its saved estimate visible
  // until staff edit the next walk-in form, instead of showing the next party's wait.
  const estimate = submittedWait ?? estimateWalkInQueue(queue.rows).estimatedWaitMinutes;
  return <StaffScreen title="Add walk-in" back><StaffAccess state={access} />{access.uid && <>
    <StaffField label="Guest name" value={name} onChangeText={value => { setSubmittedWait(null); setName(value); }} placeholder="e.g. John Doe" editable={!task.busy} autoComplete="name" />
    <StaffField label="Phone number (optional)" value={phone} onChangeText={value => { setSubmittedWait(null); setPhone(value); }} placeholder="Phone number" keyboardType="phone-pad" editable={!task.busy} />
    <Text style={ui.small}>Party size</Text>
    <View style={[ui.row, { flexWrap: 'wrap' }]}>{[1, 2, 3, 4, 5, 6, 7, 8].map(size => <Pressable key={size} accessibilityRole="button" accessibilityLabel={size === 8 ? '8 or more guests' : `${size} guests`} accessibilityState={{ selected: largeParty ? size === 8 : size === partySize }} disabled={task.busy} onPress={() => { setSubmittedWait(null); setPartySize(size); setLargeParty(size === 8); }} style={[ui.date, { width: '22%', minHeight: 44, justifyContent: 'center' }, (largeParty ? size === 8 : partySize === size) && { backgroundColor: palette.primary }]}><Text style={[ui.heading, (largeParty ? size === 8 : partySize === size) && { color: palette.white }]}>{size === 8 ? '8+' : size}</Text></Pressable>)}</View>
    {largeParty && <StaffField label="Exact party size (8–20)" value={String(partySize || '')} onChangeText={value => { setSubmittedWait(null); setPartySize(Number(value)); }} keyboardType="number-pad" editable={!task.busy} />}
    <Text style={ui.small}>Seating preference</Text>
    <StaffChips values={['No preference', 'Indoor', 'Outdoor']} selected={preference} onChange={value => { if (!task.busy) { setSubmittedWait(null); setPreference(value); } }} />
    <StaffDataState state={queue} empty="" />
    {!queue.loading && !queue.error && <Text style={[ui.small, { textAlign: 'center', marginVertical: 16, padding: 16, borderRadius: radius.card, backgroundColor: palette.warningSoft, color: palette.warning }]}>◷ Estimated wait ~{estimate} min · approximate</Text>}
    <OperationFeedback task={task} />
    <StaffButton title="Add to Queue" disabled={task.busy || queue.loading || !!queue.error} onPress={() => task.run(async () => { if (largeParty && partySize < 8) throw new Error('Enter 8–20 guests, or select a smaller party size.'); const result = await registerWalkIn({ customerName: name, phoneNumber: phone, partySize, seatingPreference: preference }); setSubmittedWait(result.estimatedWaitMinutes); setName(''); setPhone(''); setPartySize(2); setLargeParty(false); return `Walk-in added at position ${result.position}. Initial estimate: ${result.estimatedWaitMinutes} minutes.`; })} />
  </>}</StaffScreen>;
}
