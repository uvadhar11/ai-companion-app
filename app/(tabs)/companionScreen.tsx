"use client";

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from "react-native";

interface Companion {
  id: string;
  name: string;
  description: string;
  personality: string;
  image: string;
}

interface CompanionSelectionScreenProps {
  onNavigateBack: () => void;
}

const companions: Companion[] = [
  {
    id: "mom",
    name: "Mom",
    description: "Soft-spoken, warm, and calming.",
    personality: "She checks in on you and is here for you.",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    id: "dad",
    name: "Dad",
    description: "Supportive and protective.",
    personality: "He makes sure you feel safe and never alone on the road.",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    id: "sophie",
    name: "Sophie",
    description: "Chill and always down to chat.",
    personality: "She'll distract you with fun topics and honest girl talk.",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    id: "nick",
    name: "Nick",
    description: "Relaxed, funny, and keeps it light.",
    personality: "He'll talk about anything to help you feel more at ease.",
    image: "/placeholder.svg?height=60&width=60",
  },
];

export default function CompanionSelectionScreen({
  onNavigateBack,
}: CompanionSelectionScreenProps) {
  const [selectedCompanion, setSelectedCompanion] = useState<string | null>(
    null
  );

  const handleCompanionSelect = (companionId: string) => {
    setSelectedCompanion(
      companionId === selectedCompanion ? null : companionId
    );
  };

  const handleCall = (type: "outgoing" | "incoming") => {
    const companion = companions.find((c) => c.id === selectedCompanion);
    if (companion) {
      console.log(
        `${type === "outgoing" ? "Calling" : "Receiving call from"} ${
          companion.name
        }`
      );
      // Handle call logic here
    }
  };

  const selectedCompanionData = companions.find(
    (c) => c.id === selectedCompanion
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Choose your AI{"\n"}companion</Text>
        </View>

        <View style={styles.companionsList}>
          {companions.map((companion) => (
            <TouchableOpacity
              key={companion.id}
              style={[
                styles.companionCard,
                selectedCompanion === companion.id && styles.selectedCard,
              ]}
              onPress={() => handleCompanionSelect(companion.id)}
            >
              <Image
                source={{ uri: companion.image }}
                style={styles.companionImage}
              />
              <View style={styles.companionInfo}>
                <Text style={styles.companionName}>{companion.name}</Text>
                <Text style={styles.companionDescription}>
                  {companion.description}
                </Text>
                <Text style={styles.companionPersonality}>
                  {companion.personality}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {selectedCompanion && selectedCompanionData && (
          <View style={styles.callButtonsContainer}>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall("outgoing")}
            >
              <View style={styles.callIcon}>
                <Text style={styles.callIconText}>📞</Text>
              </View>
              <Text style={styles.callButtonText}>
                Call {selectedCompanionData.name}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall("incoming")}
            >
              <View style={styles.callIcon}>
                <Text style={styles.callIconText}>📞</Text>
              </View>
              <Text style={styles.callButtonText}>
                {selectedCompanionData.name} calls you
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={onNavigateBack}>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <Text style={[styles.navText, styles.activeNavText]}>Call AI</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e40af",
    textAlign: "center",
    lineHeight: 36,
  },
  companionsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  companionCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    backgroundColor: "#dbeafe",
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  companionImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: "#e5e7eb",
  },
  companionInfo: {
    flex: 1,
  },
  companionName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  companionDescription: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 4,
  },
  companionPersonality: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  callButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingTop: 30,
    gap: 20,
  },
  callButton: {
    alignItems: "center",
    flex: 1,
  },
  callIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  callIconText: {
    fontSize: 24,
    color: "white",
  },
  callButtonText: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    fontWeight: "500",
  },
  bottomNavigation: {
    flexDirection: "row",
    backgroundColor: "#1e40af",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  activeNavItem: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  navText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  activeNavText: {
    color: "white",
    fontWeight: "600",
  },
});
