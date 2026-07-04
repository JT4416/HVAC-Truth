import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import {
  ContractorDashboardLead,
  ContractorDashboardUser,
  formatLeadServiceType,
  formatLeadUrgency,
  loadContractorDashboardLeads
} from '../services/contractorDashboard';

export default function ContractorDashboardScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [contractors, setContractors] = useState<ContractorDashboardUser[]>([]);
  const [leads, setLeads] = useState<ContractorDashboardLead[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadDashboard);
    loadDashboard();
    return unsubscribe;
  }, [navigation]);

  async function loadDashboard() {
    setLoading(true);
    setErrorMessage('');
    const { data, contractors: contractorAccess, error } = await loadContractorDashboardLeads();
    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setContractors(contractorAccess);
    setLeads(data);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0F172A" /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Contractor Dashboard</Text>
      <Text style={styles.subtitle}>Verified HVAC Truth contractors can review homeowner lead packets, open system reports, and manage lead status.</Text>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {contractors.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Verification required</Text>
          <Text style={styles.helper}>Direct dashboard leads are only available to verified HVAC Truth contractors. Until verification is complete, your company stays on public contact routing.</Text>
          <PrimaryButton title="Claim Contractor Profile" onPress={() => navigation.navigate('ContractorProfileClaim')} />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Verified dashboard access</Text>
          {contractors.map((contractor) => (
            <View key={contractor.id} style={styles.contractorRow}>
              <Text style={styles.contractorName}>{contractor.business_name || 'Verified contractor'}</Text>
              <Text style={styles.helper}>Role: {contractor.role} • Status: {contractor.dashboard_status}</Text>
            </View>
          ))}
          <PrimaryButton title="Lead Preferences" onPress={() => navigation.navigate('ContractorLeadPreferences')} />
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Incoming lead packets</Text>
        {leads.length === 0 ? (
          <Text style={styles.helper}>No dashboard leads are waiting right now.</Text>
        ) : (
          leads.map((lead) => (
            <View key={lead.recipientId} style={styles.leadCard}>
              <Text style={styles.leadTitle}>{formatLeadServiceType(lead.serviceType)}</Text>
              <Text style={styles.helper}>Urgency: {formatLeadUrgency(lead.urgency)}</Text>
              <Text style={styles.helper}>ZIP: {lead.zipCode || 'Not provided'} • Status: {lead.status}</Text>
              <Text style={styles.summary} numberOfLines={3}>{lead.symptomSummary || 'No homeowner summary provided.'}</Text>
              <PrimaryButton title="Open Lead Packet" onPress={() => navigation.navigate('ContractorLeadDetail', { leadId: lead.leadRequestId })} />
            </View>
          ))
        )}
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
  error: { color: '#B91C1C', marginBottom: 12, fontWeight: '700' },
  contractorRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  contractorName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  leadCard: { paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  leadTitle: { fontSize: 17, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  summary: { color: '#334155', marginTop: 8, lineHeight: 20 }
});
