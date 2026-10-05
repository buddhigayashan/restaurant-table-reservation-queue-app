import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Feedback, Field, Screen, styles, TextLink } from '@/features/customer/components/ui';
import { useSubmit } from '@/features/customer/hooks/use-submit';
import { signUpCustomer } from '@/services/auth/customer';
import type { CustomerSignUpInput } from '@/types/customer';

export default function SignUpScreen() {
  const [form, setForm] = useState<CustomerSignUpInput>({ fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '' });
  const submit = useSubmit();
  const update = (key: keyof CustomerSignUpInput, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  return <Screen>
    <View style={styles.authHeading}><View style={styles.logo}><Text style={{ color: '#fff', fontSize: 22 }}>▦</Text></View><Text style={styles.title}>Create your account</Text><Text style={styles.subtitle}>Book tables and skip the wait</Text></View>
    <Field label="Full name" icon="person" placeholder="Enter your full name" value={form.fullName} onChangeText={value => update('fullName', value)} autoComplete="name" editable={!submit.loading} />
    <Field label="Email" icon="mail" placeholder="Enter your email" value={form.email} onChangeText={value => update('email', value)} autoCapitalize="none" keyboardType="email-address" autoComplete="email" editable={!submit.loading} />
    <Field label="Phone number" icon="phone" placeholder="Enter your phone number" value={form.phoneNumber} onChangeText={value => update('phoneNumber', value)} keyboardType="phone-pad" autoComplete="tel" editable={!submit.loading} />
    <Field label="Password" icon="lock" placeholder="Create a password" password value={form.password} onChangeText={value => update('password', value)} autoComplete="new-password" editable={!submit.loading} />
    <Field label="Confirm password" icon="lock" placeholder="Confirm your password" password value={form.confirmPassword} onChangeText={value => update('confirmPassword', value)} autoComplete="new-password" editable={!submit.loading} />
    <Feedback message={submit.error} />
    <Button title="Sign Up →" loading={submit.loading} onPress={() => submit.run(async () => { await signUpCustomer(form); router.replace('/customer/home'); })} />
    <TextLink label="Already have an account? Log in" href="/customer/login" />
  </Screen>;
}
