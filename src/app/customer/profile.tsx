import { palette } from '@/constants/restaurant-theme';
import { SettingsRow } from '@/components/common/settings-row';
import { router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button, Feedback, Header, Screen, styles } from '@/features/customer/components/ui';
import { useCustomer } from '@/features/customer/hooks/use-customer';
import { useSubmit } from '@/features/customer/hooks/use-submit';
import { logout } from '@/services/auth/customer-profile';
export default function ProfileScreen() {
  const { profile, error, loading } = useCustomer(); const submit = useSubmit();
  return <Screen active="Profile"><Header title="Profile" />{loading && <ActivityIndicator color={palette.primary} />}<View style={[styles.card, styles.center, { backgroundColor: palette.sand }]}><View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: palette.olive, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: palette.white, fontSize: 28, fontWeight: '600' }}>{profile?.fullName ? profile.fullName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() : '?'}</Text></View><Text style={styles.title}>{profile?.fullName || 'Your profile'}</Text><Text style={styles.subtitle}>{profile?.email}</Text><Text style={styles.caption}>{profile?.phoneNumber}</Text></View>
    <Feedback message={error || submit.error} />
    {([['Edit Personal Details', '/customer/edit-personal-details'], ['Change Password', '/customer/change-password'], ['Notification Settings', '/customer/notification-settings'], ['Help & Support', '/customer/help-support']] as const).map(([title, href]) => <SettingsRow key={href} title={title} onPress={() => router.push(href)} />)}
    <View style={{ flex: 1, minHeight: 16 }} /><View style={{ borderTopWidth: 1, borderColor: palette.border, paddingTop: 20 }} /><Button title="Log Out" loading={submit.loading} onPress={() => submit.run(async () => { await logout(); router.replace('/customer/login'); })} />
  </Screen>;
}
