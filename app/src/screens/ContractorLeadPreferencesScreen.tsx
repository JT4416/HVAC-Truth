import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import {
  ContractorDashboardUser,
  getContractorAvailabilityWindows,
  getContractorLeadPreferences,
  getVerifiedContractorDashboardUsers
} from '../services/contractorDashboard';

const methodLabels: Record<string, string> = {
  dashboard: 'HVAC Truth dashboard',
  email: 'Email',
  phone: 'Phone call',
  sms: 'Text / SMS',
  website_form: 'Website contact form'
};

export default function ContractorLeadPreferencesScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [contractors, setContractors] = useState<ContractorDashboardUser[]>([]);
  const [preferences, setPreferences] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    setLoading(true);
    const access = await getVerifiedContractorDashboardUsers();
    setContractors(access.data || []);

    const contractorId = access.data?.[0]?.contractor_id;
    if (contractorId) {
      const preferenceResult = await getContractorLeadPreferences(contractorId);
      const availabilityResult = await getContractorAvailabilityWindows(contractorId);
      setPreferences(preferenceResult.data || []);
      setAvailability(availabilityResult.data || []);
    }

    setLoading(false);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0F172A" /></View>;

  if (contractors.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Lead Preferences</Text>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Verification required</Text>
          <Text style={styles.helper}>Only verified contractors can manage dashboard lead preferences.</Text>
          <PrimaryButton title="Claim Contractor Profile" onPress={() => navigation.navigate('ContractorProfileClaim')} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Lead Preferences</Text>
      <Text style={styles.subtitle}>Review how HVAC Truth routes leads to your verified contractor profile.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Verified contractors</Text>
        {contractors.map((contractor) => (
          <View key={contractor.id} style={styles.row}>
            <Text style={styles.rowTitle}>{contractor.business_name || 'Verified contractor'}</Text>
            <Text style={styles.helper}>Role: {contractor.role}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Current lead delivery methods</Text>
        {preferences.length === 0 ? (
          <Text style={styles.helper}>No lead preferences have been created yet. Dashboard delivery should be added during claim verification.</Text>
        ) : (
          preferences.map((preference) => (
            <View key={preference.id} style={styles.row}>
              <Text style={styles.rowTitle}>{methodLabels[preference.preferred_method] || preference.preferred_method}</Text>
              <Text style={styles.helper}>{preference.destination || 'No destination stored'}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Availability windows</Text>
        {availability.length === 0 ? (
          <Text style={styles.helper}>No availability windows have been saved yet.</Text>
        ) : (
          availability.map((window) => (
            <View key={window.id} style={styles.row}>
              <Text style={styles.rowTitle}>{window.day_of_week}</Text>
              <Text style={styles.helper}>{window.start_time} - {window.end_time}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>V12 note</Text>
        <Text style={styles.helper}>This screen is read-first for the MVP. Contractor preference editing should be enabled after the claim review workflow copies approved claim data into the verified contractor tables.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, paddingBottom: 44, backgroundColor: '#F8FAFC' },
  title: { fontSize: 30, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#475569', marginBottom: 18, lineHeight: 22 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  helper: { color: '#64748B', lineHeight: 20 },
  row: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  rowTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' }
});
