import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { ContractorSearchResult, searchContractors } from '../services/contractorDiscovery';
import { buildStandardizedLeadPacket, detectContractorContactRoute, performContactRoute } from '../services/contractorContactRouting';

export default function ContractorFinderScreen({ navigation }: any) {
  const [zipCode, setZipCode] = useState('');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [providerMessage, setProviderMessage] = useState('');
  const [persistedCount, setPersistedCount] = useState(0);
  const [results, setResults] = useState<ContractorSearchResult[]>([]);

  async function search() {
    setLoading(true);
    try {
      const response = await searchContractors({ zipCode, emergencyOnly, maxResults: 10 });
      setResults(response.results);
      setPersistedCount(response.persistedCount ?? response.results.filter((item) => item.persisted).length);
      setProviderMessage(response.message ?? `${response.results.length} contractor results found for ${response.zipCode}.`);
    } finally {
      setLoading(false);
    }
  }

  const statusText = useMemo(() => {
    if (!results.length) return 'Search by ZIP code to find well-reviewed contractors near the homeowner.';
    return `${providerMessage} ${persistedCount} result(s) are tied to persisted contractor records.`;
  }, [providerMessage, persistedCount, results.length]);

  async function openBestRoute(contractor: ContractorSearchResult) {
    const route = detectContractorContactRoute(contractor);
    const packet = buildStandardizedLeadPacket({
      serviceTypeLabel: 'HVAC service request',
      urgency: emergencyOnly ? 'emergency_today' : 'this_week',
      zipCode,
      homeownerName: '',
      homeownerPhone: '',
      homeownerEmail: '',
      contactPreference: 'phone',
      preferredTimeWindow: 'Homeowner to provide',
      symptomSummary: 'Homeowner is searching for HVAC contractor help through HVAC Truth.',
      desiredOutcome: 'Get a ballpark estimate and schedule service if appropriate.',
      reportSnapshot: {}
    });
    await performContactRoute(route, packet, packet);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Find a Technician</Text>
      <Text style={styles.subtitle}>Search contractors by ZIP code, then rank them by review strength, rating, proximity, emergency availability, and contact-route quality.</Text>

      <View style={styles.searchCard}>
        <Text style={styles.label}>ZIP code</Text>
        <TextInput style={styles.input} placeholder="Example: 33401" keyboardType="number-pad" value={zipCode} onChangeText={setZipCode} />
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.switchTitle}>Emergency service only</Text>
            <Text style={styles.switchSub}>Prioritize contractors showing emergency/after-hours availability.</Text>
          </View>
          <Switch value={emergencyOnly} onValueChange={setEmergencyOnly} />
        </View>
        <PrimaryButton title={loading ? 'Searching...' : 'Search Contractors'} onPress={search} />
      </View>

      <Text style={styles.status}>{statusText}</Text>
      {loading ? <ActivityIndicator color="#0B66E4" size="large" /> : null}

      {results.map((contractor) => (
        <View key={contractor.id ?? contractor.contractorId ?? contractor.businessName} style={styles.card}>
          <View style={styles.rowBetweenTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{contractor.businessName}</Text>
              <Text style={styles.meta}>{contractor.rating ? `${contractor.rating.toFixed(1)} ★` : 'No rating'} · {contractor.reviewCount ?? 0} reviews · {contractor.distanceMiles ?? '?'} mi</Text>
              <Text style={styles.address}>{contractor.address ?? contractor.city ?? 'Address not shown yet'}</Text>
              {contractor.contractorId ? <Text style={styles.recordId}>Contractor record: {contractor.contractorId.slice(0, 8)}...</Text> : null}
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.score}>{contractor.trustScore}</Text>
              <Text style={styles.scoreLabel}>score</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            {contractor.persisted ? <Text style={styles.badge}>Persisted record</Text> : <Text style={styles.badgeMuted}>Provider-only</Text>}
            {contractor.matchMethod ? <Text style={styles.badgeMuted}>{contractor.matchMethod}</Text> : null}
            {contractor.verified ? <Text style={styles.badge}>Verified listing</Text> : null}
            {contractor.emergencyService ? <Text style={styles.badgeAlert}>Emergency</Text> : null}
            {contractor.hvacTruthVerified ? <Text style={styles.badge}>HVAC Truth verified</Text> : null}
            {contractor.acceptsDashboardLeads ? <Text style={styles.badge}>Dashboard leads</Text> : null}
          </View>

          <Text style={styles.route}>Best route: {contractor.contactRouteLabel}</Text>
          <Text style={styles.reasons}>{contractor.trustScoreReasons.slice(0, 3).join(' · ')}</Text>

          <View style={styles.buttonRow}>
            <Pressable style={styles.secondaryButton} onPress={() => openBestRoute(contractor)}>
              <Text style={styles.secondaryButtonText}>Open Contact Route</Text>
            </Pressable>
            <Pressable style={styles.primarySmallButton} onPress={() => navigation?.navigate?.('ContractorLeadRequest')}>
              <Text style={styles.primarySmallButtonText}>Request Help</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Text style={styles.note}>Production discovery runs through server-side providers, not directly from the mobile app. That keeps provider keys off the phone and lets HVAC Truth cache, dedupe, score, persist, and audit contractor results.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 48, backgroundColor: '#F8FAFC' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8, color: '#0F172A' },
  subtitle: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 16 },
  searchCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  label: { fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 14, backgroundColor: '#FFFFFF' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  rowBetweenTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  switchTitle: { fontWeight: '700', color: '#0F172A' },
  switchSub: { color: '#64748B', fontSize: 12, maxWidth: 230, lineHeight: 18 },
  status: { color: '#475569', marginBottom: 14, lineHeight: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  name: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  meta: { marginTop: 4, color: '#334155', fontWeight: '600' },
  address: { marginTop: 4, color: '#64748B' },
  recordId: { marginTop: 4, color: '#64748B', fontSize: 12, fontWeight: '700' },
  scoreBadge: { width: 58, height: 58, borderRadius: 14, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' },
  score: { fontSize: 20, fontWeight: '900', color: '#0369A1' },
  scoreLabel: { fontSize: 11, color: '#0369A1', fontWeight: '700' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  badge: { backgroundColor: '#DCFCE7', color: '#166534', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, fontSize: 12, fontWeight: '700' },
  badgeMuted: { backgroundColor: '#E2E8F0', color: '#475569', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, fontSize: 12, fontWeight: '700' },
  badgeAlert: { backgroundColor: '#FFEDD5', color: '#9A3412', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, fontSize: 12, fontWeight: '700' },
  route: { marginTop: 12, fontWeight: '800', color: '#0B66E4' },
  reasons: { marginTop: 6, color: '#64748B', lineHeight: 20 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: '#0B66E4', padding: 12, borderRadius: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#0B66E4', fontWeight: '800' },
  primarySmallButton: { flex: 1, backgroundColor: '#0B66E4', padding: 12, borderRadius: 12, alignItems: 'center' },
  primarySmallButtonText: { color: '#FFFFFF', fontWeight: '800' },
  note: { marginTop: 12, color: '#64748B', fontSize: 13, lineHeight: 20 }
});
