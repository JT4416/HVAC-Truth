import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import {
  ContractorDashboardLead,
  ContractorNote,
  addContractorLeadNote,
  formatLeadServiceType,
  formatLeadUrgency,
  getContractorDashboardLead,
  updateContractorLeadStatus
} from '../services/contractorDashboard';

export default function ContractorLeadDetailScreen({ route, navigation }: any) {
  const leadId = route.params?.leadId;
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<ContractorDashboardLead | null>(null);
  const [notes, setNotes] = useState<ContractorNote[]>([]);
  const [noteBody, setNoteBody] = useState('');

  useEffect(() => {
    loadLead();
  }, [leadId]);

  async function loadLead() {
    setLoading(true);
    const { data, notes: leadNotes, error } = await getContractorDashboardLead(leadId);
    setLoading(false);

    if (error) {
      Alert.alert('Lead unavailable', error.message);
      navigation.goBack();
      return;
    }

    setLead(data);
    setNotes(leadNotes || []);
  }

  async function handleStatus(status: 'accepted' | 'declined' | 'scheduled') {
    if (!lead) return;
    const { error } = await updateContractorLeadStatus(lead.contractorId, lead.leadRequestId, status);
    if (error) {
      Alert.alert('Status could not be updated', error.message);
      return;
    }
    Alert.alert('Lead updated', `Lead marked ${status}.`);
    loadLead();
  }

  async function handleAddNote() {
    if (!lead) return;
    const { error } = await addContractorLeadNote(lead.contractorId, lead.leadRequestId, noteBody);
    if (error) {
      Alert.alert('Note could not be saved', error.message);
      return;
    }
    setNoteBody('');
    loadLead();
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0F172A" /></View>;
  if (!lead) return null;

  const report = lead.reportSnapshot || {};
  const troubleshooting = (report as any).troubleshooting;
  const packet = troubleshooting?.contractorPacket;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Lead Packet</Text>
      <Text style={styles.subtitle}>{formatLeadServiceType(lead.serviceType)} • {formatLeadUrgency(lead.urgency)}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Homeowner request</Text>
        <Text style={styles.label}>ZIP code</Text>
        <Text style={styles.value}>{lead.zipCode || 'Not provided'}</Text>
        <Text style={styles.label}>Preferred contact</Text>
        <Text style={styles.value}>{lead.contactPreference || 'Not provided'}</Text>
        <Text style={styles.label}>Preferred time window</Text>
        <Text style={styles.value}>{lead.preferredTimeWindow || 'Not provided'}</Text>
        <Text style={styles.label}>Issue summary</Text>
        <Text style={styles.value}>{lead.symptomSummary || 'Not provided'}</Text>
        <Text style={styles.label}>Desired outcome</Text>
        <Text style={styles.value}>{lead.desiredOutcome || 'Not provided'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contact details</Text>
        <Text style={styles.value}>Name: {lead.homeownerName || 'Not provided'}</Text>
        <Text style={styles.value}>Phone: {lead.homeownerPhone || 'Not provided'}</Text>
        <Text style={styles.value}>Email: {lead.homeownerEmail || 'Not provided'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contractor-ready system report</Text>
        <Text style={styles.value}>System type: {String(report.systemType || 'Not provided')}</Text>
        <Text style={styles.value}>Brand: {String(report.brand || 'Not provided')}</Text>
        <Text style={styles.value}>Age: {String(report.estimatedAgeYears || 'Unknown')}</Text>
        <Text style={styles.value}>Tonnage: {String(report.tonnage || 'Unknown')}</Text>
        <Text style={styles.value}>Refrigerant: {String(report.refrigerantType || 'Unknown')}</Text>
        <Text style={styles.value}>Filter size: {String(report.filterSize || 'Unknown')}</Text>
        <Text style={styles.value}>Indoor model: {String(report.indoorModelNumber || 'Not provided')}</Text>
        <Text style={styles.value}>Outdoor model: {String(report.outdoorModelNumber || 'Not provided')}</Text>
        <Text style={styles.value}>Air handler location: {String(report.airHandlerLocation || 'Not provided')}</Text>
        <Text style={styles.value}>Access notes: {String(report.accessNotes || 'Not provided')}</Text>
        <Text style={styles.value}>Decoder confidence: {String(report.decoderConfidence || 'Unknown')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Troubleshooting completed by homeowner</Text>
        {troubleshooting ? (
          <>
            <Text style={styles.label}>Workflow</Text>
            <Text style={styles.value}>{String(troubleshooting.workflowTitle || 'Not provided')}</Text>
            <Text style={styles.label}>Severity</Text>
            <Text style={styles.value}>{String(troubleshooting.severity || 'Not provided')}</Text>
            <Text style={styles.label}>Summary</Text>
            <Text style={styles.value}>{String(troubleshooting.summary || 'Not provided')}</Text>
            <Text style={styles.label}>Homeowner script</Text>
            <Text style={styles.value}>{String(troubleshooting.homeownerScript || 'Not provided')}</Text>
            <Text style={styles.label}>Contractor notes</Text>
            {Array.isArray(troubleshooting.contractorReportNotes) && troubleshooting.contractorReportNotes.length
              ? troubleshooting.contractorReportNotes.map((note: string) => <Text key={note} style={styles.value}>• {note}</Text>)
              : <Text style={styles.value}>No notes provided</Text>}
          </>
        ) : <Text style={styles.helper}>No troubleshooting session attached to this lead.</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contractor packet intelligence</Text>
        {packet ? (
          <>
            <Text style={styles.label}>Severity explanation</Text>
            <Text style={styles.value}>{String(packet.severityExplanation || 'Not provided')}</Text>
            <Text style={styles.label}>Professional verification focus</Text>
            {Array.isArray(packet.professionalVerificationFocus) && packet.professionalVerificationFocus.length
              ? packet.professionalVerificationFocus.map((item: string) => <Text key={item} style={styles.value}>• {item}</Text>)
              : <Text style={styles.value}>No focus items provided</Text>}
            <Text style={styles.label}>Homeowner safety boundary</Text>
            {Array.isArray(packet.homeownerSafetyBoundary) && packet.homeownerSafetyBoundary.length
              ? packet.homeownerSafetyBoundary.map((item: string) => <Text key={item} style={styles.warning}>• {item}</Text>)
              : <Text style={styles.value}>No safety boundary items provided</Text>}
            <Text style={styles.label}>Suggested safe photos</Text>
            {Array.isArray(packet.suggestedPhotoPrompts) && packet.suggestedPhotoPrompts.length
              ? packet.suggestedPhotoPrompts.map((prompt: any) => <Text key={prompt.id} style={styles.value}>• {prompt.label}: {prompt.instruction} Safety: {prompt.safetyNote}</Text>)
              : <Text style={styles.value}>No photo prompts provided</Text>}
            <Text style={styles.label}>Safe checklist status</Text>
            {Array.isArray(packet.safeChecklist) && packet.safeChecklist.length
              ? packet.safeChecklist.map((item: any) => <Text key={`${item.label}-${item.status}`} style={styles.value}>• {item.label} [{item.status}]: {item.detail}</Text>)
              : <Text style={styles.value}>No checklist status provided</Text>}
          </>
        ) : <Text style={styles.helper}>No contractor packet intelligence attached to this lead.</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Lead actions</Text>
        <PrimaryButton title="Accept Lead" onPress={() => handleStatus('accepted')} />
        <PrimaryButton title="Decline Lead" onPress={() => handleStatus('declined')} />
        <PrimaryButton title="Mark Scheduled" onPress={() => handleStatus('scheduled')} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Internal contractor notes</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Add private note for this lead"
          value={noteBody}
          onChangeText={setNoteBody}
          multiline
        />
        <PrimaryButton title="Save Note" onPress={handleAddNote} />
        {notes.length === 0 ? <Text style={styles.helper}>No notes yet.</Text> : null}
        {notes.map((note) => (
          <View key={note.id} style={styles.noteRow}>
            <Text style={styles.value}>{note.note_body}</Text>
            <Text style={styles.helper}>{new Date(note.created_at).toLocaleString()}</Text>
          </View>
        ))}
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
  warning: { color: '#991B1B', fontWeight: '800', lineHeight: 21, marginTop: 3 },
  helper: { color: '#64748B', lineHeight: 20 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 12, marginBottom: 10, backgroundColor: '#FFFFFF' },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  noteRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' }
});
