import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import PrimaryButton from '../components/PrimaryButton';
import { decodeSystem } from '../domain/decoder/systemDecoder';
import { DecoderResult, EquipmentSide, EquipmentType } from '../domain/decoder/systemDecoderTypes';
import { DataPlateExtraction } from '../domain/decoder/dataPlateExtraction';
import { useAuth } from '../context/AuthContext';
import { getProfile, getPrimarySystem, saveDecodeResult, saveSystemProfile } from '../services/profilePersistence';
import { uploadDataPlatePhoto } from '../services/dataPlatePhotos';
import { extractDataPlateFromPhoto, extractDataPlateFromPastedText } from '../services/dataPlateOcr';

const EQUIPMENT_TYPES: { label: string; value: EquipmentType }[] = [
  { label: 'Unknown', value: 'unknown' },
  { label: 'Central AC', value: 'central_ac' },
  { label: 'Heat Pump', value: 'heat_pump' },
  { label: 'Air Handler', value: 'air_handler' },
  { label: 'Furnace', value: 'furnace' },
  { label: 'Evaporator Coil', value: 'evaporator_coil' },
  { label: 'Package Unit', value: 'package_unit' },
  { label: 'Mini Split', value: 'mini_split' }
];

const EQUIPMENT_SIDES: { label: string; value: EquipmentSide }[] = [
  { label: 'Outdoor Unit', value: 'outdoor' },
  { label: 'Indoor Unit', value: 'indoor' },
  { label: 'Not Sure', value: 'unknown' }
];

export default function SystemDecoderScreen({ navigation }: any) {
  const { user } = useAuth();
  const [brand, setBrand] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('unknown');
  const [equipmentSide, setEquipmentSide] = useState<EquipmentSide>('outdoor');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [pastedText, setPastedText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [extraction, setExtraction] = useState<DataPlateExtraction | undefined>();
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<DecoderResult | undefined>();

  const canDecode = useMemo(() => Boolean(modelNumber.trim() || serialNumber.trim()), [modelNumber, serialNumber]);

  async function captureDataPlate() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'HVAC Truth needs camera access so you can capture the data plate.');
      return;
    }

    const capture = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.85, exif: false });
    if (capture.canceled || !capture.assets?.[0]?.uri) return;

    setPhotoUri(capture.assets[0].uri);
    setExtraction(undefined);
    setResult(undefined);
  }

  async function runPhotoOcr() {
    if (!photoUri) {
      Alert.alert('Take a photo first', 'Capture the visible data plate before running OCR.');
      return;
    }

    try {
      setOcrLoading(true);
      const extracted = await extractDataPlateFromPhoto({ imageUri: photoUri, homeownerHint: `Equipment side: ${equipmentSide}` });
      applyExtraction(extracted);
    } catch (error: any) {
      Alert.alert('OCR is not ready yet', error?.message ?? 'The app could not read the photo. You can still type the model and serial number manually.');
    } finally {
      setOcrLoading(false);
    }
  }

  function runPastedTextExtraction() {
    if (!pastedText.trim()) {
      Alert.alert('Paste or type label text first', 'Enter the visible text from the data plate before extracting model and serial candidates.');
      return;
    }
    const extracted = extractDataPlateFromPastedText(pastedText);
    applyExtraction(extracted);
  }

  function applyExtraction(extracted: DataPlateExtraction) {
    setExtraction(extracted);
    if (extracted.brand.value) setBrand(extracted.brand.value);
    if (extracted.modelNumber.value) setModelNumber(extracted.modelNumber.value);
    if (extracted.serialNumber.value) setSerialNumber(extracted.serialNumber.value);
    if (extracted.equipmentType.value) setEquipmentType(extracted.equipmentType.value);
    setResult(undefined);
  }

  function runDecoder() {
    const decoded = decodeSystem({ brand, modelNumber, serialNumber, equipmentType, equipmentSide });
    setResult(decoded);
  }

  async function saveToSystemProfile() {
    if (!user?.id || !result) return;

    try {
      setSaving(true);
      const profile = await getProfile(user.id);
      const fallbackZip = profile?.zip_code ?? '00000';
      let system = await getPrimarySystem(user.id);

      if (!system) {
        system = await saveSystemProfile(user.id, {
          systemType: equipmentType === 'unknown' ? 'Unknown HVAC System' : equipmentType,
          brand,
          indoorModelNumber: equipmentSide === 'indoor' ? modelNumber : undefined,
          indoorSerialNumber: equipmentSide === 'indoor' ? serialNumber : undefined,
          outdoorModelNumber: equipmentSide !== 'indoor' ? modelNumber : undefined,
          outdoorSerialNumber: equipmentSide !== 'indoor' ? serialNumber : undefined,
          estimatedAgeYears: result.age?.estimatedAgeYears,
          tonnage: result.capacity?.tons,
          refrigerantType: extraction?.refrigerantType.value,
          dataPlatePhotos: []
        }, fallbackZip);
      }

      let photoRecordId: string | undefined;
      if (photoUri) {
        const side = equipmentSide === 'indoor' ? 'indoor' : 'outdoor';
        const uploaded = await uploadDataPlatePhoto({
          userId: user.id,
          hvacSystemId: system.id,
          side,
          uri: photoUri,
          ocrText: extraction?.rawText,
          ocrExtraction: extraction
        });
        photoRecordId = uploaded.record.id;
      }

      await saveDecodeResult({
        userId: user.id,
        hvacSystemId: system.id,
        photoId: photoRecordId,
        inputBrand: brand,
        inputModelNumber: modelNumber,
        inputSerialNumber: serialNumber,
        equipmentType,
        result,
        extraction,
        equipmentSide,
        copyToSystemProfile: true
      });

      Alert.alert('Saved to My System', 'The confirmed model, serial, data plate photo, OCR text, and decoder result were saved to the homeowner profile.');
    } catch (error: any) {
      Alert.alert('Could not save decoder result', error?.message ?? 'Please check Supabase setup and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Decode My System</Text>
      <Text style={styles.subtitle}>Take a data plate photo or type the label information. HVAC Truth will pull out the model and serial number, then estimate system age and size.</Text>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>New in V6: Data Plate OCR</Text>
        <Text style={styles.noticeText}>Photo OCR reads visible label text, suggests model and serial numbers, and asks the homeowner to confirm before anything is saved or decoded.</Text>
      </View>

      <Text style={styles.fieldLabel}>Which unit are you looking at?</Text>
      <View style={styles.chipWrap}>
        {EQUIPMENT_SIDES.map((item) => (
          <TouchableOpacity key={item.value} style={[styles.chip, equipmentSide === item.value && styles.chipActive]} onPress={() => setEquipmentSide(item.value)}>
            <Text style={[styles.chipText, equipmentSide === item.value && styles.chipTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <PrimaryButton title={photoUri ? 'Retake Data Plate Photo' : 'Take Data Plate Photo'} onPress={captureDataPlate} />
      {photoUri ? <Text style={styles.photoSaved}>Photo captured. Run OCR below, then confirm the fields.</Text> : null}
      {photoUri ? (ocrLoading ? <ActivityIndicator size="large" color="#0B66E4" /> : <PrimaryButton title="Read Data Plate Photo" onPress={runPhotoOcr} />) : null}

      <Text style={styles.sectionTitle}>Or paste/type visible label text</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Paste OCR text or type what you can read from the data plate"
        value={pastedText}
        onChangeText={setPastedText}
        multiline
      />
      <PrimaryButton title="Extract From Typed Label Text" onPress={runPastedTextExtraction} />

      {extraction ? <ExtractionReview extraction={extraction} setBrand={setBrand} setModelNumber={setModelNumber} setSerialNumber={setSerialNumber} /> : null}

      <Text style={styles.sectionTitle}>Confirm before decoding</Text>
      <TextInput style={styles.input} placeholder="Brand, e.g. Goodman, Carrier, Trane" value={brand} onChangeText={setBrand} autoCapitalize="words" />
      <TextInput style={styles.input} placeholder="Model number" value={modelNumber} onChangeText={setModelNumber} autoCapitalize="characters" />
      <TextInput style={styles.input} placeholder="Serial number" value={serialNumber} onChangeText={setSerialNumber} autoCapitalize="characters" />

      <Text style={styles.fieldLabel}>Equipment type</Text>
      <View style={styles.chipWrap}>
        {EQUIPMENT_TYPES.map((item) => (
          <TouchableOpacity key={item.value} style={[styles.chip, equipmentType === item.value && styles.chipActive]} onPress={() => setEquipmentType(item.value)}>
            <Text style={[styles.chipText, equipmentType === item.value && styles.chipTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <PrimaryButton title="Decode Age & Size" onPress={runDecoder} />
      {!canDecode ? <Text style={styles.helperText}>Enter at least a model number or serial number before decoding.</Text> : null}

      {result ? <DecoderResultCard result={result} onSave={saveToSystemProfile} navigation={navigation} saving={saving} /> : null}

      <View style={styles.safeBox}>
        <Text style={styles.safeTitle}>Safety reminder</Text>
        <Text style={styles.safeText}>Only photograph labels that are already visible. Do not remove panels, open electrical compartments, reach into equipment, or touch wiring.</Text>
      </View>
    </ScrollView>
  );
}

function ExtractionReview({ extraction, setBrand, setModelNumber, setSerialNumber }: { extraction: DataPlateExtraction; setBrand: (value: string) => void; setModelNumber: (value: string) => void; setSerialNumber: (value: string) => void }) {
  return (
    <View style={styles.extractionCard}>
      <Text style={styles.resultTitle}>Review OCR Suggestions</Text>
      <Text style={styles.summary}>Confirm these values before decoding. Data plates can be scratched, dirty, or hard to read.</Text>
      <SuggestedField label="Brand" field={extraction.brand} onUse={(value) => setBrand(value)} />
      <SuggestedField label="Model Number" field={extraction.modelNumber} onUse={(value) => setModelNumber(value)} />
      <SuggestedField label="Serial Number" field={extraction.serialNumber} onUse={(value) => setSerialNumber(value)} />
      {extraction.refrigerantType.value ? <SuggestedField label="Refrigerant" field={extraction.refrigerantType} /> : null}
      {extraction.voltage.value ? <SuggestedField label="Voltage" field={extraction.voltage} /> : null}
      {extraction.candidates.modelNumbers.length > 1 ? <Text style={styles.helperText}>Other model candidates: {extraction.candidates.modelNumbers.slice(1).join(', ')}</Text> : null}
      {extraction.candidates.serialNumbers.length > 1 ? <Text style={styles.helperText}>Other serial candidates: {extraction.candidates.serialNumbers.slice(1).join(', ')}</Text> : null}
      {extraction.warnings.map((warning) => <Text key={warning} style={styles.warningText}>• {warning}</Text>)}
    </View>
  );
}

function SuggestedField({ label, field, onUse }: { label: string; field: { value?: string; confidence: string; source: string }; onUse?: (value: string) => void }) {
  if (!field.value) return null;
  return (
    <View style={styles.suggestedRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.suggestedValue}>{field.value}</Text>
        <Text style={styles.statSub}>OCR confidence: {field.confidence}</Text>
      </View>
      {onUse ? <TouchableOpacity style={styles.useButton} onPress={() => onUse(field.value!)}><Text style={styles.useButtonText}>Use</Text></TouchableOpacity> : null}
    </View>
  );
}

function DecoderResultCard({ result, onSave, navigation, saving }: { result: DecoderResult; onSave: () => void; navigation: any; saving: boolean }) {
  const confidenceColor = result.confidence === 'medium' || result.confidence === 'high' ? '#0F766E' : result.confidence === 'low' ? '#B45309' : '#B91C1C';

  return (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>Decoder Result</Text>
        <View style={[styles.confidenceBadge, { borderColor: confidenceColor }]}>
          <Text style={[styles.confidenceText, { color: confidenceColor }]}>{result.confidence.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.summary}>{result.homeownerSummary}</Text>

      <View style={styles.resultGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Estimated Age</Text>
          <Text style={styles.statValue}>{result.age?.manufactureDateLabel || 'Unknown'}</Text>
          {result.age?.estimatedAgeYears !== undefined ? <Text style={styles.statSub}>{result.age.estimatedAgeYears} years old</Text> : null}
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Estimated Size</Text>
          <Text style={styles.statValue}>{result.capacity?.tons ? `${result.capacity.tons} tons` : 'Unknown'}</Text>
          {result.capacity?.btuh ? <Text style={styles.statSub}>{result.capacity.btuh.toLocaleString()} BTU/h</Text> : null}
        </View>
      </View>

      <Text style={styles.explainTitle}>How HVAC Truth got this</Text>
      {result.confidenceReasons.map((reason) => <Text key={reason} style={styles.bullet}>• {reason}</Text>)}

      {result.warnings.length ? <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>Important</Text>
        {result.warnings.map((warning) => <Text key={warning} style={styles.warningText}>• {warning}</Text>)}
      </View> : null}

      {saving ? <ActivityIndicator size="large" color="#0B66E4" /> : <PrimaryButton title="Save Result to My System" onPress={onSave} />}
      <TouchableOpacity onPress={() => navigation.navigate('MySystem')}>
        <Text style={styles.link}>View My System Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#F8FAFC' },
  title: { fontSize: 30, fontWeight: '900', marginBottom: 8, color: '#0F2E5F' },
  subtitle: { fontSize: 16, lineHeight: 23, color: '#475569', marginBottom: 16 },
  noticeBox: { backgroundColor: '#E6FFFA', borderColor: '#5EEAD4', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  noticeTitle: { fontSize: 16, fontWeight: '900', color: '#0F766E', marginBottom: 6 },
  noticeText: { fontSize: 15, lineHeight: 22, color: '#334155' },
  photoSaved: { color: '#0F766E', fontWeight: '800', marginTop: 4, marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginTop: 22, marginBottom: 10, color: '#0F2E5F' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, padding: 14, fontSize: 16, marginBottom: 12 },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  fieldLabel: { fontSize: 15, fontWeight: '800', marginTop: 12, marginBottom: 8, color: '#334155' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderColor: '#CBD5E1', borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#FFFFFF' },
  chipActive: { backgroundColor: '#0B66E4', borderColor: '#0B66E4' },
  chipText: { color: '#334155', fontWeight: '700' },
  chipTextActive: { color: '#FFFFFF' },
  helperText: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 12 },
  extractionCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginTop: 18, borderWidth: 1, borderColor: '#BAE6FD' },
  suggestedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12, marginVertical: 6 },
  suggestedValue: { fontSize: 17, fontWeight: '900', color: '#0F2E5F' },
  useButton: { backgroundColor: '#0B66E4', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  useButtonText: { color: '#FFFFFF', fontWeight: '900' },
  resultCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginTop: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  resultTitle: { fontSize: 21, fontWeight: '900', color: '#0F2E5F' },
  confidenceBadge: { borderWidth: 2, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  confidenceText: { fontWeight: '900' },
  summary: { fontSize: 15, lineHeight: 22, color: '#334155', marginBottom: 14 },
  resultGrid: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statBox: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12 },
  statLabel: { color: '#64748B', fontWeight: '800', fontSize: 13, marginBottom: 4 },
  statValue: { color: '#0F2E5F', fontWeight: '900', fontSize: 17 },
  statSub: { color: '#64748B', fontSize: 13, marginTop: 3 },
  explainTitle: { fontSize: 16, fontWeight: '900', color: '#0F2E5F', marginTop: 8, marginBottom: 6 },
  bullet: { fontSize: 14, lineHeight: 21, color: '#334155', marginBottom: 4 },
  warningBox: { backgroundColor: '#FFF7ED', borderColor: '#FDBA74', borderWidth: 1, borderRadius: 14, padding: 12, marginVertical: 12 },
  warningTitle: { color: '#9A3412', fontWeight: '900', marginBottom: 4 },
  warningText: { color: '#7C2D12', fontSize: 14, lineHeight: 20, marginTop: 4 },
  link: { textAlign: 'center', color: '#0B66E4', fontWeight: '900', marginTop: 12 },
  safeBox: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 24, marginBottom: 30 },
  safeTitle: { color: '#1D4ED8', fontWeight: '900', fontSize: 16, marginBottom: 6 },
  safeText: { color: '#334155', fontSize: 14, lineHeight: 21 }
});
