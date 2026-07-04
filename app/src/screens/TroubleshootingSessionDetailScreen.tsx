import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import {
  TroubleshootingSessionRecord,
  archiveTroubleshootingSession,
  buildLeadPacketPreview,
  getTroubleshootingSession,
  updateTroubleshootingSessionControls
} from '../services/troubleshootingSessions';

export default function TroubleshootingSessionDetailScreen({ route, navigation }: any) {
  const sessionId = route.params?.sessionId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<TroubleshootingSessionRecord | null>(null);
  const [label, setLabel] = useState('');
  const [attachReport, setAttachReport] = useState(true);
  const [attachLead, setAttachLead] = useState(true);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  async function loadSession() {
    if (!sessionId) return;
    try {
      setLoading(true);
      const data = await getTroubleshootingSession(sessionId);
      setSession(data);
      setLabel(data.homeowner_label ?? '');
      setAttachReport(data.attach_to_contractor_report);
      setAttachLead(data.attach_to_lead_request);
    } catch (error: any) {
      Alert.alert('Could not load session', error?.message ?? 'Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  async function saveControls() {
    if (!session) return;
    try {
      setSaving(true);
      const updated = await updateTroubleshootingSessionControls(session.id, {
        attachToContractorReport: attachReport,
        attachToLeadRequest: attachLead,
        homeownerLabel: label
      });
      setSession(updated);
      Alert.alert('Controls saved', 'Troubleshooting handoff controls were updated.');
    } catch (error: any) {
      Alert.alert('Could not save controls', error?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function archiveSession() {
    if (!session) return;
    Alert.alert('Archive session?', 'Archived sessions are hidden from active report and lead attachment flows.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            await archiveTroubleshootingSession(session.id);
            Alert.alert('Session archived', 'This troubleshooting session was archived and removed from active handoffs.', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          } catch (error: any) {
            Alert.alert('Could not archive session', error?.message ?? 'Please try again.');
          }
        }
      }
    ]);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0B66E4" /></View>;
  if (!session) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Troubleshooting Session</Text>
      <Text style={styles.subtitle}>Control exactly how this saved troubleshooting result is used in contractor handoffs.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{session.workflow_title}</Text>
        <Text style={styles.badge}>{session.severity.toUpperCase()}</Text>
        <Text style={styles.body}>{session.result_summary ?? 'No summary saved.'}</Text>
        <Text style={styles.meta}>Created: {session.created_at ? new Date(session.created_at).toLocaleString() : 'Unknown'}</Text>
        {session.archived_at ? <Text style={styles.archived}>Archived: {new Date(session.archived_at).toLocaleString()}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Homeowner label</Text>
        <Text style={styles.helper}>Optional label for your own history, such as “July drain backup” or “noise before service.”</Text>
        <TextInput style={styles.input} value={label} onChangeText={setLabel} placeholder="Optional label" />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Attachment controls</Text>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>Attach to contractor report</Text>
            <Text style={styles.helper}>Shows in the contractor-ready system report.</Text>
          </View>
          <Switch value={attachReport} onValueChange={setAttachReport} />
        </View>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>Attach to lead requests</Text>
            <Text style={styles.helper}>Makes this session eligible for contractor lead packets.</Text>
          </View>
          <Switch value={attachLead} onValueChange={setAttachLead} />
        </View>
        <PrimaryButton title={saving ? 'Saving...' : 'Save Controls'} onPress={saveControls} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Lead packet preview</Text>
        <Text style={styles.preview}>{buildLeadPacketPreview(session)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Safe steps recorded</Text>
        {(session.safe_steps ?? []).map((step) => (
          <View key={`${step.title}-${step.detail}`} style={styles.stepCard}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.body}>{step.detail}</Text>
            {step.safetyNote ? <Text style={styles.warning}>{step.safetyNote}</Text> : null}
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Do-not-do warnings</Text>
        {(session.do_not_do ?? []).map((item) => <Text key={item} style={styles.warning}>• {item}</Text>)}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contractor notes</Text>
        {(session.contractor_report_notes ?? []).map((item) => <Text key={item} style={styles.body}>• {item}</Text>)}
      </View>

      {!session.archived_at ? <PrimaryButton title="Archive Session" onPress={archiveSession} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  container: { padding: 24, backgroundColor: '#F8FAFC', paddingBottom: 44 },
  title: { fontSize: 30, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  subtitle: { color: '#475569', fontSize: 16, lineHeight: 23, marginBottom: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#D8E2F0', padding: 16, marginBottom: 14 },
  sectionTitle: { color: '#0F2E5F', fontWeight: '900', fontSize: 18, marginBottom: 10 },
  badge: { alignSelf: 'flex-start', fontSize: 12, fontWeight: '900', color: '#334155', backgroundColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 8 },
  body: { color: '#334155', lineHeight: 22, marginBottom: 5 },
  meta: { color: '#64748B', fontSize: 12, marginTop: 6 },
  archived: { color: '#991B1B', fontSize: 12, fontWeight: '900', marginTop: 6 },
  helper: { color: '#64748B', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 13, fontSize: 16, backgroundColor: '#FFFFFF' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12, marginTop: 8 },
  switchTitle: { color: '#0F172A', fontWeight: '900', marginBottom: 4 },
  preview: { color: '#334155', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, lineHeight: 21 },
  stepCard: { backgroundColor: '#EFF6FF', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 8 },
  stepTitle: { color: '#0F2E5F', fontWeight: '900', marginBottom: 4 },
  warning: { color: '#991B1B', fontWeight: '800', lineHeight: 22, marginBottom: 4 }
});
