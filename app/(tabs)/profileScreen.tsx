import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput
} from 'react-native';

const ProfileScreen = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <Text style={styles.sectionTitle}>Basic Information</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <Text style={styles.label}>Phone number</Text>
        <TextInput
          placeholder="Enter your phone number"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          keyboardType="phone-pad"
        />

        <Text style={styles.sectionTitle}>Emergency Contacts</Text>

        <Text style={styles.label}>Contact #1</Text>
        <TextInput
          placeholder="Enter contact #1 name"
          value={emergencyName}
          onChangeText={setEmergencyName}
          style={styles.input}
        />

        <Text style={styles.label}>Phone number</Text>
        <TextInput
          placeholder="Enter contact #1 number"
          value={emergencyPhone}
          onChangeText={setEmergencyPhone}
          style={styles.input}
          keyboardType="phone-pad"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 30,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#1e293b',
  },
});
