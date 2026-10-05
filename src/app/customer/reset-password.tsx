import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Feedback, Field, Header, Icon, Screen, styles, TextLink } from '@/features/customer/components/ui';
import { useSubmit } from '@/features/customer/hooks/use-submit';
import { resetCustomerPassword } from '@/services/auth/customer';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const submit = useSubmit();
  return <Screen>
    <Header title="" fallback="/customer/login" />
    <View style={styles.authHeading}><View style={[styles.card, { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' }]}><Icon name="lock" size={34} /></View><Text style={styles.title}>Reset your password</Text><Text style={[styles.subtitle, { textAlign: 'center' }]}>Enter your email and we’ll send you a reset link.</Text></View>
    <Field label="Email address" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={value => { setEmail(value); setSent(false); }} editable={!submit.loading} />
    <Button title="Send Reset Link" loading={submit.loading} onPress={() => submit.run(async () => { setSent(false); await resetCustomerPassword(email); setSent(true); })} />
    <Feedback message={submit.error} />
    {sent && <Feedback success message="If an account exists for this email, check your inbox for the reset link." />}
    <View style={{ flex: 1, minHeight: 80 }} /><TextLink label="Back to login" href="/customer/login" />
  </Screen>;
}
