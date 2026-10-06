import { Redirect } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native';
import type { PropsWithChildren } from 'react';
import { useCustomer } from '../hooks/use-customer';
import { Feedback, Screen, styles, TextLink } from './ui';

export function CustomerGate({ customer, children }: PropsWithChildren<{ customer: ReturnType<typeof useCustomer> }>) {
  if (customer.loading) return <Screen><ActivityIndicator color="#111" accessibilityLabel="Loading customer profile" /></Screen>;
  if (!customer.user) return <Redirect href="/customer/login" />;
  if (customer.error || !customer.profile) return <Screen><Text style={styles.title}>Unable to load your profile</Text><Feedback message={customer.error || 'Your customer profile is missing. Contact the restaurant.'} /><TextLink label="Back to login" href="/customer/login" /></Screen>;
  return <>{children}</>;
}
