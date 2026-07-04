import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import {
  ContractorDashboardUser,
  getContractorAvailabilityWindows,
  getContractorDashboardDeliveryMethods,
  getVerifiedContractorDashboardUsers
} from '../services/contractorDashboard';
import {
  buildDeliveryMethodEmptyState,
  buildDeliveryMethodSourceSummary,
  ContractorDeliveryMethodReadSource,
  formatContractorDeliveryMethod,
  formatContractorDeliveryMethodSource
} from '../services/contractorDeliveryMethods';
import { VERIFIED_CONTRACTOR_PARTICIPATION_STANDARD } from '../services/contractorParticipationRules';

export default function ContractorLeadPreferencesScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [contractors, setContractors] = useState<ContractorDashboardUser[]>([]);
  const [deliveryMethods, setDeliveryMethods] = useState<any[]>([]);
  const [deliveryMethodSource, setDeliveryMethodSource] = useState<ContractorDeliveryMethodReadSource | null>(null);
  const [deliveryMethodFallback, setDeliveryMethodFallback] = useState(false);
  const [availability, setAvailability] = useState<any[]>([]);

  useEffect(() => {
    loadParticipationSettings();
  }, []);

  async function loadParticipationSettings() {
    setLoading(true);
    const access = await getVerifiedContractorDashboardUsers();
    setContractors(access.data || []);

    const contractorId = access.data?.[0]?.contractor_id;
    if (contractorId) {
      const deliveryMethodResult = await getContractorDashboardDeliveryMethods(contractorId);
      const availabilityResult = await getContractorAvailabilityWindows(contractorId);
      setDeliveryMethods(deliveryMethodResult.data || []);
      setDeliveryMethodSource(deliveryMethodResult.source || null);
      setDeliveryMethodFallback(deliveryMethodResult.source === 'contractor_lead_preferences');
      setAvailability(availabilityResult.data || []);
    } else {
      setDeliveryMethods([]);
      setDeliveryMethodSource(null);
      setDeliveryMethodFallback(false);
    }

    setLoading(false);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0F172A" /></View>;

  if (contractors.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Participation Settings</Text>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Verification required</Text>
          <Text style={styles.helper}>Only verified contractors can participate in HVAC Truth dashboard routing. Until verification is complete, your company remains on public contact routing.</Text>
          <PrimaryButton title="Claim Contractor Profile" onPress={() => navigation.navigate('ContractorProfileClaim')} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Participation Settings</Text>
      <Text style={styles.subtitle}>Review how your verified contractor profile participates in HVAC Truth routing.</Text>

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
        <Text style={styles.sectionTitle}>Participation standard</Text>
        {VERIFIED_CONTRACTOR_PARTICIPATION_STANDARD.map((rule) => (
          <Text key={rule} style={styles.helper}>• {rule}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Current delivery methods</Text>
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceBadgeText}>{formatContractorDeliveryMethodSource(deliveryMethodSource)}</Text>
        </View>
        <Text style={styles.helper}>{buildDeliveryMethodSourceSummary(deliveryMethodSource, deliveryMethods.length, deliveryMethodFallback)}</Text>
        {deliveryMethodFallback ? (
          <Text style={styles.warningText}>Legacy compatibility mode is active. Delivery rows should be migrated to the current delivery-method table before retiring legacy fields.</Text>
        ) : null}
        {deliveryMethods.length === 0 ? (
          <Text style={styles.helper}>{buildDeliveryMethodEmptyState(deliveryMethodSource)}</Text>
        ) : (
          deliveryMethods.map((method) => (
            <View key={method.id} style={styles.row}>
              <Text style={styles.rowTitle}>{formatContractorDeliveryMethod(method.delivery_method || method.preferred_method)}</Text>
              <Text style={styles.helper}>{method.destination || 'No destination stored'}</Text>
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
        <Text style={styles.sectionTitle}>What this is not</Text>
        <Text style={styles.helper}>This screen is not a request-category picker. Active verified contractors may use operating limits, but they do not choose only replacement estimates, easy calls, high-score packets, or other preferred request types.</Text>
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
  warningText: { color: '#92400E', lineHeight: 20, marginTop: 8, fontWeight: '700' },
  sourceBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#E2E8F0', marginBottom: 8 },
  sourceBadgeText: { color: '#334155', fontWeight: '800', fontSize: 12 },
  row: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  rowTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' }
});
