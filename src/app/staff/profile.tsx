import { StatusBadge } from '@/components/common/status-badge';
import { palette } from '@/constants/restaurant-theme';
import { Text, View } from 'react-native';
import { StaffAccess, StaffButton, StaffScreen, OperationFeedback, ui } from '@/components/staff/operations-ui';
import { router } from 'expo-router';
import { roleDestination } from '@/features/auth/access';
import { logout } from '@/services/auth/customer-profile';
import { useOperation, useStaffAccess } from '@/features/staff-operations/hooks';

// Personal profile only; manager account CRUD belongs to Vimandya.
export default function StaffProfileScreen() {
  const access = useStaffAccess(true);
  const task = useOperation();
  return <StaffScreen title="My staff account" back fallback={access.profile ? roleDestination(access.profile.role) : '/staff/login'}><StaffAccess state={access} />{access.profile && <><View style={[ui.card, { backgroundColor: palette.sand }]}><Text style={ui.heading}>{access.profile.fullName || 'Staff member'}</Text><Text style={ui.muted}>{access.profile.email}</Text><Text style={ui.badge}>{access.profile.role.toUpperCase()}</Text><StatusBadge status={access.profile.isActive ? 'active' : 'inactive'} label={access.profile.isActive ? 'Active account' : 'Inactive account'} /></View>{access.profile.role === 'manager' && <StaffButton title="Manage staff accounts" outline onPress={() => router.push('/staff/account-management')} />}<StaffButton title="Sign Out" disabled={task.busy} onPress={() => task.run(async () => { await logout(); router.replace('/staff/login'); })} /><OperationFeedback task={task} /></>}</StaffScreen>;
}
