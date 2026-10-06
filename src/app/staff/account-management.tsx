import { palette } from '@/constants/restaurant-theme';
import { Icon } from '@/components/common/app-icon';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { AccessState, Button, Choices, Feedback, Field, ModuleScreen, RecordState, styles } from '@/components/vimandya/module-ui';
import { useModuleAccess, useRecords, useTask } from '@/features/vimandya/hooks';
import { listenStaffAccounts, saveStaffProfile } from '@/services/staff/accounts';
import { staffRoles, type StaffProfile } from '@/types/vimandya';

export default function StaffAccountManagementScreen() {
  const access = useModuleAccess('manager');
  const state = useRecords(access.uid, listenStaffAccounts);
  const task = useTask();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<StaffProfile | null>(null);
  const [creating, setCreating] = useState(false);
  const matches = state.rows.filter(profile => `${profile.fullName} ${profile.email} ${profile.role}`.toLowerCase().includes(search.toLowerCase()));
  return <ModuleScreen title="Staff accounts" back right={access.uid ? <Button title="+" disabled={task.busy} outline onPress={() => { setCreating(true); setForm({ uid: '', fullName: '', email: '', role: 'staff', isActive: true }); }} /> : undefined}>
    <AccessState access={access} staff />
    {access.uid && <>
      <Field label="Search staff members" value={search} onChangeText={setSearch} placeholder="Name, email or role" />
      <RecordState state={state} empty="No staff profiles found." /><Feedback task={task} />
      {!state.loading && !state.error && state.rows.length > 0 && !matches.length && <Text style={styles.muted}>No matching staff members.</Text>}
      {matches.map(profile => <View key={profile.uid} style={styles.card}><View style={styles.row}><View style={[styles.iconButton, { width: 48, height: 48 }]}><Text style={styles.name}>{profile.fullName.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}</Text></View><View style={{ flex: 1, gap: 6 }}><View style={[styles.row, { flexWrap: 'wrap' }]}><Text style={styles.name}>{profile.fullName}</Text><Text style={styles.badge}>{profile.role.toUpperCase()}</Text></View><View style={styles.row}><Switch accessibilityLabel={`Activate ${profile.fullName}`} value={profile.isActive} disabled={task.busy} onValueChange={isActive => task.run(() => saveStaffProfile({ ...profile, isActive }))} trackColor={{ false: palette.border, true: palette.olive }} /><Text style={styles.small}>{profile.isActive ? 'Active' : 'Inactive'}</Text></View></View><Pressable accessibilityRole="button" accessibilityLabel={`Edit ${profile.fullName}`} disabled={task.busy} onPress={() => { setCreating(false); setForm(profile); }} style={styles.iconButton}><Icon name="edit" /></Pressable></View></View>)}
      {form && <View style={styles.card}>
        <Text style={styles.name}>{creating ? 'Add staff profile' : 'Edit staff profile'}</Text>
        {creating && <Text style={styles.small}>Use the UID and email of an existing Firebase Authentication account. This form manages its staff profile; it does not create a password.</Text>}
        <Field label="Authentication user UID" value={form.uid} onChangeText={uid => setForm({ ...form, uid })} editable={creating && !task.busy} autoCapitalize="none" />
        <Field label="Full name" value={form.fullName} onChangeText={fullName => setForm({ ...form, fullName })} editable={!task.busy} />
        <Field label="Email" value={form.email} onChangeText={email => setForm({ ...form, email })} editable={!task.busy} autoCapitalize="none" keyboardType="email-address" />
        <Text style={styles.small}>Role</Text><Choices options={[...staffRoles]} value={form.role} onChange={role => setForm({ ...form, role: role as StaffProfile['role'] })} disabled={task.busy} />
        <View style={styles.row}><Switch accessibilityLabel="Account active" value={form.isActive} disabled={task.busy} onValueChange={isActive => setForm({ ...form, isActive })} /><Text style={styles.small}>{form.isActive ? 'Active' : 'Inactive'}</Text></View>
        <Button title="Save profile" disabled={task.busy} onPress={() => task.run(async () => { await saveStaffProfile(form, creating); setForm(null); return 'Staff profile saved.'; })} /><Button title="Close" outline disabled={task.busy} onPress={() => setForm(null)} />
      </View>}
    </>}
  </ModuleScreen>;
}
