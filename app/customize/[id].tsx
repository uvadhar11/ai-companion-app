import { companions } from "@/app/(tabs)/companionScreen";
import { useLocalSearchParams, useNavigation, router } from "expo-router";
import { useLayoutEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCompanionCustomization } from "@/hooks/useStorage";

export default function CustomizeCompanionScreen() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();

  const { customization, loading, error, updateCustomization } =
    useCompanionCustomization(id as string);

  // Modal states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    if (id) {
      const capitalized =
        (id as string).charAt(0).toUpperCase() + (id as string).slice(1);
      navigation.setOptions({
        title: capitalized,
        headerBackTitle: "Call AI",
        headerShown: false,
      });
    }
  }, [id]);

  const companion = companions.find((c) => c.id === id);

  if (!companion) return <Text>Companion not found</Text>;

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleSave = async () => {
    if (!editingField) return;
    setSaving(true);
    try {
      await updateCustomization({
        [editingField]: editValue.trim(),
      });
      setEditingField(null);
      setEditValue("");
      Alert.alert("Success", "Changes saved successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue("");
  };

  const getFieldValue = (field: string) => {
    if (customization) {
      switch (field) {
        case "safeWord":
          return customization.safeWord;
        case "emergencyContact":
          return customization.emergencyContact;
        case "personalContext":
          return customization.personalContext;
        default:
          return "";
      }
    }

    // Return default values from companion data
    switch (field) {
      case "safeWord":
        return companion.safeWord;
      case "emergencyContact":
        return companion.emergencyContact;
      case "personalContext":
        return companion.personalContext;
      default:
        return "";
    }
  };

  const getFieldLabel = (field: string) => {
    switch (field) {
      case "safeWord":
        return "Safe Word";
      case "emergencyContact":
        return "Emergency Contact";
      case "personalContext":
        return "Personal Context";
      default:
        return field;
    }
  };

  const getFieldDescription = (field: string) => {
    switch (field) {
      case "safeWord":
        return "A phrase that will immediately transfer the call to your emergency contact";
      case "emergencyContact":
        return "Phone number to call when the safe word is used";
      case "personalContext":
        return "Personal details to help the AI companion have more natural conversations";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {(id as string).charAt(0).toUpperCase() + (id as string).slice(1)}
          </Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading customization...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {(id as string).charAt(0).toUpperCase() + (id as string).slice(1)}
          </Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {(id as string).charAt(0).toUpperCase() + (id as string).slice(1)}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={companion.image} style={styles.avatar} />
        <Text style={styles.name}>{companion.name}</Text>

        <Section title="Description" content={companion.description} />

        <EditableSection
          title="Safe Word"
          content={getFieldValue("safeWord")}
          description={getFieldDescription("safeWord")}
          onEdit={() => handleEdit("safeWord", getFieldValue("safeWord"))}
        />

        <EditableSection
          title="Emergency Contact"
          content={getFieldValue("emergencyContact")}
          description={getFieldDescription("emergencyContact")}
          onEdit={() =>
            handleEdit("emergencyContact", getFieldValue("emergencyContact"))
          }
        />

        <EditableSection
          title="Personal Context"
          content={getFieldValue("personalContext")}
          description={getFieldDescription("personalContext")}
          onEdit={() =>
            handleEdit("personalContext", getFieldValue("personalContext"))
          }
          multiline
        />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editingField !== null}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Edit {getFieldLabel(editingField || "")}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={handleCancel}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              {getFieldDescription(editingField || "")}
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                editingField === "personalContext" &&
                  styles.modalInputMultiline,
              ]}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`Enter ${getFieldLabel(
                editingField || ""
              ).toLowerCase()}...`}
              placeholderTextColor="#9ca3af"
              multiline={editingField === "personalContext"}
              numberOfLines={editingField === "personalContext" ? 6 : 1}
              textAlignVertical={
                editingField === "personalContext" ? "top" : "center"
              }
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  saving && styles.modalSaveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.cardRow}>
        <Text style={styles.cardText}>{content}</Text>
      </View>
    </View>
  );
}

function EditableSection({
  title,
  content,
  description,
  onEdit,
  multiline = false,
}: {
  title: string;
  content: string;
  description?: string;
  onEdit: () => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description && (
        <Text style={styles.sectionDescription}>{description}</Text>
      )}
      <TouchableOpacity style={styles.editableCardRow} onPress={onEdit}>
        <Text style={[styles.cardText, multiline && styles.cardTextMultiline]}>
          {content || `Tap to add ${title.toLowerCase()}...`}
        </Text>
        <View style={styles.editIconContainer}>
          <Ionicons name="pencil" size={16} color="#3b82f6" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#f1f5f9",
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: "#1e40af",
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginTop: 10,
    backgroundColor: "#d1d5db",
  },
  name: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: "bold",
    marginVertical: 16,
    color: "#0f172a",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e3a8a",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  cardRow: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
  },
  editableCardRow: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardText: {
    flex: 1,
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
  },
  cardTextMultiline: {
    minHeight: 60,
  },
  editIconContainer: {
    backgroundColor: "#dbeafe",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
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
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
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
  modalContent: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    color: "#1e293b",
    marginBottom: 24,
  },
  modalInputMultiline: {
    height: 120,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalSaveButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  modalSaveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
