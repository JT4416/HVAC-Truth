import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import {
  ContractorClaimReviewRecord,
  formatClaimStatus,
  getPendingContractorClaims
} from '../services/contractorClaimReview';

export default function AdminContractorClaimReviewScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<ContractorClaimReviewRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadClaims);
    loadClaims();
    return unsubscribe;
  }, [navigation]);

  async function loadClaims() {
    setLoading(true);
    setErrorMessage('');
    const { data, error } = await getPendingContractorClaims();
    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setClaims(data || []);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0F172A" /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Contractor Claim Review</Text>
      <Text style={styles.subtitle}>Review submitted contractor profile claims before activating HVAC Truth dashboard leads.</Text>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pending claims</Text>
        {claims.length === 0 ? (
          <Text style={styles.helper}>No submitted or review-needed claims are waiting.</Text>
        ) : (
          claims.map((claim) => (
            <View key={claim.id} style={styles.claimCard}>
              <Text style={styles.businessName}>{claim.business_name}</Text>
              <Text style={styles.helper}>Status: {formatClaimStatus(claim.claim_status)}</Text>
              <Text style={styles.helper}>Contact: {claim.contact_name} • {claim.contact_email}</Text>
              <Text style={styles.helper}>Service ZIPs: {claim.service_zip_codes.join(', ') || 'Not provided'}</Text>
              <PrimaryButton title="Open Claim" onPress={() => navigation.navigate('AdminContractorClaimDetail', { claimId: claim.id })} />
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Review rule</Text>
        <Text style={styles.helper}>A submitted claim is not verification. Dashboard lead access should only turn on after the business identity, contact method, service area, and lead preferences are approved.</Text>
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
  claimCard: { paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  businessName: { fontSize: 17, fontWeight: '900', color: '#0F172A', marginBottom: 4 }
});
