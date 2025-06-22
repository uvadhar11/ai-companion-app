import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform
} from 'react-native';
import * as Contacts from 'expo-contacts';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
}

const ProfileScreen = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState<Contact[]>([]);

  const requestContactsPermission = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Contact selection is not available on web platform');
      return false;
    }

    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      return true;
    } else {
      Alert.alert('Permission Denied', 'We need access to your contacts to add emergency contacts');
      return false;
    }
  };

  const selectContact = async () => {
    const hasPermission = await requestContactsPermission();
    if (!hasPermission) return;

    try {
      // Get all contacts every time to allow selecting from the full list
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });

      if (data.length > 0) {
        // Filter out contacts that don't have phone numbers
        const contactsWithPhones = data.filter(contact => 
          contact.phoneNumbers && contact.phoneNumbers.length > 0
        );

        if (contactsWithPhones.length === 0) {
          Alert.alert('No Contacts', 'No contacts with phone numbers found');
          return;
        }

        // Show up to 10 contacts for selection
        const contactsToShow = contactsWithPhones.slice(0, 10);
        const contactOptions = contactsToShow.map((contact, index) => {
          const phoneNumber = contact.phoneNumbers?.[0]?.number || 'No phone';
          return `${index + 1}. ${contact.name} - ${phoneNumber}`;
        }).join('\n');

        Alert.alert(
          'Select Contact',
          `Choose a contact to add as emergency contact:\n\n${contactOptions}`,
          [
            { text: 'Cancel', style: 'cancel' },
            ...contactsToShow.map((contact, index) => ({
              text: `${index + 1}`,
              onPress: () => addEmergencyContact(contact)
            }))
          ]
        );
      } else {
        Alert.alert('No Contacts', 'No contacts found on your device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access contacts');
    }
  };

  const addEmergencyContact = (contact: any) => {
    const phoneNumber = contact.phoneNumbers?.[0]?.number || '';
    const newContact: Contact = {
      id: contact.id || Date.now().toString(),
      name: contact.name || 'Unknown',
      phoneNumber: phoneNumber
    };

    // Check if contact is already added
    const isAlreadyAdded = emergencyContacts.some(
      existingContact => existingContact.id === newContact.id
    );

    if (isAlreadyAdded) {
      Alert.alert('Already Added', 'This contact is already in your emergency contacts list');
      return;
    }

    if (emergencyContacts.length < 3) {
      setEmergencyContacts([...emergencyContacts, newContact]);
      Alert.alert('Success', `${newContact.name} has been added as an emergency contact`);
    } else {
      Alert.alert('Limit Reached', 'You can only add up to 3 emergency contacts');
    }
  };

  const removeEmergencyContact = (id: string) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setEmergencyContacts(emergencyContacts.filter(contact => contact.id !== id));
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone number</Text>
            <TextInput
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={selectContact}
            >
              <Text style={styles.addButtonText}>+ Add Contact</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionDescription}>
            Add up to 3 emergency contacts who can be reached in case of emergency
          </Text>

          {emergencyContacts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No emergency contacts added yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap "Add Contact" to select from your full contacts list
              </Text>
            </View>
          ) : (
            emergencyContacts.map((contact, index) => (
              <View key={contact.id} style={styles.contactCard}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>
                    Contact #{index + 1}: {contact.name}
                  </Text>
                  <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeEmergencyContact(contact.id)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          {emergencyContacts.length > 0 && emergencyContacts.length < 3 && (
            <Text style={styles.helperText}>
              You can add {3 - emergencyContacts.length} more emergency contact{3 - emergencyContacts.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Profile</Text>
        </TouchableOpacity>
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#1e293b',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  removeButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});