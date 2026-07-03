import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import {
  ContactPreference,
  DEMO_CONTRACTORS,
  LeadServiceType,
  LeadUrgency,
  SERVICE_TYPE_OPTIONS,
  SelectedContractor,
  URGENCY_OPTIONS,
  buildLeadSummary,
  loadLeadFlowDefaults,
  submitContractorLeadRequest
} from '../services/contractorLeadFlow';
import { HvacSystemRecord } from '../services/profilePersistence';
import { buildPhoneScript, buildStandardizedLeadPacket, detectContractorContactRoute, performContactRoute } from '../services/contractorContactRouting';

const CONTACT_OPTIONS: { label: string; value: ContactPreference }[] = [
  { label: 'Phone', value: 'phone' },
  { label: 'Text', value: 'text' },
  { label: 'Email', value: 'email' },
  { label: 'In-app message', value: 'app_message' }
];

function contractorKey(contractor: SelectedContractor) {
  return contractor.id ?? contractor.businessName;
}

function safe(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return 'Not provided';
  return String(value);
}

export default function ContractorLeadRequestScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [system, setSystem] = useState<HvacSystemRecord | null>(null);
  const [reportSnapshot, setReportSnapshot] = useState<Record<string, unknown>>({});

  const [serviceType, setServiceType] = useState<LeadServiceType>('no_cooling');
  const [urgency, setUrgency] = useState<LeadUrgency>('within_24_hours');
  const [symptomSummary, setSymptomSummary] = useState('AC is not cooling well. Homeowner wants a ballpark estimate before scheduling.');
  const [desiredOutcome, setDesiredOutcome] = useState('Get a contractor ballpark estimate and schedule service if the number makes sense.');
  const [preferredTimeWindow, setPreferredTimeWindow] = useState('Weekday afternoon');
  const [contactPreference, setContactPreference] = useState<ContactPreference>('phone');
  const [homeownerName, setHomeownerName] = useState('');
  const [homeownerPhone, setHomeownerPhone] = useState('');
  const [homeownerEmail, setHomeownerEmail] = useState(user?.email ?? '');
  const [attachReport, setAttachReport] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(DEMO_CONTRACTORS.slice(0, 2).map(contractorKey));

  useEffect(() => {
    loadDefaults();
  }, [user?.id]);

  async function loadDefaults() {
    if (!user?.id) return;
    try {
      setLoading(true);
      const defaults = await loadLeadFlowDefaults(user.id);
      setZipCode(defaults.zipCode);
      setSystem(defaults.system);
      setReportSnapshot(defaults.reportSnapshot);
      setHomeownerEmail(defaults.profile?.email ?? user.email ?? '');
      setHomeownerName(defaults.profile?.full_name ?? '');
    } catch (error: any) {
      Alert.alert('Could not load lead request', error?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function toggleContractor(contractor: SelectedContractor) {
    const key = contractorKey(contractor);
    setSelectedKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  const selectedContractors = useMemo(
    () => DEMO_CONTRACTORS.filter((contractor) => selectedKeys.includes(contractorKey(contractor))),
    [selectedKeys]
  );

  const leadPreview = useMemo(() => buildLeadSummary({
    userId: user?.id ?? '',
    hvacSystemId: system?.id,
    zipCode,
    serviceType,
    urgency,
    symptomSummary,
    desiredOutcome,
    contactPreference,
    preferredTimeWindow,
    homeownerName,
    homeownerPhone,
    homeownerEmail,
    attachContractorReport: attachReport,
    selectedContractors,
    reportSnapshot
  }), [user?.id, system?.id, zipCode, serviceType, urgency, symptomSummary, desiredOutcome, contactPreference, preferredTimeWindow, homeownerName, homeownerPhone, homeownerEmail, attachReport, selectedContractors, reportSnapshot]);

  async function submitRequest() {
    if (!user?.id) return;
    if (!zipCode.trim()) {
      Alert.alert('ZIP code required', 'Add a ZIP code so contractors know the service area.');
      return;
    }
    if (!selectedContractors.length) {
      Alert.alert('Select at least one contractor', 'Choose one or more contractors to receive the request.');
      return;
    }
    if (!symptomSummary.trim()) {
      Alert.alert('Issue summary required', 'Add a short summary of what is happening.');
      return;
    }

    try {
      setSubmitting(true);
      const request = await submitContractorLeadRequest({
        userId: user.id,
        hvacSystemId: system?.id,
        zipCode,
        serviceType,
        urgency,
        symptomSummary,
        desiredOutcome,
        contactPreference,
        preferredTimeWindow,
        homeownerName,
        homeownerPhone,
        homeownerEmail,
        attachContractorReport: attachReport,
        selectedContractors,
        reportSnapshot: attachReport ? reportSnapshot : {}
      });
      Alert.alert('Request submitted', `Your request was created with status: ${request.lead_status}.`, [
        { text: 'Back Home', onPress: () => navigation.navigate('Home') },
        { text: 'OK' }
      ]);
    } catch (error: any) {
      Alert.alert('Could not submit request', error?.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }


  async function previewContactRouting() {
    const firstContractor = selectedContractors[0];
    if (!firstContractor) {
      Alert.alert('Select a contractor', 'Choose at least one contractor to preview routing.');
      return;
    }
    const serviceLabel = SERVICE_TYPE_OPTIONS.find((option) => option.value === serviceType)?.label ?? serviceType;
    const route = detectContractorContactRoute(firstContractor);
    const packet = {
      serviceTypeLabel: serviceLabel,
      urgency,
      zipCode,
      homeownerName,
      homeownerPhone,
      homeownerEmail,
      contactPreference,
      preferredTimeWindow,
      symptomSummary,
      desiredOutcome,
      reportSnapshot: attachReport ? reportSnapshot : {}
    };
    const leadText = buildStandardizedLeadPacket(packet);
    const phoneScript = buildPhoneScript(packet);
    Alert.alert(
      `Best route: ${route.label}`,
      `${route.instructions}

This preview will open the available contact route or share sheet for the first selected contractor.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Preview', onPress: async () => performContactRoute(route, leadText, phoneScript) }
      ]
    );
  }

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#0B66E4" /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Request Contractor Help</Text>
      <Text style={styles.subtitle}>Send a clean HVAC Truth request with your system details, data plate info, air handler location, and service need.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. What do you need?</Text>
        <OptionGrid options={SERVICE_TYPE_OPTIONS} selected={serviceType} onSelect={(value) => setServiceType(value as LeadServiceType)} />
        <Text style={styles.label}>What is happening?</Text>
        <TextInput style={[styles.input, styles.textArea]} multiline value={symptomSummary} onChangeText={setSymptomSummary} />
        <Text style={styles.label}>What outcome do you want?</Text>
        <TextInput style={[styles.input, styles.textArea]} multiline value={desiredOutcome} onChangeText={setDesiredOutcome} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Urgency and contact</Text>
        <OptionGrid options={URGENCY_OPTIONS} selected={urgency} onSelect={(value) => setUrgency(value as LeadUrgency)} />
        <Text style={styles.label}>Preferred time window</Text>
        <TextInput style={styles.input} value={preferredTimeWindow} onChangeText={setPreferredTimeWindow} placeholder="Example: Today after 3 PM" />
        <Text style={styles.label}>Preferred contact method</Text>
        <OptionGrid options={CONTACT_OPTIONS} selected={contactPreference} onSelect={(value) => setContactPreference(value as ContactPreference)} />
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={homeownerName} onChangeText={setHomeownerName} placeholder="Homeowner name" />
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={homeownerPhone} onChangeText={setHomeownerPhone} placeholder="Phone number" keyboardType="phone-pad" />
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={homeownerEmail} onChangeText={setHomeownerEmail} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Attach system report</Text>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>Include Contractor Report</Text>
            <Text style={styles.helper}>Includes age, size, model/serial numbers, air handler location, access notes, and saved data plate status.</Text>
          </View>
          <Switch value={attachReport} onValueChange={setAttachReport} />
        </View>
        <ReportMiniCard system={system} zipCode={zipCode} />
        <PrimaryButton title="Review Full Report" onPress={() => navigation.navigate('ContractorReport')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Choose contractors</Text>
        <Text style={styles.helper}>MVP demo list. Later this will pull live contractors by ZIP code, license status, review quality, service radius, and response history.</Text>
        {DEMO_CONTRACTORS.map((contractor) => {
          const selected = selectedKeys.includes(contractorKey(contractor));
          const route = detectContractorContactRoute(contractor);
          return (
            <Pressable key={contractorKey(contractor)} style={[styles.contractorCard, selected && styles.contractorCardSelected]} onPress={() => toggleContractor(contractor)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.contractorName}>{contractor.businessName}</Text>
                <Text style={styles.contractorMeta}>★ {contractor.rating} ({contractor.reviewCount} reviews) • {contractor.distanceMiles} mi</Text>
                <Text style={styles.badges}>{contractor.verified ? 'License verified' : 'License not verified'} • {contractor.emergencyService ? 'Emergency service' : 'Standard hours'}</Text>
                <Text style={styles.routeText}>Best route: {route.label}</Text>
                <Text style={styles.routeHelper}>{route.instructions}</Text>
              </View>
              <Text style={selected ? styles.selectedText : styles.unselectedText}>{selected ? 'Selected' : 'Select'}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Preview</Text>
        <Text style={styles.preview}>{leadPreview}</Text>
      </View>

      <PrimaryButton title={submitting ? 'Submitting...' : 'Submit Lead Request'} onPress={submitRequest} />
      <PrimaryButton title="Preview Contact Routing" onPress={previewContactRouting} />
      <Text style={styles.disclaimer}>Submitting a request does not create a final price. Contractors still need to verify access, electrical, drain, ductwork, code, and equipment conditions before giving a firm quote.</Text>
    </ScrollView>
  );
}

function OptionGrid({ options, selected, onSelect }: { options: { label: string; value: string; note?: string; contractorContext?: string }[]; selected: string; onSelect: (value: string) => void }) {
  return (
    <View style={styles.optionWrap}>
      {options.map((option) => (
        <Pressable key={option.value} style={[styles.option, selected === option.value && styles.optionSelected]} onPress={() => onSelect(option.value)}>
          <Text style={[styles.optionText, selected === option.value && styles.optionTextSelected]}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ReportMiniCard({ system, zipCode }: { system: HvacSystemRecord | null; zipCode: string }) {
  return (
    <View style={styles.reportCard}>
      <Text style={styles.reportTitle}>Attached report snapshot</Text>
      <Text style={styles.reportLine}>ZIP: {zipCode || 'Not provided'}</Text>
      <Text style={styles.reportLine}>System: {safe(system?.system_type)} • {safe(system?.brand)}</Text>
      <Text style={styles.reportLine}>Age/size: {safe(system?.estimated_age_years)} years • {safe(system?.tonnage)} tons</Text>
      <Text style={styles.reportLine}>Air handler: {safe(system?.air_handler_location)}</Text>
      <Text style={styles.reportLine}>Access notes: {safe(system?.access_notes)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  container: { padding: 24, backgroundColor: '#F8FAFC' },
  title: { fontSize: 30, fontWeight: '900', color: '#0F2E5F', marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 23, color: '#475569', marginBottom: 16 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#D8E2F0', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0F2E5F', marginBottom: 12 },
  label: { color: '#0F2E5F', fontWeight: '900', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 13, fontSize: 16, backgroundColor: '#FFFFFF' },
  textArea: { minHeight: 92, textAlignVertical: 'top' },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  option: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 999, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: '#FFFFFF' },
  optionSelected: { backgroundColor: '#0B66E4', borderColor: '#0B66E4' },
  optionText: { color: '#334155', fontWeight: '800' },
  optionTextSelected: { color: '#FFFFFF' },
  helper: { color: '#64748B', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  switchTitle: { color: '#0F2E5F', fontWeight: '900', fontSize: 16, marginBottom: 4 },
  reportCard: { backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 6 },
  reportTitle: { color: '#0F2E5F', fontWeight: '900', marginBottom: 8 },
  reportLine: { color: '#334155', fontWeight: '700', marginBottom: 4 },
  contractorCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginTop: 10 },
  contractorCardSelected: { borderColor: '#0B66E4', backgroundColor: '#EFF6FF' },
  contractorName: { color: '#0F2E5F', fontWeight: '900', fontSize: 16, marginBottom: 4 },
  contractorMeta: { color: '#334155', fontWeight: '700', marginBottom: 4 },
  badges: { color: '#0F766E', fontWeight: '800', fontSize: 13 },
  routeText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#0B66E4'
  },
  routeHelper: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16
  },
  selectedText: { color: '#0B66E4', fontWeight: '900' },
  unselectedText: { color: '#64748B', fontWeight: '900' },
  preview: { color: '#334155', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, lineHeight: 21, fontFamily: undefined },
  disclaimer: { marginTop: 12, color: '#64748B', fontSize: 14, lineHeight: 20 }
});
