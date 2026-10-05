import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { AccessState, Button, Choices, Feedback, Field, ModuleScreen, PartySize, RecordState, styles } from '@/components/vimandya/module-ui';
import { useModuleAccess, useRecords, useTask } from '@/features/vimandya/hooks';
import { joinCustomerQueue, listenOwnQueue, listenQueueEstimate } from '@/services/queue/customer';

export default function JoinQueueScreen() {
  const access = useModuleAccess('customer');
  const estimate = useRecords(access.uid, listenQueueEstimate);
  const own = useRecords(access.uid, listenOwnQueue);
  const task = useTask();
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [preference, setPreference] = useState('Indoor');
  const [acknowledged, setAcknowledged] = useState(false);
  const active = own.rows.find(entry => entry.status === 'waiting' || entry.status === 'called');
  return <ModuleScreen title="Join the queue" active="Queue" back>
    <AccessState access={access} />
    {access.uid && <>
      <RecordState state={estimate} empty="Wait estimate unavailable." />
      {!estimate.loading && !estimate.error && <View style={styles.card}><Text style={styles.name}>◷ Current wait ~{((estimate.rows[0] || 0) + 1) * 5} min</Text><Text style={styles.small}>{estimate.rows[0] || 0} parties ahead · approximate, not a promised time</Text></View>}
      <RecordState state={own} empty="" />
      {active && <View style={styles.card}><Text style={styles.muted}>You already have an active queue entry.</Text><Button title="View your queue" onPress={() => router.push('/customer/live-queue-tracking')} /></View>}
      <Field label="Full name *" value={name ?? access.name} onChangeText={setName} placeholder="Your full name" editable={!task.busy} autoComplete="name" />
      <Field label="Phone number *" value={phone ?? access.phone} onChangeText={setPhone} placeholder="Your phone number" keyboardType="phone-pad" editable={!task.busy} />
      <Text style={styles.small}>Party size</Text><PartySize value={partySize} onChange={setPartySize} disabled={task.busy} />
      <Text style={styles.small}>Seating preference (optional)</Text><Choices options={['Indoor', 'Outdoor', 'No preference']} value={preference} onChange={setPreference} disabled={task.busy} />
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acknowledged }} onPress={() => setAcknowledged(value => !value)} style={[styles.row, { minHeight: 44 }]}><Text style={styles.name}>{acknowledged ? '☑' : '☐'}</Text><Text style={[styles.small, { flex: 1 }]}>I’ll wait for my table when you have it ready.</Text></Pressable>
      <Feedback task={task} />
      <Button title="Join Queue →" disabled={task.busy || !!active || own.loading || !!own.error || estimate.loading || !!estimate.error} onPress={() => task.run(async () => {
        const id = await joinCustomerQueue({ customerName: name ?? access.name, phoneNumber: phone ?? access.phone, partySize, seatingPreference: preference, acknowledged });
        router.replace({ pathname: '/customer/live-queue-tracking', params: { entryId: id } });
      })} />
    </>}
  </ModuleScreen>;
}
