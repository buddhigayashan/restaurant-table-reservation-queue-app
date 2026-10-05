import { Text, View } from 'react-native';
import { StaffAccess, StaffScreen, ui } from '@/components/staff/operations-ui';
import { useStaffAccess } from '@/features/staff-operations/hooks';

// Personal profile only; manager account CRUD belongs to Vimandya.
export default function StaffProfileScreen() {
  const access = useStaffAccess(true);
  return <StaffScreen title="My staff account" back><StaffAccess state={access} />{access.profile && <View style={ui.card}><Text style={ui.heading}>{access.profile.fullName || 'Staff member'}</Text><Text style={ui.muted}>{access.profile.email}</Text><Text style={ui.badge}>{access.profile.role.toUpperCase()}</Text><Text style={ui.small}>{access.profile.isActive ? 'Active account' : 'Inactive account'}</Text></View>}</StaffScreen>;
}
