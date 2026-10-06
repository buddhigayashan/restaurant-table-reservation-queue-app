import { useState } from 'react';
import { Button, Feedback, Field, Header, Screen } from '@/features/customer/components/ui';
import { useTask } from '@/features/vimandya/hooks';
import { changeCustomerPassword } from '@/services/auth/customer-profile';
export default function ChangePasswordScreen() {
  const task = useTask(); const [current, setCurrent] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  return <Screen active="Profile"><Header fallback="/customer/profile" title="Change Password" /><Field label="Current password" password value={current} onChangeText={setCurrent} autoComplete="current-password" editable={!task.busy} /><Field label="New password" password value={password} onChangeText={setPassword} autoComplete="new-password" editable={!task.busy} /><Field label="Confirm new password" password value={confirm} onChangeText={setConfirm} autoComplete="new-password" editable={!task.busy} /><Feedback message={task.error || task.message} success={!!task.message} /><Button title="Change Password" loading={task.busy} onPress={() => task.run(async () => { await changeCustomerPassword(current, password, confirm); setCurrent(''); setPassword(''); setConfirm(''); return 'Your password has been changed.'; })} /></Screen>;
}
