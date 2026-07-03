import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import PrimaryButton from '../components/PrimaryButton';
import { AIR_HANDLER_LOCATION_OPTIONS, AirHandlerLocation, DataPlatePhoto, DataPlateSide, DATA_PLATE_GUIDANCE, HvacSystemProfile } from '../domain/systemProfileTypes';
import { useAuth } from '../context/AuthContext';
import { getPrimarySystem, getProfile, saveSystemProfile } from '../services/profilePersistence';
import { listSystemPhotos, uploadDataPlatePhoto } from '../services/dataPlatePhotos';

export default function MySystemScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileZip, setProfileZip] = useState('00000');
  const [systemId, setSystemId] = useState<string | undefined>();
  const [brand, setBrand] = useState('');
  const [systemType, setSystemType] = useState('Central Air Conditioner');
  const [filterSize, setFilterSize] = useState('');
  const [airHandlerLocation, setAirHandlerLocation] = useState<AirHandlerLocation>('unknown');
  const [airHandlerLocationNotes, setAirHandlerLocationNotes] = useState('');
  const [accessNotes, setAccessNotes] = useState('');
  const [indoorModel, setIndoorModel] = useState('');
  const [indoorSerial, setIndoorSerial] = useState('');
  const [outdoorModel, setOutdoorModel] = useState('');
  const [outdoorSerial, setOutdoorSerial] = useState('');
  const [age, setAge] = useState('');
  const [tonnage, setTonnage] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<DataPlatePhoto[]>([]);

  useEffect(() => {
    loadSystemProfile();
  }, [user?.id]);

  async function loadSystemProfile() {
    if (!user?.id) return;
    try {
      setLoading(true);
      const profile = await getProfile(user.id);
      if (profile?.zip_code) setProfileZip(profile.zip_code);

      const system = await getPrimarySystem(user.id);
      if (system) {
        setSystemId(system.id);
        setBrand(system.brand ?? '');
        setSystemType(system.system_type ?? 'Central Air Conditioner');
        setFilterSize(system.filter_size ?? '');
        setAirHandlerLocation((system.air_handler_location as AirHandlerLocation) ?? 'unknown');
        setAirHandlerLocationNotes(system.air_handler_location_notes ?? '');
        setAccessNotes(system.access_notes ?? '');
        setIndoorModel(system.indoor_model_number ?? '');
        setIndoorSerial(system.indoor_serial_number ?? '');
        setOutdoorModel(system.outdoor_model_number ?? '');
        setOutdoorSerial(system.outdoor_serial_number ?? '');
        setAge(system.estimated_age_years ? String(system.estimated_age_years) : '');
        setTonnage(system.tonnage ? String(system.tonnage) : '');
        setNotes(system.notes ?? '');

        const savedPhotos = await listSystemPhotos(system.id);
        setPhotos(savedPhotos.map((photo: any) => ({
          id: photo.id,
          side: photo.photo_type?.startsWith('indoor') ? 'indoor' : 'outdoor',
          label: photo.photo_type?.startsWith('indoor') ? 'Indoor data plate' : 'Outdoor data plate',
          publicUrl: photo.signed_url,
          storagePath: photo.storage_path,
          capturedAt: photo.created_at
        })));
      }
    } catch (error: any) {
      Alert.alert('Could not load system profile', error?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function captureDataPlate(side: DataPlateSide) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'HVAC Truth needs camera access so you can save your system data plate photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.85,
      exif: false
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const photo: DataPlatePhoto = {
      side,
      label: side === 'indoor' ? 'Indoor data plate' : 'Outdoor data plate',
      localUri: result.assets[0].uri,
      capturedAt: new Date().toISOString()
    };

    setPhotos((current) => [photo, ...current.filter((p) => p.side !== side)]);
  }

  async function saveProfile() {
    if (!user?.id) return;
    try {
      setSaving(true);
      const payload: HvacSystemProfile = {
        id: systemId,
        systemType,
        brand,
        indoorModelNumber: indoorModel,
        indoorSerialNumber: indoorSerial,
        outdoorModelNumber: outdoorModel,
        outdoorSerialNumber: outdoorSerial,
        estimatedAgeYears: age ? Number(age) : undefined,
        tonnage: tonnage ? Number(tonnage) : undefined,
        filterSize,
        airHandlerLocation,
        airHandlerLocationNotes,
        accessNotes,
        notes,
        dataPlatePhotos: photos
      };

      const savedSystem = await saveSystemProfile(user.id, payload, profileZip);
      setSystemId(savedSystem.id);

      const localPhotos = photos.filter((photo) => photo.localUri && !photo.storagePath);
      for (const photo of localPhotos) {
        const uploaded = await uploadDataPlatePhoto({
          userId: user.id,
          hvacSystemId: savedSystem.id,
          side: photo.side,
          uri: photo.localUri!
        });
        photo.id = uploaded.record.id;
        photo.storagePath = uploaded.storagePath;
        photo.publicUrl = uploaded.signedUrl;
        photo.localUri = undefined;
      }

      setPhotos([...photos]);
      Alert.alert('System profile saved', 'Your system details and data plate photos are now tied to your homeowner profile.');
    } catch (error: any) {
      Alert.alert('Could not save profile', error?.message ?? 'Please check Supabase setup and try again.');
    } finally {
      setSaving(false);
    }
  }

  const indoorPhoto = photos.find((photo) => photo.side === 'indoor');
  const outdoorPhoto = photos.find((photo) => photo.side === 'outdoor');

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#0B66E4" /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>My System</Text>
          <Text style={styles.subtitle}>Save your equipment details and data plate photos so HVAC Truth can give better guidance.</Text>
        </View>
        <TouchableOpacity onPress={signOut}><Text style={styles.signOut}>Sign out</Text></TouchableOpacity>
      </View>

      <View style={styles.decoderBox}>
        <Text style={styles.decoderTitle}>Want age and size answers?</Text>
        <Text style={styles.decoderText}>Use the System Decoder to estimate system age from the serial number and tonnage from the model number.</Text>
        <TouchableOpacity style={styles.decoderButton} onPress={() => navigation.navigate('SystemDecoder')}>
          <Text style={styles.decoderButtonText}>Decode My System</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.alertBox}>
        <Text style={styles.alertTitle}>Data plate photos are important</Text>
        <Text style={styles.alertText}>Model and serial numbers help identify system age, size, refrigerant, parts, warranty, and quote fairness.</Text>
      </View>

      <Text style={styles.sectionTitle}>System details</Text>
      <TextInput style={styles.input} placeholder="System type" value={systemType} onChangeText={setSystemType} />
      <TextInput style={styles.input} placeholder="Brand, if known" value={brand} onChangeText={setBrand} />
      <TextInput style={styles.input} placeholder="Estimated system age" keyboardType="number-pad" value={age} onChangeText={setAge} />
      <TextInput style={styles.input} placeholder="Tonnage, e.g. 3" keyboardType="decimal-pad" value={tonnage} onChangeText={setTonnage} />
      <TextInput style={styles.input} placeholder="Filter size, e.g. 20x25x1" value={filterSize} onChangeText={setFilterSize} />

      <Text style={styles.sectionTitle}>Air handler location</Text>
      <Text style={styles.helperText}>This helps contractors price labor more accurately before they visit. Attic, crawlspace, roof, and tight closet locations can change the ballpark number.</Text>
      <View style={styles.locationGrid}>
        {AIR_HANDLER_LOCATION_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.locationChip, airHandlerLocation === option.value && styles.locationChipActive]}
            onPress={() => setAirHandlerLocation(option.value)}
          >
            <Text style={[styles.locationChipText, airHandlerLocation === option.value && styles.locationChipTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.pricingNoteBox}>
        <Text style={styles.pricingNoteTitle}>Contractor pricing note</Text>
        <Text style={styles.pricingNoteText}>{AIR_HANDLER_LOCATION_OPTIONS.find((option) => option.value === airHandlerLocation)?.pricingNote}</Text>
      </View>
      <TextInput
        style={[styles.input, styles.textAreaSmall]}
        placeholder="Location details, e.g. attic above hallway, garage platform, closet in hallway, tight access, no pull-down ladder"
        value={airHandlerLocationNotes}
        onChangeText={setAirHandlerLocationNotes}
        multiline
      />
      <TextInput
        style={[styles.input, styles.textAreaSmall]}
        placeholder="Access notes for contractor, e.g. parking, gate code, ladder needed, pets, condo access, roof hatch"
        value={accessNotes}
        onChangeText={setAccessNotes}
        multiline
      />

      <Text style={styles.sectionTitle}>Indoor unit</Text>
      <DataPlateCaptureCard side="indoor" photo={indoorPhoto} onCapture={() => captureDataPlate('indoor')} />
      <TextInput style={styles.input} placeholder="Indoor model number" value={indoorModel} onChangeText={setIndoorModel} />
      <TextInput style={styles.input} placeholder="Indoor serial number" value={indoorSerial} onChangeText={setIndoorSerial} />

      <Text style={styles.sectionTitle}>Outdoor unit</Text>
      <DataPlateCaptureCard side="outdoor" photo={outdoorPhoto} onCapture={() => captureDataPlate('outdoor')} />
      <TextInput style={styles.input} placeholder="Outdoor model number" value={outdoorModel} onChangeText={setOutdoorModel} />
      <TextInput style={styles.input} placeholder="Outdoor serial number" value={outdoorSerial} onChangeText={setOutdoorSerial} />

      <Text style={styles.sectionTitle}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Example: installed by contractor, warranty notes, past repairs, comfort issues"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      {saving ? <ActivityIndicator size="large" color="#0B66E4" /> : <PrimaryButton title="Save System Profile" onPress={saveProfile} />}
      <PrimaryButton title="View Contractor Report" onPress={() => navigation.navigate('ContractorReport')} />
      <Text style={styles.note}>Photos are uploaded to the private system-data-plates bucket and linked to this system record.</Text>
    </ScrollView>
  );
}

function DataPlateCaptureCard({ side, photo, onCapture }: { side: DataPlateSide; photo?: DataPlatePhoto; onCapture: () => void }) {
  const guidance = DATA_PLATE_GUIDANCE[side];
  const imageUri = photo?.localUri || photo?.publicUrl;
  return (
    <View style={styles.photoCard}>
      <View style={styles.photoHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.photoTitle}>{guidance.title}</Text>
          <Text style={styles.photoText}>Examples: {guidance.examples.join(', ')}</Text>
        </View>
        <TouchableOpacity style={styles.captureButton} onPress={onCapture}>
          <Text style={styles.captureButtonText}>{photo ? 'Retake' : 'Take Photo'}</Text>
        </TouchableOpacity>
      </View>

      {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : <View style={styles.placeholder}><Text style={styles.placeholderText}>No {side} data plate photo yet</Text></View>}
      {photo?.storagePath ? <Text style={styles.savedPhoto}>Saved securely</Text> : null}

      {guidance.captureTips.map((tip) => (
        <Text key={tip} style={styles.tip}>• {tip}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  container: { padding: 24, backgroundColor: '#F8FAFC' },
  topRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  title: { fontSize: 30, fontWeight: '900', marginBottom: 8, color: '#0F2E5F' },
  subtitle: { fontSize: 16, lineHeight: 23, color: '#475569', marginBottom: 16 },
  signOut: { color: '#0B66E4', fontWeight: '900', marginTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginTop: 20, marginBottom: 10, color: '#0F2E5F' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, padding: 14, fontSize: 16, marginBottom: 12 },
  helperText: { color: '#475569', fontSize: 15, lineHeight: 22, marginBottom: 12 },
  locationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  locationChip: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14 },
  locationChipActive: { backgroundColor: '#0B66E4', borderColor: '#0B66E4' },
  locationChipText: { color: '#334155', fontWeight: '800' },
  locationChipTextActive: { color: '#FFFFFF' },
  pricingNoteBox: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FDBA74', borderRadius: 16, padding: 14, marginBottom: 12 },
  pricingNoteTitle: { color: '#C2410C', fontWeight: '900', marginBottom: 4 },
  pricingNoteText: { color: '#334155', fontSize: 15, lineHeight: 21 },
  textAreaSmall: { minHeight: 76, textAlignVertical: 'top' },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  decoderBox: { backgroundColor: '#EFF6FF', borderColor: '#93C5FD', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 },
  decoderTitle: { fontSize: 17, fontWeight: '900', color: '#1D4ED8', marginBottom: 6 },
  decoderText: { color: '#334155', fontSize: 15, lineHeight: 22, marginBottom: 12 },
  decoderButton: { backgroundColor: '#0B66E4', borderRadius: 999, paddingVertical: 11, alignItems: 'center' },
  decoderButtonText: { color: '#FFFFFF', fontWeight: '900' },
  alertBox: { backgroundColor: '#E6FFFA', borderColor: '#5EEAD4', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 8 },
  alertTitle: { fontSize: 16, fontWeight: '800', color: '#0F766E', marginBottom: 6 },
  alertText: { fontSize: 15, lineHeight: 22, color: '#334155' },
  photoCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#D8E2F0', marginBottom: 12 },
  photoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  photoTitle: { fontSize: 17, fontWeight: '800', color: '#0F2E5F', marginBottom: 4 },
  photoText: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  captureButton: { backgroundColor: '#0B66E4', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14 },
  captureButtonText: { color: '#FFFFFF', fontWeight: '800' },
  preview: { height: 180, borderRadius: 14, marginBottom: 12, backgroundColor: '#E2E8F0' },
  placeholder: { height: 150, borderRadius: 14, marginBottom: 12, backgroundColor: '#EEF2F7', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed' },
  placeholderText: { color: '#64748B', fontWeight: '700' },
  savedPhoto: { color: '#0F766E', fontWeight: '900', marginBottom: 8 },
  tip: { color: '#475569', fontSize: 14, lineHeight: 20, marginBottom: 4 },
  note: { marginTop: 12, fontSize: 15, lineHeight: 22, color: '#475569' }
});
