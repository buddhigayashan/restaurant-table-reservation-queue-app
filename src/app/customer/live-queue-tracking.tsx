import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { AccessState, Button, Feedback, ModuleScreen, RecordState, styles } from '@/components/vimandya/module-ui';
import { useModuleAccess, useRecords, useTask } from '@/features/vimandya/hooks';
import { leaveCustomerQueue, listenOwnQueue } from '@/services/queue/customer';
import { ensureQueueStatusNotice } from '@/services/notifications/customer';
import { friendlyError } from '@/features/vimandya/validation';

export default function LiveQueueTrackingScreen() {
  const { entryId } = useLocalSearchParams<{ entryId?: string }>();
  const access = useModuleAccess('customer');
  const state = useRecords(access.uid, listenOwnQueue);
  const task = useTask();
  const [confirm, setConfirm] = useState(false);
  const [noticeError, setNoticeError] = useState('');
  const entry = entryId ? state.rows.find(item => item.id === entryId) : state.rows[0];
  const id = entry?.id;
  const status = entry?.status;
  useEffect(() => {
    if (!id || !access.uid || !['called', 'seated'].includes(status || '')) return;
    let active = true;
    ensureQueueStatusNotice(id).then(() => { if (active) setNoticeError(''); }).catch(error => { if (active) setNoticeError(friendlyError(error)); });
    return () => { active = false; };
  }, [id, status, access.uid]);
  const waiting = entry?.status === 'waiting';
  const canLeave = waiting || entry?.status === 'called';
  return <ModuleScreen title="Your queue" active="Queue" right={<Button title="Refresh" outline onPress={state.retry} />}>
    <AccessState access={access} />
    {access.uid && <>
      <RecordState state={state} empty="You haven’t joined the queue yet." />
      {!state.loading && !state.error && !entry && <Button title="Join Queue" onPress={() => router.push('/customer/join-queue')} />}
      {entry && <>
        <View style={[styles.card, { alignItems: 'center', paddingVertical: 28 }]}>
          <Text style={{ fontSize: waiting ? 64 : 28, fontWeight: '700', color: '#111' }}>{waiting ? entry.position : entry.status === 'called' ? 'Your table is ready' : entry.status === 'seated' ? 'You’re seated' : 'Queue cancelled'}</Text>
          <Text style={styles.small}>{waiting ? 'Your position' : entry.status === 'called' ? 'Please head to the host stand' : 'This queue visit is complete'}</Text>
          <Text style={styles.muted}>◷ {waiting ? `Estimated wait ${entry.estimatedWaitMinutes} min` : entry.status}</Text>
          {waiting && <View style={{ height: 4, width: '90%', backgroundColor: '#DDD', borderRadius: 2 }} />}
        </View>
        <View style={styles.row}><View style={[styles.card, { flex: 1 }]}><Text style={styles.small}>♧ Party size</Text><Text style={styles.name}>{entry.partySize}</Text></View><View style={[styles.card, { flex: 1 }]}><Text style={styles.small}>◷ Joined at</Text><Text style={styles.name}>{entry.joinedAtMillis ? new Date(entry.joinedAtMillis).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Saving…'}</Text></View></View>
        <View style={styles.card}><Text style={styles.muted}>We’ll notify you when your table is ready.</Text></View>
        {!!noticeError && <Text style={styles.error}>Notification could not be saved: {noticeError}</Text>}
        <Feedback task={task} />
        {canLeave && <Button title="Leave Queue" outline disabled={task.busy} onPress={() => setConfirm(true)} />}
        {confirm && canLeave && <View style={styles.card}><Text style={styles.name}>Leave the queue?</Text><Text style={styles.muted}>Your entry will be cancelled.</Text><Button title="Confirm leave" disabled={task.busy} onPress={() => task.run(async () => { await leaveCustomerQueue(entry.id); setConfirm(false); })} /><Button title="Keep my place" outline disabled={task.busy} onPress={() => setConfirm(false)} /></View>}
      </>}
      <Button title="Back to Home" outline onPress={() => router.push('/customer/home')} />
    </>}
  </ModuleScreen>;
}
