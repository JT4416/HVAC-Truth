import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

export default function OnboardingScreen({ navigation }: any) {
  const [zipCode, setZipCode] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Know the truth before you call.</Text>
      <Text style={styles.body}>Enter your ZIP code so HVAC Truth can personalize contractor results, pricing guidance, and maintenance tips.</Text>
      <TextInput style={styles.input} placeholder="ZIP code" keyboardType="number-pad" value={zipCode} onChangeText={setZipCode} />
      <PrimaryButton title="Continue" onPress={() => navigation.navigate('Home')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 12 },
  body: { fontSize: 16, lineHeight: 24, marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, fontSize: 18, marginBottom: 12 }
});
