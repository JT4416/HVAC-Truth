import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../services/supabase';
import { upsertProfile, getOrCreatePrimaryHome } from '../services/profilePersistence';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing info', 'Enter an email and password to continue.');
      return;
    }

    if (mode === 'signup' && !zipCode.trim()) {
      Alert.alert('ZIP code needed', 'HVAC Truth needs your ZIP code for local contractor results and price guidance.');
      return;
    }

    try {
      setLoading(true);

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              zip_code: zipCode.trim()
            }
          }
        });

        if (error) throw error;
        if (!data.user) throw new Error('Account created but no user record was returned.');

        await upsertProfile({
          userId: data.user.id,
          email: email.trim(),
          fullName: fullName.trim(),
          zipCode: zipCode.trim()
        });
        await getOrCreatePrimaryHome(data.user.id, zipCode.trim());
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (error) throw error;
      }
    } catch (error: any) {
      Alert.alert('Authentication error', error?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>HVAC Truth</Text>
      <Text style={styles.title}>{mode === 'signup' ? 'Create your homeowner profile' : 'Welcome back'}</Text>
      <Text style={styles.body}>Save your home, system details, data plate photos, and decoder results securely.</Text>

      {mode === 'signup' ? (
        <>
          <TextInput style={styles.input} placeholder="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
          <TextInput style={styles.input} placeholder="ZIP code" value={zipCode} onChangeText={setZipCode} keyboardType="number-pad" maxLength={10} />
        </>
      ) : null}

      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

      {loading ? <ActivityIndicator size="large" color="#0B66E4" /> : <PrimaryButton title={mode === 'signup' ? 'Create Account' : 'Sign In'} onPress={handleSubmit} />}

      <TouchableOpacity onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
        <Text style={styles.switchText}>{mode === 'signup' ? 'I already have an account' : 'Create a new account'}</Text>
      </TouchableOpacity>

      <View style={styles.safeBox}>
        <Text style={styles.safeTitle}>Private by design</Text>
        <Text style={styles.safeText}>Your system photos are stored in a private Supabase bucket under your user ID. They are not public app assets.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F8FAFC' },
  logo: { color: '#0B66E4', fontSize: 18, fontWeight: '900', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 30, fontWeight: '900', color: '#0F2E5F', marginBottom: 10 },
  body: { fontSize: 16, lineHeight: 23, color: '#475569', marginBottom: 22 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, padding: 14, fontSize: 16, marginBottom: 12 },
  switchText: { color: '#0B66E4', fontWeight: '900', textAlign: 'center', marginTop: 16 },
  safeBox: { marginTop: 22, backgroundColor: '#E6FFFA', borderColor: '#5EEAD4', borderWidth: 1, borderRadius: 16, padding: 14 },
  safeTitle: { color: '#0F766E', fontWeight: '900', marginBottom: 4 },
  safeText: { color: '#334155', lineHeight: 20 }
});
