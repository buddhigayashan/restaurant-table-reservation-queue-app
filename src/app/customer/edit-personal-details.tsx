import { palette } from '@/constants/restaurant-theme';
import { useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { Button, Feedback, Field, Header, Screen, styles } from '@/features/customer/components/ui';
import { useCustomer } from '@/features/customer/hooks/use-customer';
import { useTask } from '@/features/vimandya/hooks';
import { updateCustomerDetails } from '@/services/auth/customer-profile';
export default function EditPersonalDetailsScreen() {
  const { profile, error, loading } = useCustomer(); const task = useTask();
  const [draftName, setName] = useState<string | null>(null); const [draftPhone, setPhone] = useState<string | null>(null);
  const name = draftName ?? profile?.fullName ?? ''; const phone = draftPhone ?? profile?.phoneNumber ?? '';
  return <Screen active="Profile"><Header fallback="/customer/profile" title="Edit Personal Details" />{loading && <ActivityIndicator color={palette.primary} />}<Field label="Full name" icon="person" value={name} onChangeText={setName} editable={!task.busy} /><Field label="Phone number" icon="phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!task.busy} /><Text style={styles.caption}>Email: {profile?.email}. Your email and account identity cannot be changed here.</Text><Feedback message={error || task.error || task.message} success={!!task.message} /><Button title="Save Changes" disabled={!profile} loading={task.busy} onPress={() => task.run(async () => { await updateCustomerDetails(name, phone); return 'Your personal details have been saved.'; })} /></Screen>;
}
