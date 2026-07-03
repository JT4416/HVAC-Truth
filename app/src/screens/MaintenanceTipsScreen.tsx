import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { maintenanceLibrary } from '../content/maintenanceLibrary';

export default function MaintenanceTipsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Maintenance Tips</Text>
      <Text style={styles.subtitle}>Safe homeowner maintenance that can prevent comfort problems, water damage, and unnecessary service calls.</Text>
      {maintenanceLibrary.map((article) => (
        <View key={article.slug} style={styles.card}>
          <Text style={styles.category}>{article.category.toUpperCase()} • {article.safeDifficulty.toUpperCase()}</Text>
          <Text style={styles.cardTitle}>{article.title}</Text>
          <Text style={styles.summary}>{article.summary}</Text>
          <Text style={styles.section}>Tools</Text>
          {article.tools.map((tool) => <Text key={tool} style={styles.bullet}>• {tool}</Text>)}
          <Text style={styles.section}>Steps</Text>
          {article.steps.map((step) => <Text key={step} style={styles.bullet}>• {step}</Text>)}
          <Text style={styles.section}>When to call a pro</Text>
          {article.whenToCallPro.map((item) => <Text key={item} style={styles.bullet}>• {item}</Text>)}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#475569', marginBottom: 16 },
  card: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  category: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 6 },
  cardTitle: { fontSize: 19, fontWeight: '800', marginBottom: 6 },
  summary: { fontSize: 15, lineHeight: 22, color: '#334155' },
  section: { fontSize: 14, fontWeight: '800', marginTop: 10, marginBottom: 3 },
  bullet: { fontSize: 14, lineHeight: 21, color: '#334155' }
});
