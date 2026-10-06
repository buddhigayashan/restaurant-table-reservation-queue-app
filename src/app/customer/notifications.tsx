import { palette, statusTone, accentCard } from '@/constants/restaurant-theme';
import { Icon } from '@/components/common/app-icon';
import { router } from 'expo-router';
import { useCustomer } from '@/features/customer/hooks/use-customer';
import { decodePreferences } from '@/services/auth/customer-profile';
import { Pressable, Text, View } from 'react-native';
import { AccessState, Feedback, ModuleScreen, RecordState, styles } from '@/components/vimandya/module-ui';
import { useModuleAccess, useNow, useRecords, useTask } from '@/features/vimandya/hooks';
import { dateKey } from '@/features/vimandya/validation';
import { listenCustomerNotifications, markNoticesRead } from '@/services/notifications/customer';

export default function NotificationsScreen() {
  const { profile } = useCustomer();
  const preferences = decodePreferences(profile?.notificationPreferences);
  const access = useModuleAccess('customer');
  const state = useRecords(access.uid, listenCustomerNotifications);
  const task = useTask();
  const now = useNow();
  const today = dateKey(new Date(now));
  const visible = state.rows.filter(notice => notice.queueEntryId || notice.type === 'queue_update' || (notice.type === 'table_ready' && !notice.reservationId) ? preferences.queueUpdates : preferences.bookingUpdates);
  const unread = visible.filter(notice => !notice.read);
  return <ModuleScreen title="Notifications" active="Alerts" right={<Pressable accessibilityRole="button" disabled={task.busy || !unread.length} onPress={() => task.run(() => markNoticesRead(unread.map(item => item.id)))} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={styles.small}>Mark all as read</Text></Pressable>}>
    <AccessState access={access} />
    {access.uid && <>
      <RecordState state={{ ...state, rows: visible }} empty="No notifications for your current preferences." /><Feedback task={task} />
      {['TODAY', 'EARLIER'].map(group => {
        const notices = visible.filter(notice => (notice.createdAtMillis > 0 && dateKey(new Date(notice.createdAtMillis)) === today) === (group === 'TODAY'));
        return notices.length ? <View key={group} style={{ gap: 12 }}><Text style={styles.small}>{group}</Text>{notices.map(notice => <Pressable key={notice.id} accessibilityRole="button" accessibilityLabel={`${notice.title}, ${notice.read ? 'read' : 'unread'}. Mark as read.`} disabled={task.busy || (notice.read && !notice.reservationId && !notice.queueEntryId)} onPress={() => task.run(async () => { if (!notice.read) await markNoticesRead([notice.id]); if (notice.reservationId) router.push({ pathname: '/customer/booking-confirmation', params: { id: notice.reservationId } }); else if (notice.queueEntryId) router.push({ pathname: '/customer/live-queue-tracking', params: { entryId: notice.queueEntryId } }); })} style={[styles.card, accentCard(notice.type), !notice.read && { borderColor: palette.primary, borderLeftColor: statusTone(notice.type).foreground }]}><View style={styles.row}><View style={[styles.dateBadge, { minWidth: 36, minHeight: 36, backgroundColor: statusTone(notice.type).background }]}><Icon name={notice.type === 'table_ready' ? 'check' : notice.type === 'queue_update' ? 'clock' : 'calendar'} color={statusTone(notice.type).foreground} /></View><Text style={[styles.name, { flex: 1 }]}>{notice.title}</Text><Text style={styles.small}>{notice.read ? 'Read' : '●'}</Text></View><Text style={styles.muted}>{notice.message}</Text><Text style={styles.small}>{notice.createdAtMillis ? new Date(notice.createdAtMillis).toLocaleString() : 'Saving…'}</Text></Pressable>)}</View> : null;
      })}
    </>}
  </ModuleScreen>;
}
