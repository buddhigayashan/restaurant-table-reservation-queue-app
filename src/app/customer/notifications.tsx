import { Pressable, Text, View } from 'react-native';
import { AccessState, Feedback, ModuleScreen, RecordState, styles } from '@/components/vimandya/module-ui';
import { useModuleAccess, useNow, useRecords, useTask } from '@/features/vimandya/hooks';
import { dateKey } from '@/features/vimandya/validation';
import { listenCustomerNotifications, markNoticesRead } from '@/services/notifications/customer';

export default function NotificationsScreen() {
  const access = useModuleAccess('customer');
  const state = useRecords(access.uid, listenCustomerNotifications);
  const task = useTask();
  const now = useNow();
  const today = dateKey(new Date(now));
  const unread = state.rows.filter(notice => !notice.read);
  return <ModuleScreen title="Notifications" active="Alerts" right={<Pressable accessibilityRole="button" disabled={task.busy || !unread.length} onPress={() => task.run(() => markNoticesRead(unread.map(item => item.id)))} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={styles.small}>Mark all as read</Text></Pressable>}>
    <AccessState access={access} />
    {access.uid && <>
      <RecordState state={state} empty="No notifications yet." /><Feedback task={task} />
      {['TODAY', 'EARLIER'].map(group => {
        const notices = state.rows.filter(notice => (notice.createdAtMillis > 0 && dateKey(new Date(notice.createdAtMillis)) === today) === (group === 'TODAY'));
        return notices.length ? <View key={group} style={{ gap: 12 }}><Text style={styles.small}>{group}</Text>{notices.map(notice => <Pressable key={notice.id} accessibilityRole="button" accessibilityLabel={`${notice.title}, ${notice.read ? 'read' : 'unread'}. Mark as read.`} disabled={task.busy || notice.read} onPress={() => task.run(() => markNoticesRead([notice.id]))} style={styles.card}><View style={styles.row}><View style={[styles.dateBadge, { minWidth: 36, minHeight: 36 }]}><Text style={{ color: '#fff' }}>{notice.type === 'table_ready' ? '♧' : '◷'}</Text></View><Text style={[styles.name, { flex: 1 }]}>{notice.title}</Text><Text style={styles.small}>{notice.read ? 'Read' : '●'}</Text></View><Text style={styles.muted}>{notice.message}</Text><Text style={styles.small}>{notice.createdAtMillis ? new Date(notice.createdAtMillis).toLocaleString() : 'Saving…'}</Text></Pressable>)}</View> : null;
      })}
    </>}
  </ModuleScreen>;
}
