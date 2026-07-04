import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import {
  ContractorParticipationAdminRecord,
  buildAdminParticipationSummary,
  getParticipationContractors
} from '../services/contractorParticipationAdmin';

export default function AdminContractorParticipationScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [contractors, setContractors] = useState<ContractorParticipationAdminRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadContractors);
    loadContractors();
    return unsubscribe;
  }, [navigation]);

  async function loadContractors() {
    setLoading(true);
    setErrorMessage('');
    const { data, error } = await getParticipationContractors();
    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setContractors(data || []);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0F172A" /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Participation Controls</Text>
      <Text style={styles.subtitle}>Manage whether verified contractors are active, inactive, paused, suspended, inside service area, or capacity-limited.</Text>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Verified contractor network</Text>
        {contractors.length === 0 ? (
          <Text style={styles.helper}>No verified contractors are ready for participation controls yet.</Text>
        ) : (
          contractors.map((contractor) => {
            const decision = buildAdminParticipationSummary(contractor);
            return (
              <View key={contractor.id} style={styles.contractorCard}>
                <Text style={styles.businessName}>{contractor.business_name || contractor.businessName || 'Verified contractor'}</Text>
                <Text style={styles.status}>{decision.label}</Text>
                <Text style={styles.helper}>{decision.reason}</Text>
                <Text style={styles.helper}>Service ZIPs: {(contractor.service_zip_codes || contractor.serviceZipCodes || []).join(', ') || 'Not restricted in app yet'}</Text>
                <Text style={styles.helper}>Emergency: {contractor.emergency_service || contractor.emergencyService ? 'Yes' : 'Standard hours only'}</Text>
                <PrimaryButton title="Edit Participation" onPress={() => navigation.navigate('AdminContractorParticipationDetail', { contractorId: contractor.id })} />
              </View>
            );
          })
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Network rule</Text>
        <Text style={styles.helper}>Verified contractors are either in or out of HVAC Truth verified routing. They may set operating limits, but they cannot cherry-pick only certain lead categories or packet scores.</Text>
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
  helper: { color: '#64748B', lineHeight: 20, marginTop: 4 },
  error: { color: '#B91C1C', marginBottom: 12, fontWeight: '700' },
  contractorCard: { paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  businessName: { fontSize: 17, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  status: { color: '#0F172A', fontWeight: '900', marginBottom: 4 }
});
