import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import {
  ContractorProfileClaimInput,
  LeadPreference,
  buildContractorVerificationChecklist,
  getClaimStatusLabel,
  getMyContractorClaims,
  submitContractorProfileClaim
} from '../services/contractorProfileClaiming';

const leadPreferenceOptions: { label: string; value: LeadPreference }[] = [
  { label: 'HVAC Truth dashboard', value: 'dashboard' },
  { label: 'Email', value: 'email' },
  { label: 'Phone call', value: 'phone' },
  { label: 'Text / SMS', value: 'sms' },
  { label: 'Website contact form', value: 'website_form' }
];

export default function ContractorProfileClaimScreen() {
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [serviceZipCodes, setServiceZipCodes] = useState('');
  const [serviceRadiusMiles, setServiceRadiusMiles] = useState('25');
  const [emergencyService, setEmergencyService] = useState(false);
  const [leadPreferences, setLeadPreferences] = useState<LeadPreference[]>(['dashboard', 'email']);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [claims, setClaims] = useState<any[]>([]);

  useEffect(() => {
    loadClaims();
  }, []);

  async function loadClaims() {
    const { data } = await getMyContractorClaims();
    setClaims(data || []);
  }

  function toggleLeadPreference(value: LeadPreference) {
    setLeadPreferences((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  function buildInput(): ContractorProfileClaimInput {
    return {
      businessName,
      contactName,
      contactRole,
      contactEmail,
      contactPhone,
      website,
      licenseNumber,
      serviceZipCodes: serviceZipCodes.split(',').map((zip) => zip.trim()),
      serviceRadiusMiles: Number(serviceRadiusMiles) || undefined,
      emergencyService,
      leadPreferences,
      verificationNotes
    };
  }

  async function handleSubmit() {
    setSaving(true);
    const { error } = await submitContractorProfileClaim(buildInput());
    setSaving(false);

    if (error) {
      Alert.alert('Claim could not be submitted', error.message);
      return;
    }

    Alert.alert('Claim submitted', 'Your contractor profile claim was submitted for HVAC Truth review.');
    setBusinessName('');
    setContactName('');
    setContactRole('');
    setContactEmail('');
    setContactPhone('');
    setWebsite('');
    setLicenseNumber('');
    setServiceZipCodes('');
    setServiceRadiusMiles('25');
    setEmergencyService(false);
    setLeadPreferences(['dashboard', 'email']);
    setVerificationNotes('');
    loadClaims();
  }

  const checklist = buildContractorVerificationChecklist(buildInput());

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Claim Contractor Profile</Text>
      <Text style={styles.subtitle}>
        Contractors can claim their HVAC Truth profile, verify their business, choose service areas, and set how they want to receive leads.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Business information</Text>
        <TextInput style={styles.input} placeholder="Business name" value={businessName} onChangeText={setBusinessName} />
        <TextInput style={styles.input} placeholder="Website" value={website} onChangeText={setWebsite} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="License number" value={licenseNumber} onChangeText={setLicenseNumber} autoCapitalize="characters" />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Authorized contact</Text>
        <TextInput style={styles.input} placeholder="Contact name" value={contactName} onChangeText={setContactName} />
        <TextInput style={styles.input} placeholder="Role / title" value={contactRole} onChangeText={setContactRole} />
        <TextInput style={styles.input} placeholder="Email" value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Phone" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Service area</Text>
        <TextInput style={styles.input} placeholder="Service ZIP codes, comma separated" value={serviceZipCodes} onChangeText={setServiceZipCodes} keyboardType="number-pad" />
        <TextInput style={styles.input} placeholder="Service radius in miles" value={serviceRadiusMiles} onChangeText={setServiceRadiusMiles} keyboardType="number-pad" />
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Emergency service</Text>
            <Text style={styles.helper}>Show homeowners whether emergency help may be available.</Text>
          </View>
          <Switch value={emergencyService} onValueChange={setEmergencyService} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Lead preferences</Text>
        {leadPreferenceOptions.map((option) => (
          <View key={option.value} style={styles.rowBetween}>
            <Text style={styles.label}>{option.label}</Text>
            <Switch value={leadPreferences.includes(option.value)} onValueChange={() => toggleLeadPreference(option.value)} />
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Review notes</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Anything HVAC Truth should know while reviewing this claim?"
          value={verificationNotes}
          onChangeText={setVerificationNotes}
          multiline
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Verification checklist</Text>
        {checklist.map((item) => (
          <Text key={item} style={styles.checkItem}>• {item}</Text>
        ))}
      </View>

      <PrimaryButton title={saving ? 'Submitting...' : 'Submit Claim'} onPress={handleSubmit} />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>My submitted claims</Text>
        {claims.length === 0 ? (
          <Text style={styles.helper}>No claims submitted yet.</Text>
        ) : (
          claims.map((claim) => (
            <View key={claim.id} style={styles.claimRow}>
              <Text style={styles.claimBusiness}>{claim.business_name}</Text>
              <Text style={styles.helper}>{getClaimStatusLabel(claim.claim_status)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 44, backgroundColor: '#F8FAFC' },
  title: { fontSize: 30, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#475569', marginBottom: 18, lineHeight: 22 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 12, marginBottom: 10, backgroundColor: '#FFFFFF' },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, gap: 12 },
  label: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  helper: { color: '#64748B', lineHeight: 20 },
  checkItem: { color: '#334155', marginBottom: 6 },
  claimRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  claimBusiness: { fontSize: 16, fontWeight: '800', color: '#0F172A' }
});
