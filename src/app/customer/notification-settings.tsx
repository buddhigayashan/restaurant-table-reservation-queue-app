import { palette } from '@/constants/restaurant-theme';
import { useState } from 'react';
import { ActivityIndicator, Switch, Text, View } from 'react-native';
import { Button, Feedback, Header, Screen, styles } from '@/features/customer/components/ui';
import { useCustomer } from '@/features/customer/hooks/use-customer';
import { useTask } from '@/features/vimandya/hooks';
import { decodePreferences, saveNotificationPreferences, type NotificationPreferences } from '@/services/auth/customer-profile';
export default function NotificationSettingsScreen() {
  const { profile, error, loading } = useCustomer(); const task = useTask();
  const [draft, setPreferences] = useState<NotificationPreferences | null>(null);
  const preferences = draft ?? decodePreferences(profile?.notificationPreferences);
  return <Screen active="Profile"><Header fallback="/customer/profile" title="Notification Settings" />{loading && <ActivityIndicator color={palette.primary} />}<Text style={styles.subtitle}>Choose which updates appear in your in-app notification inbox.</Text>{([['bookingUpdates', 'Booking updates'], ['queueUpdates', 'Queue updates']] as const).map(([key, label]) => <View key={key} style={[styles.card, styles.row]}><Text style={[styles.label, { flex: 1 }]}>{label}</Text><Switch accessibilityLabel={label} value={preferences[key]} disabled={task.busy} onValueChange={value => setPreferences({ ...preferences, [key]: value })} trackColor={{ false: palette.border, true: palette.olive }} /></View>)}<Feedback message={error || task.error || task.message} success={!!task.message} /><Button title="Save Preferences" disabled={!profile} loading={task.busy} onPress={() => task.run(async () => { await saveNotificationPreferences(preferences); return 'Notification preferences saved.'; })} /></Screen>;
}
