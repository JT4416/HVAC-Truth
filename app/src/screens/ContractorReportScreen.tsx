import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { AIR_HANDLER_LOCATION_OPTIONS } from '../domain/systemProfileTypes';
import { useAuth } from '../context/AuthContext';
import { getPrimarySystem, getProfile, HvacSystemRecord } from '../services/profilePersistence';
import { listSystemPhotos } from '../services/dataPlatePhotos';
import { TroubleshootingSessionRecord, buildTroubleshootingReportText, getLatestTroubleshootingSessionForReport } from '../services/troubleshootingSessions';

type SystemPhoto = {
  id: string;
  photo_type: string;
  signed_url?: string;
  storage_path?: string;
  created_at?: string;
};

function locationLabel(value?: string | null) {
  return AIR_HANDLER_LOCATION_OPTIONS.find((option) => option.value === value)?.label ?? 'Not provided';
}

function locationPricingNote(value?: string | null) {
  return AIR_HANDLER_LOCATION_OPTIONS.find((option) => option.value === value)?.pricingNote ?? 'Location is not known yet, so the contractor should confirm access before giving a firm number.';
}

function safe(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return 'Not provided';
  return String(value);
}

function generateReportText(system: HvacSystemRecord | null, zipCode: string, photos: SystemPhoto[], troubleshootingSession?: TroubleshootingSessionRecord | null) {
  if (!system) return 'No HVAC system profile has been saved yet.';

  const indoorPhoto = photos.find((photo) => photo.photo_type === 'indoor_data_plate');
  const outdoorPhoto = photos.find((photo) => photo.photo_type === 'outdoor_data_plate');

  return [
    'HVAC Truth Contractor-Ready System Report',
    '',
    `ZIP code: ${zipCode}`,
    `System type: ${safe(system.system_type)}`,
    `Brand: ${safe(system.brand)}`,
    `Estimated age: ${safe(system.estimated_age_years)} year(s)`,
    `Estimated size: ${safe(system.tonnage)} ton(s)`,
    `Refrigerant: ${safe(system.refrigerant_type)}`,
    `Filter size: ${safe(system.filter_size)}`,
    '',
    'Indoor / air handler access:',
    `Air handler location: ${locationLabel(system.air_handler_location)}`,
    `Location details: ${safe(system.air_handler_location_notes)}`,
    `Access notes: ${safe(system.access_notes)}`,
    `Pricing impact note: ${locationPricingNote(system.air_handler_location)}`,
    '',
    'Indoor unit:',
    `Indoor model: ${safe(system.indoor_model_number)}`,
    `Indoor serial: ${safe(system.indoor_serial_number)}`,
    `Indoor data plate photo: ${indoorPhoto ? 'Saved in homeowner profile' : 'Not uploaded'}`,
    '',
    'Outdoor unit:',
    `Outdoor model: ${safe(system.outdoor_model_number)}`,
    `Outdoor serial: ${safe(system.outdoor_serial_number)}`,
    `Outdoor data plate photo: ${outdoorPhoto ? 'Saved in homeowner profile' : 'Not uploaded'}`,
    '',
    'Decoder confidence:',
    `Confidence: ${safe(system.decoder_confidence)}`,
    `Manufacture year: ${safe(system.decoded_manufacture_year)}`,
    `Manufacture month: ${safe(system.decoded_manufacture_month)}`,
    '',
    'Latest troubleshooting session:',
    buildTroubleshootingReportText(troubleshootingSession),
    '',
    'Homeowner notes:',
    safe(system.notes),
    '',
    'Contractor estimate guidance:',
    '- Ballpark pricing may be possible from the information above.',
    '- Firm pricing should be confirmed after access, electrical, drain, ductwork, clearance, platform, and code conditions are inspected.',
    '- Air handler location is a major labor variable, especially for attic, crawlspace, roof, and tight closet work.'
  ].join('\n');
}

export default function ContractorReportScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [zipCode, setZipCode] = useState('Not provided');
  const [system, setSystem] = useState<HvacSystemRecord | null>(null);
  const [photos, setPhotos] = useState<SystemPhoto[]>([]);
  const [troubleshootingSession, setTroubleshootingSession] = useState<TroubleshootingSessionRecord | null>(null);

  useEffect(() => {
    loadReport();
  }, [user?.id]);

  async function loadReport() {
    if (!user?.id) return;
    try {
      setLoading(true);
      const profile = await getProfile(user.id);
      setZipCode(profile?.zip_code ?? 'Not provided');
      const savedSystem = await getPrimarySystem(user.id);
      setSystem(savedSystem);
      if (savedSystem?.id) {
        const [savedPhotos, latestTroubleshooting] = await Promise.all([
          listSystemPhotos(savedSystem.id),
          getLatestTroubleshootingSessionForReport(user.id, savedSystem.id)
        ]);
        setPhotos(savedPhotos as SystemPhoto[]);
        setTroubleshootingSession(latestTroubleshooting);
      } else {
        setTroubleshootingSession(await getLatestTroubleshootingSessionForReport(user.id));
      }
    } catch (error: any) {
      Alert.alert('Could not load report', error?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const reportText = useMemo(() => generateReportText(system, zipCode, photos, troubleshootingSession), [system, zipCode, photos, troubleshootingSession]);
  const indoorPhoto = photos.find((photo) => photo.photo_type === 'indoor_data_plate');
  const outdoorPhoto = photos.find((photo) => photo.photo_type === 'outdoor_data_plate');

  async function shareReport() {
    await Share.share({ message: reportText, title: 'HVAC Truth Contractor System Report' });
  }

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#0B66E4" /></View>;
  }

  if (!system) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.title}>Contractor Report</Text>
        <Text style={styles.subtitle}>Save your system profile first. Once equipment details, data plate photos, and air handler location are saved, this report can help a contractor give a better ballpark estimate.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Contractor Report</Text>
      <Text style={styles.subtitle}>A clean handoff that helps a contractor give a ballpark number before the visit and a firmer number once access is verified.</Text>

      <View style={styles.alertBox}>
        <Text style={styles.alertTitle}>Why air handler location matters</Text>
        <Text style={styles.alertText}>{locationPricingNote(system.air_handler_location)}</Text>
      </View>

      <ReportSection title="Home and system">
        <ReportRow label="ZIP code" value={zipCode} />
        <ReportRow label="System type" value={system.system_type} />
        <ReportRow label="Brand" value={system.brand} />
        <ReportRow label="Estimated age" value={system.estimated_age_years ? `${system.estimated_age_years} years` : null} />
        <ReportRow label="Estimated size" value={system.tonnage ? `${system.tonnage} tons` : null} />
        <ReportRow label="Refrigerant" value={system.refrigerant_type} />
        <ReportRow label="Filter size" value={system.filter_size} />
      </ReportSection>

      <ReportSection title="Indoor unit / air handler access">
        <ReportRow label="Air handler location" value={locationLabel(system.air_handler_location)} />
        <ReportRow label="Location details" value={system.air_handler_location_notes} />
        <ReportRow label="Access notes" value={system.access_notes} />
        <ReportRow label="Indoor model" value={system.indoor_model_number} />
        <ReportRow label="Indoor serial" value={system.indoor_serial_number} />
      </ReportSection>

      <ReportSection title="Outdoor unit">
        <ReportRow label="Outdoor model" value={system.outdoor_model_number} />
        <ReportRow label="Outdoor serial" value={system.outdoor_serial_number} />
      </ReportSection>

      <ReportSection title="Data plate photos">
        <Text style={styles.photoLabel}>Indoor data plate</Text>
        {indoorPhoto?.signed_url ? <Image source={{ uri: indoorPhoto.signed_url }} style={styles.photo} /> : <Text style={styles.missing}>No indoor photo saved.</Text>}
        <Text style={styles.photoLabel}>Outdoor data plate</Text>
        {outdoorPhoto?.signed_url ? <Image source={{ uri: outdoorPhoto.signed_url }} style={styles.photo} /> : <Text style={styles.missing}>No outdoor photo saved.</Text>}
      </ReportSection>

      <ReportSection title="Decoder confidence">
        <ReportRow label="Confidence" value={system.decoder_confidence} />
        <ReportRow label="Manufacture year" value={system.decoded_manufacture_year} />
        <ReportRow label="Manufacture month" value={system.decoded_manufacture_month} />
      </ReportSection>

      <ReportSection title="Latest troubleshooting session">
        {troubleshootingSession ? (
          <>
            <ReportRow label="Workflow" value={troubleshootingSession.workflow_title} />
            <ReportRow label="Severity" value={troubleshootingSession.severity} />
            <Text style={styles.bodyText}>{safe(troubleshootingSession.result_summary)}</Text>
            <Text style={styles.photoLabel}>Technician script</Text>
            <Text style={styles.bodyText}>{safe(troubleshootingSession.homeowner_script)}</Text>
          </>
        ) : <Text style={styles.missing}>No saved troubleshooting session attached.</Text>}
      </ReportSection>

      <ReportSection title="Homeowner notes">
        <Text style={styles.bodyText}>{safe(system.notes)}</Text>
      </ReportSection>

      <PrimaryButton title="Share Report" onPress={shareReport} />
      <PrimaryButton title="Request Contractor Help" onPress={() => (navigation as any)?.navigate?.('ContractorLeadRequest')} />
      <Text style={styles.disclaimer}>Ballpark estimates are not final quotes. Contractors still need to verify access, ductwork, drain, electrical, platform, code, and equipment conditions on site.</Text>
    </ScrollView>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ReportRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{safe(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  emptyContainer: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F8FAFC' },
  container: { padding: 24, backgroundColor: '#F8FAFC' },
  title: { fontSize: 30, fontWeight: '900', color: '#0F2E5F', marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 23, color: '#475569', marginBottom: 16 },
  alertBox: { backgroundColor: '#FFF7ED', borderColor: '#FDBA74', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 },
  alertTitle: { color: '#C2410C', fontWeight: '900', fontSize: 16, marginBottom: 6 },
  alertText: { color: '#334155', fontSize: 15, lineHeight: 22 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#D8E2F0', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0F2E5F', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 9 },
  rowLabel: { flex: 1, color: '#64748B', fontWeight: '800' },
  rowValue: { flex: 1.3, color: '#0F172A', fontWeight: '700', textAlign: 'right' },
  photoLabel: { color: '#0F2E5F', fontWeight: '900', marginBottom: 8, marginTop: 4 },
  photo: { height: 180, borderRadius: 14, marginBottom: 14, backgroundColor: '#E2E8F0' },
  missing: { color: '#64748B', fontWeight: '700', marginBottom: 14 },
  bodyText: { color: '#334155', fontSize: 15, lineHeight: 22 },
  disclaimer: { marginTop: 12, color: '#64748B', fontSize: 14, lineHeight: 20 }
});
