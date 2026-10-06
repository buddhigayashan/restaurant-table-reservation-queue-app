import { Text, View } from 'react-native';
import { Header, Screen, styles } from '@/features/customer/components/ui';
export default function HelpSupportScreen() {
  return <Screen active="Profile"><Header fallback="/customer/profile" title="Help & Support" />{[
    ['Managing a booking', 'Open My Bookings and select an upcoming booking to edit its details or cancel it before arrival. Cancelled bookings remain in your history.'],
    ['Your queue position', 'Join Queue once, then open Your queue to follow live updates. When called, go to the host stand. Waiting times are estimates, not guaranteed arrival times.'],
    ['Account help', 'Use Forgot password on the login screen to reset your password. For reservation or account problems, speak to the restaurant host or manager.'],
    ['Notifications', 'Updates appear inside this app. SMS and device push notifications are not enabled.'],
  ].map(([title, description]) => <View key={title} style={styles.card}><Text style={styles.label}>{title}</Text><Text style={styles.subtitle}>{description}</Text></View>)}</Screen>;
}
