import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>HVAC Truth</Text>
      <Text style={styles.subtitle}>Honest AC help in your pocket.</Text>
      <PrimaryButton title="My AC Is Not Working" onPress={() => navigation.navigate('Troubleshooting')} />
      <PrimaryButton title="Check My Quote" onPress={() => navigation.navigate('QuoteChecker')} />
      <PrimaryButton title="Find a Technician" onPress={() => navigation.navigate('ContractorFinder')} />
      <PrimaryButton title="Maintenance Tips" onPress={() => navigation.navigate('MaintenanceTips')} />
      <PrimaryButton title="Decode My System" onPress={() => navigation.navigate('SystemDecoder')} />
      <PrimaryButton title="Ask HVAC Truth" onPress={() => navigation.navigate('AskTruth')} />
      <PrimaryButton title="My System" onPress={() => navigation.navigate('MySystem')} />
      <PrimaryButton title="Contractor Report" onPress={() => navigation.navigate('ContractorReport')} />
      <PrimaryButton title="Request Contractor Help" onPress={() => navigation.navigate('ContractorLeadRequest')} />
      <PrimaryButton title="Claim Contractor Profile" onPress={() => navigation.navigate('ContractorProfileClaim')} />
      <PrimaryButton title="Contractor Dashboard" onPress={() => navigation.navigate('ContractorDashboard')} />
      <PrimaryButton title="Contractor Claim Review" onPress={() => navigation.navigate('AdminContractorClaimReview')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 34, fontWeight: '900', marginBottom: 4 },
  subtitle: { fontSize: 17, marginBottom: 24 }
});
