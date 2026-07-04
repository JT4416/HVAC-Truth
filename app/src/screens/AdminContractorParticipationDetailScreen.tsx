import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import {
  AdminParticipationStatus,
  ContractorParticipationAdminRecord,
  buildAdminParticipationSummary,
  getParticipationContractor,
  updateContractorParticipation
} from '../services/contractorParticipationAdmin';

const statusOptions: AdminParticipationStatus[] = ['active', 'inactive', 'paused', 'suspended'];

function formatStatusLabel(status: string) {
  return status.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function parseCapacity(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed;
}

function parseZipCodes(value: string) {
  return value
    .split(',')
    .map((zip) => zip.trim())
    .filter(Boolean);
}

export default function AdminContractorParticipationDetailScreen({ route, navigation }: any) {
  const contractorId = route.params?.contractorId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contractor, setContractor] = useState<ContractorParticipationAdminRecord | null>(null);
  const [status, setStatus] = useState<AdminParticipationStatus>('inactive');
  const [pauseReason, setPauseReason] = useState('');
  const [zipCodes, setZipCodes] = useState('');
  const [emergencyService, setEmergencyService] = useState(false);
  const [dailyLimit, setDailyLimit] = useState('');
  const [weeklyLimit, setWeeklyLimit] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadContractor();
  }, [contractorId]);

  async function loadContractor() {
    setLoading(true);
    setErrorMessage('');
    const { data, error } = await getParticipationContractor(contractorId);
    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data) {
      setContractor(data);
      const storedStatus = data.hvac_truth_participation_status;
      setStatus(storedStatus === 'active' || storedStatus === 'paused' || storedStatus === 'suspended' || storedStatus === 'inactive'
        ? storedStatus
        : data.accepts_dashboard_leads ? 'active' : 'inactive');
      setPauseReason(data.participation_pause_reason || '');
      setZipCodes((data.service_zip_codes || data.serviceZipCodes || []).join(', '));
      setEmergencyService(Boolean(data.emergency_service || data.emergencyService));
      setDailyLimit(data.max_daily_dashboard_leads == null ? '' : String(data.max_daily_dashboard_leads));
      setWeeklyLimit(data.max_weekly_dashboard_leads == null ? '' : String(data.max_weekly_dashboard_leads));
    }
  }

  async function saveParticipation() {
    if (!contractorId) return;
    setSaving(true);
    setMessage('');
    setErrorMessage('');

    const { data, error } = await updateContractorParticipation({
      contractorId,
      participationStatus: status,
      paused: status === 'paused',
      pauseReason: status === 'paused' ? pauseReason : '',
      serviceZipCodes: parseZipCodes(zipCodes),
      emergencyService,
      maxDailyDashboardLeads: parseCapacity(dailyLimit),
      maxWeeklyDashboardLeads: parseCapacity(weeklyLimit)
    });

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setContractor(data);
    setMessage('Participation controls saved.');
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0F172A" /></View>;

  if (!contractor) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Participation Detail</Text>
        <Text style={styles.error}>{errorMessage || 'Contractor was not found.'}</Text>
      </ScrollView>
    );
  }

  const summary = buildAdminParticipationSummary({
    ...contractor,
    hvac_truth_participation_status: status,
    accepts_dashboard_leads: status === 'active',
    acceptsDashboardLeads: status === 'active',
    participation_paused: status === 'paused',
    participationPaused: status === 'paused',
    participation_pause_reason: pauseReason,
    service_zip_codes: parseZipCodes(zipCodes),
    serviceZipCodes: parseZipCodes(zipCodes),
    emergency_service: emergencyService,
    emergencyService,
    max_daily_dashboard_leads: parseCapacity(dailyLimit),
    max_weekly_dashboard_leads: parseCapacity(weeklyLimit),
    maxDailyLeads: parseCapacity(dailyLimit) ?? undefined,
    maxWeeklyLeads: parseCapacity(weeklyLimit) ?? undefined
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Participation Detail</Text>
      <Text style={styles.subtitle}>{contractor.business_name || contractor.businessName || 'Verified contractor'}</Text>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Current routing visibility</Text>
        <Text style={styles.status}>{summary.label}</Text>
        <Text style={styles.helper}>{summary.reason}</Text>
        {summary.operationalLimits.map((limit) => <Text key={limit} style={styles.helper}>• {limit}</Text>)}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Participation status</Text>
        <Text style={styles.helper}>Active contractors receive all eligible HVAC Truth lead types inside their operating limits. Inactive, paused, and suspended contractors do not receive verified dashboard routing.</Text>
        <View style={styles.statusGrid}>
          {statusOptions.map((option) => (
            <Pressable key={option} style={[styles.statusButton, status === option && styles.statusButtonSelected]} onPress={() => setStatus(option)}>
              <Text style={[styles.statusButtonText, status === option && styles.statusButtonTextSelected]}>{formatStatusLabel(option)}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pause reason</Text>
        <TextInput
          style={styles.input}
          value={pauseReason}
          onChangeText={setPauseReason}
          placeholder="Example: Vacation, staffing limit, temporary service pause"
          multiline
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Operating limits</Text>
        <Text style={styles.label}>Service ZIP codes</Text>
        <TextInput style={styles.input} value={zipCodes} onChangeText={setZipCodes} placeholder="33410, 33418, 34957" />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Emergency availability</Text>
            <Text style={styles.helper}>Controls emergency visibility, not lead-category cherry-picking.</Text>
          </View>
          <Switch value={emergencyService} onValueChange={setEmergencyService} />
        </View>

        <Text style={styles.label}>Daily dashboard lead limit</Text>
        <TextInput style={styles.input} value={dailyLimit} onChangeText={setDailyLimit} placeholder="Blank means no app cap" keyboardType="number-pad" />

        <Text style={styles.label}>Weekly dashboard lead limit</Text>
        <TextInput style={styles.input} value={weeklyLimit} onChangeText={setWeeklyLimit} placeholder="Blank means no app cap" keyboardType="number-pad" />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Locked standard</Text>
        <Text style={styles.helper}>This editor intentionally does not include lead category preferences. Packet score, no-cooling calls, leaks, quote checks, maintenance requests, and replacement estimates remain eligible lead types for active verified contractors.</Text>
      </View>

      <PrimaryButton title={saving ? 'Saving...' : 'Save Participation Controls'} onPress={saveParticipation} />
      <PrimaryButton title="Back to Participation List" onPress={() => navigation.navigate('AdminContractorParticipation')} />
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
  label: { color: '#0F172A', fontWeight: '800', marginTop: 12, marginBottom: 6 },
  status: { color: '#0F172A', fontWeight: '900', marginBottom: 4 },
  error: { color: '#B91C1C', marginBottom: 12, fontWeight: '700' },
  success: { color: '#166534', marginBottom: 12, fontWeight: '800' },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 12, color: '#0F172A', backgroundColor: '#FFFFFF', minHeight: 46 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  statusButton: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14, marginRight: 8, marginBottom: 8 },
  statusButtonSelected: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  statusButtonText: { color: '#0F172A', fontWeight: '800' },
  statusButtonTextSelected: { color: 'white' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }
});
