import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import {
  ClaimReviewDecision,
  ContractorClaimReviewRecord,
  buildClaimReviewChecklist,
  formatClaimStatus,
  getContractorClaimForReview,
  getReviewDecisionLabel,
  reviewContractorClaim
} from '../services/contractorClaimReview';

export default function AdminContractorClaimDetailScreen({ route, navigation }: any) {
  const claimId = route.params?.claimId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [claim, setClaim] = useState<ContractorClaimReviewRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadClaim();
  }, [claimId]);

  async function loadClaim() {
    setLoading(true);
    const { data, error } = await getContractorClaimForReview(claimId);
    setLoading(false);

    if (error || !data) {
      Alert.alert('Claim unavailable', error?.message || 'Claim could not be found.');
      navigation.goBack();
      return;
    }

    setClaim(data);
    setReviewNotes(data.review_notes || '');
  }

  async function handleDecision(decision: ClaimReviewDecision) {
    if (!claim) return;
    setSaving(true);
    const { error } = await reviewContractorClaim({ claimId: claim.id, decision, reviewNotes });
    setSaving(false);

    if (error) {
      Alert.alert('Review could not be saved', error.message);
      return;
    }

    Alert.alert('Claim review saved', `${getReviewDecisionLabel(decision)} completed.`);
    navigation.goBack();
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0F172A" /></View>;
  if (!claim) return null;

  const checklist = buildClaimReviewChecklist(claim);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Review Claim</Text>
      <Text style={styles.subtitle}>{claim.business_name}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Claim status</Text>
        <Text style={styles.value}>{formatClaimStatus(claim.claim_status)}</Text>
        <Text style={styles.helper}>Submitted: {new Date(claim.created_at).toLocaleString()}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Business information</Text>
        <Text style={styles.label}>Business name</Text>
        <Text style={styles.value}>{claim.business_name}</Text>
        <Text style={styles.label}>Website</Text>
        <Text style={styles.value}>{claim.website || 'Not provided'}</Text>
        <Text style={styles.label}>License number</Text>
        <Text style={styles.value}>{claim.license_number || 'Not provided'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Authorized contact</Text>
        <Text style={styles.value}>Name: {claim.contact_name}</Text>
        <Text style={styles.value}>Role: {claim.contact_role || 'Not provided'}</Text>
        <Text style={styles.value}>Email: {claim.contact_email}</Text>
        <Text style={styles.value}>Phone: {claim.contact_phone || 'Not provided'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Service and delivery setup</Text>
        <Text style={styles.value}>Service ZIPs: {claim.service_zip_codes.join(', ') || 'Not provided'}</Text>
        <Text style={styles.value}>Radius: {claim.service_radius_miles || 'Not provided'} miles</Text>
        <Text style={styles.value}>Emergency service: {claim.emergency_service ? 'Yes' : 'No'}</Text>
        <Text style={styles.value}>Delivery methods: {claim.delivery_methods.join(', ') || 'Not provided'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Verification checklist</Text>
        {checklist.map((item) => <Text key={item} style={styles.checkItem}>• {item}</Text>)}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Reviewer notes</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Document why this claim was approved, rejected, or needs more information."
          value={reviewNotes}
          onChangeText={setReviewNotes}
          multiline
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Decision</Text>
        <Text style={styles.helper}>Approving a claim should create or update the contractor profile, turn on HVAC Truth verification, create dashboard access, copy service areas, and copy delivery methods.</Text>
        <PrimaryButton title={saving ? 'Saving...' : 'Approve and Verify'} onPress={() => handleDecision('verified')} />
        <PrimaryButton title="Request More Information" onPress={() => handleDecision('needs_review')} />
        <PrimaryButton title="Reject Claim" onPress={() => handleDecision('rejected')} />
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
  label: { fontSize: 13, fontWeight: '800', color: '#64748B', marginTop: 10, textTransform: 'uppercase' },
  value: { color: '#0F172A', lineHeight: 21, marginTop: 3 },
  helper: { color: '#64748B', lineHeight: 20 },
  checkItem: { color: '#334155', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 12, marginBottom: 10, backgroundColor: '#FFFFFF' },
  multiline: { minHeight: 120, textAlignVertical: 'top' }
});
