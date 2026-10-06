import { palette, radius, space, typography } from '@/constants/restaurant-theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Icon, Screen, styles, TextLink } from '@/features/customer/components/ui';
import { restaurantImages } from '@/constants/restaurant-images';

const slides = [
  { title: 'Book a table in seconds', description: 'Pick your date, time and guests. No calls, no hassle.' },
  { title: 'Skip the waiting line', description: 'Join the queue remotely and track your spot live.' },
  { title: 'Never miss your table', description: "Get reminders and instant alerts when it’s your turn." },
];

const visuals = [restaurantImages.booking, restaurantImages.queue, restaurantImages.ready];
const imageLabels = ['Warm dining room with tables set for guests', 'Welcoming restaurant dining area, illustrating a queue visit', 'A thoughtfully plated meal being served at a restaurant table'];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  return <Screen>
    <View style={local.top}>
      <Pressable accessibilityLabel="Previous onboarding screen" disabled={step === 0} onPress={() => setStep(step - 1)} style={[styles.iconButton, { opacity: step === 0 ? 0 : 1 }]}><Icon name="back" /></Pressable>
      {step < 2 && <Pressable accessibilityRole="button" onPress={() => setStep(2)} style={local.skip}><Text style={styles.caption}>Skip</Text></Pressable>}
    </View>
    <View style={local.visual}>
      <Image source={visuals[step]} contentFit="cover" contentPosition="center" accessibilityLabel={imageLabels[step]} style={local.image} />
      <View style={local.shade} />
      <View style={local.story}><View style={local.storyIcon}><Icon name={step === 0 ? 'calendar' : step === 1 ? 'clock' : 'bell'} size={20} color={palette.white} /></View><Text style={local.storyText}>{step === 0 ? 'A seat at your favourite table' : step === 1 ? 'More dining. Less waiting.' : 'Your table, right on time.'}</Text></View>
      {step === 1 && <View style={local.preview}><Icon name="clock" color={palette.olive} /><View><Text style={styles.caption}>QUEUE POSITION PREVIEW</Text><Text style={local.position}>04</Text></View></View>}
      {step === 2 && <View style={local.preview}><View style={local.readyIcon}><Icon name="check" color={palette.success} /></View><View style={{ flex: 1 }}><Text style={[styles.label, { color: palette.success }]}>Table-ready alerts</Text><Text style={styles.caption}>Stay in the loop</Text></View></View>}
    </View>
    <View style={[local.copy, step > 0 && styles.center]}>
      <Text style={[styles.title, local.heading, step > 0 && { textAlign: 'center' }]}>{slides[step].title}</Text>
      <Text style={[styles.subtitle, step > 0 && { textAlign: 'center' }]}>{slides[step].description}</Text>
    </View>
    <View style={{ flex: 1, minHeight: 30 }} />
    <View accessibilityLabel={`Onboarding step ${step + 1} of 3`} style={local.dots}>{slides.map((_, i) => <View key={i} style={[local.dot, i === step && local.activeDot]} />)}</View>
    <Button title={step === 2 ? 'Get Started \u2192' : 'Next \u2192'} onPress={() => step === 2 ? router.replace('/customer/login') : setStep(step + 1)} />
    {step === 1 && <Pressable onPress={() => setStep(0)} style={styles.link}><Text style={styles.caption}>Back</Text></Pressable>}
    {step === 2 && <TextLink label="Already have an account? Log in" href="/customer/login" />}
  </Screen>;
}
const local = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  skip: { paddingHorizontal: space.card, minHeight: 44, justifyContent: 'center' },
  visual: { width: '100%', aspectRatio: 1.05, maxHeight: 390, borderRadius: radius.hero, overflow: 'hidden', backgroundColor: palette.sand, borderWidth: 1, borderColor: palette.gold },
  image: { width: '100%', height: '100%' }, shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 112, backgroundColor: palette.overlay },
  story: { position: 'absolute', left: space.page, right: space.page, bottom: space.page, flexDirection: 'row', alignItems: 'center', gap: space.md },
  storyIcon: { width: 40, height: 40, borderRadius: radius.round, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
  storyText: { color: palette.white, fontSize: typography.label, fontWeight: '600', flex: 1, lineHeight: 21 },
  preview: { position: 'absolute', top: space.page, left: space.page, right: space.page, padding: space.card, backgroundColor: palette.cream, borderRadius: radius.card, flexDirection: 'row', alignItems: 'center', gap: space.md },
  position: { color: palette.olive, fontSize: 36, lineHeight: 42, fontWeight: '700' }, readyIcon: { backgroundColor: palette.successSoft, width: 40, height: 40, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
  copy: { gap: space.md, marginTop: space.sm }, heading: { fontSize: 30, lineHeight: 37, letterSpacing: -0.5 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, paddingVertical: space.md }, dot: { width: 8, height: 8, borderRadius: radius.round, backgroundColor: palette.border }, activeDot: { width: 28, backgroundColor: palette.primary },
});
