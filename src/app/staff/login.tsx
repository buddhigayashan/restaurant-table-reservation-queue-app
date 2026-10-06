import { palette } from '@/constants/restaurant-theme';
import { Icon } from '@/components/common/app-icon';
import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, Feedback, Field, ModuleScreen, styles } from '@/components/vimandya/module-ui';
import { useTask } from '@/features/vimandya/hooks';
import { resetStaffPassword, staffLogin } from '@/services/staff/accounts';

export default function StaffLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const task = useTask();
  return <ModuleScreen title="">
    <View style={{ alignItems: 'center', gap: 12, paddingVertical: 32 }}><View style={styles.dateBadge}><Icon name="restaurant" size={24} color={palette.white} /></View><Text style={styles.badge}>● STAFF</Text></View>
    <Text style={styles.title}>Staff sign in</Text><Text style={styles.muted}>For restaurant team members only</Text>
    <Field label="Staff email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="staff@restaurant.com" editable={!task.busy} />
    <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry={!visible} autoCapitalize="none" autoComplete="current-password" placeholder="Enter your password" editable={!task.busy} />
    <View style={[styles.row, { justifyContent: 'space-between' }]}><Pressable accessibilityRole="button" onPress={() => setVisible(value => !value)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={styles.small}>{visible ? 'Hide password' : 'Show password'}</Text></Pressable><Pressable accessibilityRole="button" disabled={task.busy} onPress={() => task.run(async () => { await resetStaffPassword(email); return 'If this email has an account, a password reset link will be sent.'; })} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={styles.small}>Forgot password?</Text></Pressable></View>
    <Feedback task={task} />
    <Button title="Sign In" disabled={task.busy} onPress={() => task.run(async () => {
      const profile = await staffLogin(email, password);
      setPassword('');
      router.replace(profile.role === 'kitchen' ? '/kitchen/upcoming-reservations' : '/staff/dashboard');
    })} />
    <Button title="Customer sign in" outline onPress={() => router.replace('/customer/login')} />
    <Text style={[styles.small, { textAlign: 'center', marginTop: 40 }]}>Having trouble accessing your account?{ '\n' }Contact your restaurant manager for support.</Text>
  </ModuleScreen>;
}
