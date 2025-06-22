import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";

const { height } = Dimensions.get("window");

export default function DirectionsScreen() {
  const { routeInfo: routeInfoString, routeMode } = useLocalSearchParams();
  const routeInfo = routeInfoString
    ? JSON.parse(routeInfoString as string)
    : null;

  const getManeuverIcon = (maneuver: string): string => {
    const icons: { [key: string]: string } = {
      "turn-left": "↰",
      "turn-right": "↱",
      "turn-slight-left": "↖",
      "turn-slight-right": "↗",
      "turn-sharp-left": "↺",
      "turn-sharp-right": "↻",
      "uturn-left": "↶",
      "uturn-right": "↷",
      merge: "⤴",
      "fork-left": "↖",
      "fork-right": "↗",
      ferry: "⛴",
      "roundabout-left": "↺",
      "roundabout-right": "↻",
      straight: "↑",
    };
    return icons[maneuver] || "↑";
  };

  if (!routeInfo) {
    return (
      <View style={styles.container}>
        <Text style={styles.headerTitle}>No directions found.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Directions</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.routeStats}>
          <Text style={styles.routeDistance}>{routeInfo.distance}</Text>
          <Text style={styles.routeDuration}>
            <Text>{routeInfo.duration} • </Text>
            <Text>{routeMode === "walking" ? "Walking" : "Driving"}</Text>
          </Text>
        </View>
        <ScrollView
          style={styles.directionsContainer}
          showsVerticalScrollIndicator={false}
        >
          {routeInfo.steps.map((step: any, index: number) => (
            <View key={index} style={styles.directionStep}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepIconText}>
                  {getManeuverIcon(step.maneuver)}
                </Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepInstruction}>{step.instruction}</Text>
                <Text style={styles.stepDetails}>
                  <Text>{step.distance} • </Text>
                  <Text>{step.duration}</Text>
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    paddingTop: 40,
    color: "#1e40af",
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    paddingTop: 40,
    fontSize: 18,
    alignSelf: "center",
    fontWeight: "bold",
    color: "#1f2937",
  },
  routeStats: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  routeDistance: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  routeDuration: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  directionsContainer: {
    maxHeight: height * 0.7,
    paddingHorizontal: 20,
  },
  directionStep: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    alignItems: "flex-start",
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    marginTop: 2,
  },
  stepIconText: {
    fontSize: 16,
    color: "#1e40af",
  },
  stepInfo: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 15,
    color: "#1f2937",
    fontWeight: "500",
    marginBottom: 4,
  },
  stepDetails: {
    fontSize: 13,
    color: "#6b7280",
  },
});
