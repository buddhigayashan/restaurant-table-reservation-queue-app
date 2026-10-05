import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Feedback, Field, Screen, styles, TextLink } from '@/features/customer/components/ui';
import { useSubmit } from '@/features/customer/hooks/use-submit';
import { loginCustomer } from '@/services/auth/customer';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = useSubmit();
  return <Screen>
    <View style={styles.authHeading}><View style={styles.logo}><Text style={{ color: '#fff', fontSize: 22 }}>▦</Text></View><Text style={styles.title}>Welcome back</Text><Text style={styles.subtitle}>Log in to manage your bookings</Text></View>
    <Field label="Email" icon="mail" placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={email} onChangeText={setEmail} editable={!submit.loading} />
    <Field label="Password" icon="lock" placeholder="Enter your password" password autoComplete="current-password" value={password} onChangeText={setPassword} editable={!submit.loading} />
    <View style={{ alignItems: 'flex-end' }}><TextLink label="Forgot password?" href="/customer/reset-password" /></View>
    <Feedback message={submit.error} />
    <Button title="Log In →" loading={submit.loading} onPress={() => submit.run(async () => { await loginCustomer(email, password); router.replace('/customer/home'); })} />
    <Text style={[styles.caption, { textAlign: 'center', marginVertical: 12 }]}>or</Text>
    <Button outline disabled title="Continue with Google (unavailable)" />
    <TextLink label="New here? Sign up" href="/customer/sign-up" />
  </Screen>;
}
