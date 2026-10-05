import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Icon, Screen, styles, TextLink, colors } from '@/features/customer/components/ui';

const slides = [
  { title: 'Book a table in seconds', description: 'Pick your date, time and guests. No calls, no hassle.' },
  { title: 'Skip the waiting line', description: 'Join the queue remotely and track your spot live.' },
  { title: 'Never miss your table', description: "Get reminders and instant alerts when it’s your turn." },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  return <Screen>
    <View style={local.top}>
      <Pressable accessibilityLabel="Previous onboarding screen" disabled={step === 0} onPress={() => setStep(step - 1)} style={{ opacity: step === 0 ? 0 : 1 }}><Icon name="back" /></Pressable>
      {step < 2 && <Pressable onPress={() => setStep(2)}><Text style={styles.caption}>Skip</Text></Pressable>}
    </View>
    <View style={[local.visual, step === 2 && { backgroundColor: '#fff' }]}>
      {step === 0 ? <View style={local.table}>
        <Text style={{ color: '#fff', fontSize: 18 }}>T1</Text>
        {[{ top: -20, left: -20 }, { top: -20, right: -20 }, { bottom: -20, left: -20 }, { bottom: -20, right: -20 }].map((position, i) => <View key={i} style={[local.chair, position]} />)}
      </View> : step === 1 ? <View style={local.phone}><Text style={styles.caption}>YOUR QUEUE POSITION</Text><Text style={{ fontSize: 44, fontWeight: '700' }}>04</Text><View style={local.bar} /><Text style={styles.caption}>Queue illustration</Text></View> : <View style={local.bell}><Icon name="bell" size={64} /><View style={local.badge}><Icon name="check" size={16} /></View></View>}
    </View>
    <View style={[local.copy, step > 0 && styles.center]}>
      <Text style={[styles.title, step > 0 && { textAlign: 'center' }]}>{slides[step].title}</Text>
      <Text style={[styles.subtitle, step > 0 && { textAlign: 'center' }]}>{slides[step].description}</Text>
    </View>
    <View style={{ flex: 1, minHeight: 30 }} />
    <View accessibilityLabel={`Onboarding step ${step + 1} of 3`} style={local.dots}>{slides.map((_, i) => <View key={i} style={[local.dot, i === step && local.activeDot]} />)}</View>
    <Button title={step === 2 ? 'Get Started →' : 'Next →'} onPress={() => step === 2 ? router.replace('/customer/sign-up') : setStep(step + 1)} />
    {step === 1 && <Pressable onPress={() => setStep(0)} style={styles.link}><Text style={styles.caption}>Back</Text></Pressable>}
    {step === 2 && <TextLink label="Already have an account? Log in" href="/customer/login" />}
  </Screen>;
}
const local = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', minHeight: 24 },
  visual: { minHeight: 250, height: 290, backgroundColor: colors.surface, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  table: { width: 150, height: 110, backgroundColor: colors.green, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  chair: { position: 'absolute', height: 40, width: 40, borderRadius: 20, backgroundColor: '#90DAB8' },
  phone: { width: 150, height: 230, borderWidth: 3, borderColor: '#D0D0D0', borderRadius: 24, padding: 18, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: '#fff' },
  bar: { height: 6, width: 75, borderRadius: 3, backgroundColor: colors.ink },
  bell: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECF8F1' },
  badge: { position: 'absolute', bottom: 20, right: 15, borderRadius: 20, backgroundColor: colors.green, padding: 10 },
  copy: { gap: 10, marginTop: 18 }, dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#D7D7D7' }, activeDot: { width: 24, backgroundColor: colors.ink },
});
