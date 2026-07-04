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
import { buildPhoneScript, buildStandardizedLeadPacket, performContactRoute } from '../services/contractorContactRouting';
import { buildVerifiedLeadRoutingDecisions, getDashboardRoutingSummary, getLeadDeliveryRoute } from '../services/verifiedLeadRouting';
import { ContractorSearchResult } from '../services/contractorDiscovery';
import {
  TroubleshootingLeadDefaults,
  TroubleshootingSessionRecord,
  buildLeadDefaultsFromTroubleshootingSession,
  buildLeadPacketPreview,
  buildTroubleshootingSnapshot,
  getRecommendedWorkflowIdForServiceType,
  getRecentTroubleshootingSessions,
  getTroubleshootingSession,
  markTroubleshootingSessionUsed
} from '../services/troubleshootingSessions';

const CONTACT_OPTIONS: { label: string; value: ContactPreference }[] = [
  { label: 'Phone', value: 'phone' },
  { label: 'Text', value: 'text' },
  { label: 'Email', value: 'email' },
  { label: 'In-app message', value: 'app_message' }
];

function contractorKey(contractor: SelectedContractor) {
  return contractor.id ?? contractor.contractorId ?? contractor.businessName;
}

function safe(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return 'Not provided';
  return String(value);
}

function searchResultToSelectedContractor(contractor?: ContractorSearchResult): SelectedContractor | null {
  if (!contractor) return null;
  return {
    ...contractor,
    id: contractor.contractorId ?? contractor.id,
    contractorId: contractor.contractorId ?? contractor.id,
    businessName: contractor.businessName,
    phone: contractor.phone,
    website: contractor.website,
    contactPageUrl: contractor.contactPageUrl,
    publishedEmail: contractor.publishedEmail,
    googlePlaceId: contractor.googlePlaceId,
    googleMapsUrl: contractor.googleMapsUrl,
    yelpBusinessUrl: contractor.yelpBusinessUrl,
    rating: contractor.rating,
    reviewCount: contractor.reviewCount,
    distanceMiles: contractor.distanceMiles,
    verified: contractor.verified,
    emergencyService: contractor.emergencyService,
    hvacTruthVerified: contractor.hvacTruthVerified,
    acceptsDashboardLeads: contractor.acceptsDashboardLeads,
    acceptsEmailLeads: contractor.acceptsEmailLeads,
    acceptsSmsLeads: contractor.acceptsSmsLeads
  };
}

function mergeUniqueSessions(sessions: TroubleshootingSessionRecord[], priority?: TroubleshootingSessionRecord | null) {
  const merged = priority ? [priority, ...sessions] : sessions;
  return merged.filter((session, index, list) => list.findIndex((item) => item.id === session.id) === index);
}

export default function ContractorLeadRequestScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const routedContractor = searchResultToSelectedContractor(route?.params?.selectedContractor);
  const routedLeadDefaults = route?.params?.leadDefaults as TroubleshootingLeadDefaults | undefined;
  const routedTroubleshootingSessionId = route?.params?.troubleshootingSessionId ?? routedLeadDefaults?.troubleshootingSessionId ?? null;
  const initialContractors = routedContractor ? [routedContractor] : DEMO_CONTRACTORS;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [system, setSystem] = useState<HvacSystemRecord | null>(null);
  const [reportSnapshot, setReportSnapshot] = useState<Record<string, unknown>>({});
  const [troubleshootingSessions, setTroubleshootingSessions] = useState<TroubleshootingSessionRecord[]>([]);
  const [selectedTroubleshootingId, setSelectedTroubleshootingId] = useState<string | null>(routedTroubleshootingSessionId);
  const [attachTroubleshooting, setAttachTroubleshooting] = useState(true);
  const [availableContractors, setAvailableContractors] = useState<SelectedContractor[]>(initialContractors);

  const [serviceType, setServiceType] = useState<LeadServiceType>(routedLeadDefaults?.serviceType ?? 'no_cooling');
  const [urgency, setUrgency] = useState<LeadUrgency>(routedLeadDefaults?.urgency ?? 'within_24_hours');
  const [symptomSummary, setSymptomSummary] = useState(routedLeadDefaults?.symptomSummary ?? 'AC is not cooling well. Homeowner wants a ballpark estimate before scheduling.');
  const [desiredOutcome, setDesiredOutcome] = useState(routedLeadDefaults?.desiredOutcome ?? 'Get a contractor ballpark estimate and schedule service if the number makes sense.');
  const [preferredTimeWindow, setPreferredTimeWindow] = useState('Weekday afternoon');
  const [contactPreference, setContactPreference] = useState<ContactPreference>('phone');
  const [homeownerName, setHomeownerName] = useState('');
  const [homeownerPhone, setHomeownerPhone] = useState('');
  const [homeownerEmail, setHomeownerEmail] = useState(user?.email ?? '');
  const [attachReport, setAttachReport] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(initialContractors.slice(0, routedContractor ? 1 : 2).map(contractorKey));

  useEffect(() => {
    loadDefaults();
  }, [user?.id, routedTroubleshootingSessionId]);

  useEffect(() => {
    const nextContractor = searchResultToSelectedContractor(route?.params?.selectedContractor);
    if (!nextContractor) return;
    setAvailableContractors([nextContractor]);
    setSelectedKeys([contractorKey(nextContractor)]);
  }, [route?.params?.selectedContractor?.contractorId, route?.params?.selectedContractor?.id]);

  useEffect(() => {
    if (routedLeadDefaults) applyLeadDefaults(routedLeadDefaults);
  }, [routedLeadDefaults?.sourceWorkflowId, routedLeadDefaults?.troubleshootingSessionId]);

  function applyLeadDefaults(defaults: TroubleshootingLeadDefaults) {
    setServiceType(defaults.serviceType);
    setUrgency(defaults.urgency);
    setSymptomSummary(defaults.symptomSummary);
    setDesiredOutcome(defaults.desiredOutcome);
    setAttachTroubleshooting(true);
    if (defaults.troubleshootingSessionId) setSelectedTroubleshootingId(defaults.troubleshootingSessionId);
  }

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

      const sessions = await getRecentTroubleshootingSessions(user.id, 8);
      let routedSession: TroubleshootingSessionRecord | null = null;
      if (routedTroubleshootingSessionId && !sessions.some((session) => session.id === routedTroubleshootingSessionId)) {
        routedSession = await getTroubleshootingSession(routedTroubleshootingSessionId);
      }

      const mergedSessions = mergeUniqueSessions(sessions, routedSession);
      const leadEligible = mergedSessions.find((session) => session.attach_to_lead_request);
      setTroubleshootingSessions(mergedSessions);
      setSelectedTroubleshootingId(routedTroubleshootingSessionId ?? leadEligible?.id ?? mergedSessions[0]?.id ?? null);
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
    () => availableContractors.filter((contractor) => selectedKeys.includes(contractorKey(contractor))),
    [availableContractors, selectedKeys]
  );

  const selectedTroubleshootingSession = useMemo(
    () => troubleshootingSessions.find((session) => session.id === selectedTroubleshootingId) ?? null,
    [troubleshootingSessions, selectedTroubleshootingId]
  );

  const recommendedWorkflowId = useMemo(() => getRecommendedWorkflowIdForServiceType(serviceType), [serviceType]);

  const routingDecisions = useMemo(
    () => buildVerifiedLeadRoutingDecisions(selectedContractors),
    [selectedContractors]
  );

  const routingSummary = useMemo(
    () => getDashboardRoutingSummary(routingDecisions),
    [routingDecisions]
  );

  const leadReportSnapshot = useMemo(() => ({
    ...reportSnapshot,
    troubleshooting: attachTroubleshooting ? buildTroubleshootingSnapshot(selectedTroubleshootingSession) : null
  }), [reportSnapshot, attachTroubleshooting, selectedTroubleshootingSession]);

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
    reportSnapshot: leadReportSnapshot
  }), [user?.id, system?.id, zipCode, serviceType, urgency, symptomSummary, desiredOutcome, contactPreference, preferredTimeWindow, homeownerName, homeownerPhone, homeownerEmail, attachReport, selectedContractors, leadReportSnapshot]);

  function useSelectedTroubleshootingAsDefaults() {
    if (!selectedTroubleshootingSession) return;
    applyLeadDefaults(buildLeadDefaultsFromTroubleshootingSession(selectedTroubleshootingSession));
  }

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
        reportSnapshot: attachReport ? leadReportSnapshot : {}
      });
      if (attachTroubleshooting && selectedTroubleshootingSession) {
        await markTroubleshootingSessionUsed(selectedTroubleshootingSession.id, 'lead');
      }
      Alert.alert('Request submitted', `${routingSummary.summary}\n\nTroubleshooting attached: ${attachTroubleshooting && selectedTroubleshootingSession ? 'Yes' : 'No'}\n\nLead status: ${request.lead_status}.`, [
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
    const route = getLeadDeliveryRoute(firstContractor);
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
      reportSnapshot: attachReport ? leadReportSnapshot : {}
    };
    const leadText = buildStandardizedLeadPacket(packet);
    const phoneScript = buildPhoneScript(packet);
    Alert.alert(
      `Best route: ${route.label}`,
      `${route.instructions}\n\nThis preview will open the available contact route or share sheet for the first selected contractor.`,
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
      <Text style={styles.subtitle}>Send a clean HVAC Truth request with your system details, data plate info, air handler location, troubleshooting result, and service need.</Text>

      {routedContractor ? (
        <View style={styles.sourceCard}>
          <Text style={styles.sourceTitle}>Started from contractor search</Text>
          <Text style={styles.routeHelper}>{routedContractor.businessName} is preselected from the search results. Contractor ID, verification flags, source IDs, and contact route data will carry into this lead request.</Text>
        </View>
      ) : null}

      {routedTroubleshootingSessionId ? (
        <View style={styles.troubleshootingSourceCard}>
          <Text style={styles.troubleshootingSourceTitle}>Started from troubleshooting</Text>
          <Text style={styles.routeHelper}>HVAC Truth preselected the saved troubleshooting session, attached it to this lead packet, and filled in the service type, urgency, issue summary, and desired contractor outcome.</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. What do you need?</Text>
        <OptionGrid options={SERVICE_TYPE_OPTIONS} selected={serviceType} onSelect={(value) => setServiceType(value as LeadServiceType)} />
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationTitle}>Recommended troubleshooting workflow</Text>
          <Text style={styles.routeHelper}>Based on this service type, HVAC Truth recommends workflow ID: {recommendedWorkflowId}</Text>
          <PrimaryButton title="Open Troubleshooting" onPress={() => navigation.navigate('Troubleshooting')} />
        </View>
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
            <Text style={styles.helper}>Includes age, size, model/serial numbers, air handler location, access notes, saved data plate status, and optional troubleshooting result.</Text>
          </View>
          <Switch value={attachReport} onValueChange={setAttachReport} />
        </View>
        <ReportMiniCard system={system} zipCode={zipCode} />
        <View style={styles.troubleshootingCard}>
          <Text style={styles.troubleshootingTitle}>Choose troubleshooting result</Text>
          <View style={styles.switchRowCompact}>
            <Text style={styles.helper}>Attach troubleshooting to this lead packet</Text>
            <Switch value={attachTroubleshooting} onValueChange={setAttachTroubleshooting} />
          </View>
          {!troubleshootingSessions.length ? <Text style={styles.helper}>No saved troubleshooting session available. Complete and save a workflow first to attach it here.</Text> : null}
          {troubleshootingSessions.map((session) => {
            const selected = selectedTroubleshootingId === session.id;
            return (
              <Pressable key={session.id} style={[styles.sessionCard, selected && styles.sessionCardSelected]} onPress={() => setSelectedTroubleshootingId(session.id)}>
                <Text style={styles.sessionTitle}>{session.homeowner_label || session.workflow_title}</Text>
                <Text style={styles.routeHelper}>{session.workflow_title} • {session.severity.toUpperCase()}</Text>
                <Text style={styles.routeHelper}>{session.result_summary ?? 'No summary saved'}</Text>
                <Text style={selected ? styles.selectedText : styles.unselectedText}>{selected ? 'Selected for packet' : 'Tap to select'}</Text>
                {selected ? <Pressable onPress={useSelectedTroubleshootingAsDefaults}><Text style={styles.manageLink}>Use this session to fill lead details</Text></Pressable> : null}
                <Pressable onPress={() => navigation.navigate('TroubleshootingSessionDetail', { sessionId: session.id })}>
                  <Text style={styles.manageLink}>Manage controls</Text>
                </Pressable>
              </Pressable>
            );
          })}
          <Text style={styles.preview}>{buildLeadPacketPreview(attachTroubleshooting ? selectedTroubleshootingSession : null)}</Text>
        </View>
        <PrimaryButton title="Review Full Report" onPress={() => navigation.navigate('ContractorReport')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Choose contractors</Text>
        <Text style={styles.helper}>{routedContractor ? 'Selected from contractor search. You can remove it before submitting if needed.' : 'MVP demo list. Use Find a Technician first to send a real persisted contractor record into this request.'}</Text>
        <View style={styles.routingSummaryCard}>
          <Text style={styles.routingSummaryTitle}>Verified routing preview</Text>
          <Text style={styles.routeHelper}>{routingSummary.summary}</Text>
        </View>
        {availableContractors.map((contractor) => {
          const selected = selectedKeys.includes(contractorKey(contractor));
          const decision = buildVerifiedLeadRoutingDecisions([contractor])[0];
          const route = decision.route;
          return (
            <Pressable key={contractorKey(contractor)} style={[styles.contractorCard, selected && styles.contractorCardSelected]} onPress={() => toggleContractor(contractor)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.contractorName}>{contractor.businessName}</Text>
                <Text style={styles.contractorMeta}>★ {contractor.rating ?? 'No rating'} ({contractor.reviewCount ?? 0} reviews) • {contractor.distanceMiles ?? '?'} mi</Text>
                <Text style={styles.badges}>{contractor.verified ? 'License/listing verified' : 'Listing not verified'} • {contractor.emergencyService ? 'Emergency service' : 'Standard hours'}</Text>
                {contractor.contractorId || contractor.id ? <Text style={styles.routeHelper}>Contractor ID: {(contractor.contractorId ?? contractor.id ?? '').slice(0, 8)}...</Text> : null}
                <Text style={decision.dashboardReady ? styles.dashboardRouteText : styles.routeText}>Best route: {route.label}</Text>
                <Text style={styles.routeHelper}>{decision.reason}</Text>
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
  sourceCard: { backgroundColor: '#ECFDF5', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#A7F3D0', marginBottom: 14 },
  sourceTitle: { color: '#14532D', fontWeight: '900', marginBottom: 5 },
  troubleshootingSourceCard: { backgroundColor: '#EFF6FF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 14 },
  troubleshootingSourceTitle: { color: '#0F2E5F', fontWeight: '900', marginBottom: 5 },
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
  switchRowCompact: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 10 },
  switchTitle: { color: '#0F2E5F', fontWeight: '900', fontSize: 16, marginBottom: 4 },
  reportCard: { backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 10 },
  troubleshootingCard: { backgroundColor: '#F0FDF4', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 10 },
  troubleshootingTitle: { color: '#14532D', fontWeight: '900', marginBottom: 4 },
  sessionCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#CBD5E1', padding: 12, marginTop: 8 },
  sessionCardSelected: { borderColor: '#15803D', backgroundColor: '#ECFDF5' },
  sessionTitle: { color: '#0F172A', fontWeight: '900', marginBottom: 4 },
  manageLink: { color: '#0B66E4', fontWeight: '900', marginTop: 6 },
  recommendationCard: { backgroundColor: '#FFFBEB', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#FDE68A', marginBottom: 10 },
  recommendationTitle: { color: '#92400E', fontWeight: '900', marginBottom: 4 },
  reportTitle: { color: '#0F2E5F', fontWeight: '900', marginBottom: 8 },
  reportLine: { color: '#334155', fontWeight: '700', marginBottom: 4 },
  routingSummaryCard: { backgroundColor: '#F0FDF4', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 10 },
  routingSummaryTitle: { color: '#14532D', fontWeight: '900', marginBottom: 4 },
  contractorCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginTop: 10 },
  contractorCardSelected: { borderColor: '#0B66E4', backgroundColor: '#EFF6FF' },
  contractorName: { color: '#0F2E5F', fontWeight: '900', fontSize: 16, marginBottom: 4 },
  contractorMeta: { color: '#334155', fontWeight: '700', marginBottom: 4 },
  badges: { color: '#0F766E', fontWeight: '800', fontSize: 13 },
  routeText: { marginTop: 8, fontSize: 12, fontWeight: '700', color: '#0B66E4' },
  dashboardRouteText: { marginTop: 8, fontSize: 12, fontWeight: '900', color: '#15803D' },
  routeHelper: { marginTop: 4, fontSize: 12, color: '#64748B', lineHeight: 16 },
  selectedText: { color: '#0B66E4', fontWeight: '900' },
  unselectedText: { color: '#64748B', fontWeight: '900' },
  preview: { color: '#334155', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, lineHeight: 21, fontFamily: undefined, marginTop: 8 },
  disclaimer: { marginTop: 12, color: '#64748B', fontSize: 14, lineHeight: 20 }
});