import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
  Linking,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import * as Contacts from "expo-contacts";
import { Ionicons } from "@expo/vector-icons";
import { useUserProfile } from "@/hooks/useStorage";
import { Contact } from "@/types/storage";

interface DeviceContact {
  id: string;
  name: string;
  phoneNumbers: string[];
}

const ProfileScreen = () => {
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    updateProfile,
    addEmergencyContact,
    removeEmergencyContact,
  } = useUserProfile();

  // Local state for form inputs
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactPermissionStatus, setContactPermissionStatus] =
    useState<string>("unknown");

  // Contact selection modal state
  const [showContactModal, setShowContactModal] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<DeviceContact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Manual contact entry modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");

  // Saving state
  const [saving, setSaving] = useState(false);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone);
    }
  }, [profile]);

  useEffect(() => {
    // Filter contacts based on search query
    if (searchQuery.trim() === "") {
      setFilteredContacts(deviceContacts);
    } else {
      const filtered = deviceContacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phoneNumbers.some((phone) => phone.includes(searchQuery))
      );
      setFilteredContacts(filtered);
    }
  }, [searchQuery, deviceContacts]);

  const checkContactPermissions = async () => {
    if (Platform.OS === "web") {
      return "web-not-supported";
    }

    const { status } = await Contacts.getPermissionsAsync();
    setContactPermissionStatus(status);
    return status;
  };

  const requestFullContactAccess = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Not Available",
        "Contact selection is not available on web platform"
      );
      return false;
    }

    const currentStatus = await checkContactPermissions();

    if (currentStatus === "granted") {
      return true;
    }

    const { status } = await Contacts.requestPermissionsAsync();
    setContactPermissionStatus(status);

    if (status === "granted") {
      return true;
    } else if (status === "denied") {
      showPermissionAlert();
      return false;
    }

    return false;
  };

  const showPermissionAlert = () => {
    Alert.alert(
      "Contact Access Required",
      'To add emergency contacts, we need access to your contacts. Please go to Settings > Privacy & Security > Contacts > CompanionAI and enable "Full Access".',
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Settings",
          onPress: () => {
            if (Platform.OS === "ios") {
              Linking.openURL("app-settings:");
            } else {
              Linking.openSettings();
            }
          },
        },
      ]
    );
  };

  const loadDeviceContacts = async () => {
    const hasPermission = await requestFullContactAccess();
    if (!hasPermission) return;

    setLoadingContacts(true);
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        sort: Contacts.SortTypes.FirstName,
      });

      const contactsWithPhones = data
        .filter(
          (contact) => contact.phoneNumbers && contact.phoneNumbers.length > 0
        )
        .map((contact) => ({
          id: contact.id || Date.now().toString(),
          name: contact.name || "Unknown",
          phoneNumbers: contact.phoneNumbers?.map((p) => p.number || "") || [],
        }));

      setDeviceContacts(contactsWithPhones);
      setFilteredContacts(contactsWithPhones);
      setShowContactModal(true);
    } catch (error) {
      console.error("Contact access error:", error);
      Alert.alert(
        "Access Error",
        "Unable to access contacts. You may need to grant full contact access in Settings."
      );
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleAddEmergencyContact = async (contact: DeviceContact, phoneNumber: string) => {
    const newContact: Contact = {
      id: `${contact.id}-${phoneNumber}`,
      name: contact.name,
      phoneNumber: phoneNumber,
    };

    // Check if contact is already added
    const isAlreadyAdded = profile?.emergencyContacts.some(
      (existingContact) =>
        existingContact.phoneNumber === newContact.phoneNumber
    );

    if (isAlreadyAdded) {
      Alert.alert(
        "Already Added",
        "This contact is already in your emergency contacts list"
      );
      return;
    }

    if ((profile?.emergencyContacts.length || 0) < 3) {
      try {
        await addEmergencyContact(newContact);
        setShowContactModal(false);
        setSearchQuery("");
        Alert.alert(
          "Success",
          `${newContact.name} has been added as an emergency contact`
        );
      } catch (error) {
        Alert.alert("Error", "Failed to add emergency contact");
      }
    } else {
      Alert.alert(
        "Limit Reached",
        "You can only add up to 3 emergency contacts"
      );
    }
  };

  const handleAddManualContact = async () => {
    if (!manualName.trim() || !manualPhone.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter both name and phone number"
      );
      return;
    }

    // Basic phone number validation
    const cleanPhone = manualPhone.replace(/\D/g, "");

    if (cleanPhone.length < 10) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number");
      return;
    }

    const newContact: Contact = {
      id: Date.now().toString(),
      name: manualName.trim(),
      phoneNumber: manualPhone.trim(),
    };

    // Check if contact is already added
    const isAlreadyAdded = profile?.emergencyContacts.some(
      (existingContact) =>
        existingContact.phoneNumber === newContact.phoneNumber
    );

    if (isAlreadyAdded) {
      Alert.alert(
        "Already Added",
        "This phone number is already in your emergency contacts list"
      );
      return;
    }

    if ((profile?.emergencyContacts.length || 0) < 3) {
      try {
        await addEmergencyContact(newContact);
        setShowManualModal(false);
        setManualName("");
        setManualPhone("");
        Alert.alert(
          "Success",
          `${newContact.name} has been added as an emergency contact`
        );
      } catch (error) {
        Alert.alert("Error", "Failed to add emergency contact");
      }
    } else {
      Alert.alert(
        "Limit Reached",
        "You can only add up to 3 emergency contacts"
      );
    }
  };

  const handleRemoveEmergencyContact = (id: string) => {
    Alert.alert(
      "Remove Contact",
      "Are you sure you want to remove this emergency contact?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeEmergencyContact(id);
            } catch (error) {
              Alert.alert("Error", "Failed to remove emergency contact");
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
      });
      Alert.alert("Success", "Profile saved successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const showPermissionHelp = () => {
    Alert.alert(
      "Contact Access Help",
      Platform.OS === "ios"
        ? 'If you can only see limited contacts:\n\n1. Go to Settings > Privacy & Security > Contacts\n2. Find CompanionAI\n3. Select "Full Access" instead of "Selected Contacts"\n\nThis will allow you to choose from all your contacts.'
        : "If you're having trouble accessing contacts:\n\n1. Go to Settings > Apps > CompanionAI\n2. Tap Permissions\n3. Enable Contacts permission\n\nThis will allow you to choose from all your contacts.",
      [
        { text: "OK" },
        {
          text: "Open Settings",
          onPress: () => {
            if (Platform.OS === "ios") {
              Linking.openURL("app-settings:");
            } else {
              Linking.openSettings();
            }
          },
        },
      ]
    );
  };

  const renderContactItem = ({ item }: { item: DeviceContact }) => (
    <View style={styles.contactItem}>
      <View style={styles.contactItemHeader}>
        <View style={styles.contactAvatar}>
          <Ionicons name="person" size={20} color="#6b7280" />
        </View>
        <View style={styles.contactItemInfo}>
          <Text style={styles.contactItemName}>{item.name}</Text>
          <Text style={styles.contactItemCount}>
            {item.phoneNumbers.length} number
            {item.phoneNumbers.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <View style={styles.phoneNumbersList}>
        {item.phoneNumbers.map((phoneNumber, index) => (
          <TouchableOpacity
            key={index}
            style={styles.phoneNumberItem}
            onPress={() => handleAddEmergencyContact(item, phoneNumber)}
          >
            <Ionicons name="call" size={16} color="#6b7280" />
            <Text style={styles.phoneNumberText}>{phoneNumber}</Text>
            <Ionicons name="add" size={16} color="#3b82f6" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (profileError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading profile: {profileError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={{ height: 16 }} />
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholderTextColor="#9ca3af"
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
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={showPermissionHelp}
            >
              <Ionicons name="settings" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionDescription}>
            Add up to 3 emergency contacts who can be reached in case of
            emergency
          </Text>

          {Platform.OS === "ios" && (
            <View style={styles.permissionNotice}>
              <Text style={styles.permissionNoticeText}>
                💡 If you can only see limited contacts, tap the settings icon
                for help accessing all your contacts
              </Text>
            </View>
          )}

          <View style={styles.addContactButtons}>
            <TouchableOpacity
              style={[styles.addButton, styles.primaryButton]}
              onPress={loadDeviceContacts}
              disabled={loadingContacts}
            >
              {loadingContacts ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="people" size={16} color="white" />
              )}
              <Text style={styles.addButtonText}>
                {loadingContacts ? "Loading..." : "From Contacts"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addButton, styles.secondaryButton]}
              onPress={() => setShowManualModal(true)}
            >
              <Ionicons name="person-add" size={16} color="#3b82f6" />
              <Text style={styles.addButtonTextSecondary}>Add Manually</Text>
            </TouchableOpacity>
          </View>

          {!profile?.emergencyContacts.length ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateText}>
                No emergency contacts added yet
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Choose from your contacts or add manually
              </Text>
            </View>
          ) : (
            <View style={styles.contactsList}>
              {profile.emergencyContacts.map((contact, index) => (
                <View key={contact.id} style={styles.contactCard}>
                  <View style={styles.contactCardHeader}>
                    <View style={styles.contactCardAvatar}>
                      <Ionicons name="person" size={20} color="#3b82f6" />
                    </View>
                    <View style={styles.contactCardInfo}>
                      <Text style={styles.contactCardName}>{contact.name}</Text>
                      <View style={styles.contactCardPhone}>
                        <Ionicons name="call" size={14} color="#6b7280" />
                        <Text style={styles.contactCardPhoneText}>
                          {contact.phoneNumber}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveEmergencyContact(contact.id)}
                    >
                      <Ionicons name="close" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {profile?.emergencyContacts.length > 0 && profile.emergencyContacts.length < 3 && (
            <Text style={styles.helperText}>
              You can add {3 - profile.emergencyContacts.length} more emergency contact
              {3 - profile.emergencyContacts.length !== 1 ? "s" : ""}
            </Text>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save Profile</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Contact Selection Modal */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Contact</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowContactModal(false);
                setSearchQuery("");
              }}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredContacts}
            renderItem={renderContactItem}
            keyExtractor={(item) => item.id}
            style={styles.contactsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptySearchState}>
                <Ionicons name="search-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptySearchText}>
                  {searchQuery ? "No contacts found" : "No contacts available"}
                </Text>
                <Text style={styles.emptySearchSubtext}>
                  {searchQuery
                    ? "Try a different search term"
                    : "Make sure you have contacts saved on your device"}
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Manual Contact Entry Modal */}
      <Modal
        visible={showManualModal}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Contact Manually</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowManualModal(false);
                setManualName("");
                setManualPhone("");
              }}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.manualFormContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Name</Text>
              <TextInput
                placeholder="Enter contact name"
                placeholderTextColor="#9ca3af"
                value={manualName}
                onChangeText={setManualName}
                style={styles.input}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                placeholder="Enter phone number"
                placeholderTextColor="#9ca3af"
                value={manualPhone}
                onChangeText={setManualPhone}
                style={styles.input}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { marginTop: 24 }]}
              onPress={handleAddManualContact}
            >
              <Text style={styles.saveButtonText}>Add Emergency Contact</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    padding: 20,
    paddingBottom: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 30,
    textAlign: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  permissionNotice: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  permissionNoticeText: {
    fontSize: 13,
    color: "#92400e",
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    color: "#1e293b",
  },
  helpButton: {
    backgroundColor: "#f3f4f6",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  addContactButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
  },
  secondaryButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  addButtonTextSecondary: {
    color: "#3b82f6",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyState: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  contactsList: {
    gap: 12,
  },
  contactCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contactCardInfo: {
    flex: 1,
  },
  contactCardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  contactCardPhone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactCardPhoneText: {
    fontSize: 14,
    color: "#6b7280",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: "#10b981",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
  },
  contactItem: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  contactItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contactItemInfo: {
    flex: 1,
  },
  contactItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  contactItemCount: {
    fontSize: 12,
    color: "#6b7280",
  },
  phoneNumbersList: {
    gap: 8,
  },
  phoneNumberItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 10,
  },
  phoneNumberText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
  emptySearchState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptySearchText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 12,
    marginBottom: 4,
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
  },
  manualFormContainer: {
    padding: 20,
  },
});