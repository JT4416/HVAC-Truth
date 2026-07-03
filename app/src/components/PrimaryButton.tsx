import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

export default function PrimaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    marginVertical: 8
  },
  text: {
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16
  }
});
