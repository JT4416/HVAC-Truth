import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import TroubleshootingScreen from './src/screens/TroubleshootingScreen';
import ContractorFinderScreen from './src/screens/ContractorFinderScreen';
import MaintenanceTipsScreen from './src/screens/MaintenanceTipsScreen';
import QuoteCheckerScreen from './src/screens/QuoteCheckerScreen';
import AskTruthScreen from './src/screens/AskTruthScreen';
import MySystemScreen from './src/screens/MySystemScreen';
import SystemDecoderScreen from './src/screens/SystemDecoderScreen';
import AuthScreen from './src/screens/AuthScreen';
import ContractorReportScreen from './src/screens/ContractorReportScreen';
import ContractorLeadRequestScreen from './src/screens/ContractorLeadRequestScreen';
import ContractorProfileClaimScreen from './src/screens/ContractorProfileClaimScreen';
import ContractorDashboardScreen from './src/screens/ContractorDashboardScreen';
import ContractorLeadDetailScreen from './src/screens/ContractorLeadDetailScreen';
import ContractorLeadPreferencesScreen from './src/screens/ContractorLeadPreferencesScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';

export type RootStackParamList = {
  Home: undefined;
  Troubleshooting: undefined;
  ContractorFinder: undefined;
  MaintenanceTips: undefined;
  QuoteChecker: undefined;
  AskTruth: undefined;
  MySystem: undefined;
  SystemDecoder: undefined;
  ContractorReport: undefined;
  ContractorLeadRequest: undefined;
  ContractorProfileClaim: undefined;
  ContractorDashboard: undefined;
  ContractorLeadDetail: { leadId: string };
  ContractorLeadPreferences: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color="#0B66E4" /></View>;
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'HVAC Truth' }} />
        <Stack.Screen name="Troubleshooting" component={TroubleshootingScreen} options={{ title: 'My AC Is Not Working' }} />
        <Stack.Screen name="ContractorFinder" component={ContractorFinderScreen} options={{ title: 'Find a Technician' }} />
        <Stack.Screen name="MaintenanceTips" component={MaintenanceTipsScreen} options={{ title: 'Maintenance Tips' }} />
        <Stack.Screen name="QuoteChecker" component={QuoteCheckerScreen} options={{ title: 'Check My Quote' }} />
        <Stack.Screen name="AskTruth" component={AskTruthScreen} options={{ title: 'Ask HVAC Truth' }} />
        <Stack.Screen name="MySystem" component={MySystemScreen} options={{ title: 'My System' }} />
        <Stack.Screen name="SystemDecoder" component={SystemDecoderScreen} options={{ title: 'Decode My System' }} />
        <Stack.Screen name="ContractorReport" component={ContractorReportScreen} options={{ title: 'Contractor Report' }} />
        <Stack.Screen name="ContractorLeadRequest" component={ContractorLeadRequestScreen} options={{ title: 'Request Contractor Help' }} />
        <Stack.Screen name="ContractorProfileClaim" component={ContractorProfileClaimScreen} options={{ title: 'Claim Contractor Profile' }} />
        <Stack.Screen name="ContractorDashboard" component={ContractorDashboardScreen} options={{ title: 'Contractor Dashboard' }} />
        <Stack.Screen name="ContractorLeadDetail" component={ContractorLeadDetailScreen} options={{ title: 'Lead Packet' }} />
        <Stack.Screen name="ContractorLeadPreferences" component={ContractorLeadPreferencesScreen} options={{ title: 'Lead Preferences' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
