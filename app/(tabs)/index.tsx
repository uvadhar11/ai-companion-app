import { HelloWave } from "@/components/HelloWave";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Image } from "expo-image";
"use client";

import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";

const { width, height } = Dimensions.get("window");

// You'll need to get this from Google Cloud Console
const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE";

interface MapScreenProps {
  onNavigateBack: () => void;
}

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver: string;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
}

interface RouteInfo {
  distance: string;
  duration: string;
  steps: RouteStep[];
  coordinates: { latitude: number; longitude: number }[];
  bounds: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

export default function MapScreen({ onNavigateBack }: MapScreenProps) {
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [destination, setDestination] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routeMode, setRouteMode] = useState<"driving" | "walking">("driving");
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required for navigation"
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to get current location");
      console.error("Location error:", error);
    } finally {
      setLocationLoading(false);
    }
  };

  const geocodeDestination = async (address: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const coords = {
          latitude: location.lat,
          longitude: location.lng,
        };
        setDestinationCoords(coords);
        return coords;
      } else {
        throw new Error(data.error_message || "Address not found");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      Alert.alert("Error", "Could not find the destination address");
      return null;
    }
  };

  const getDirections = async () => {
    if (!currentLocation || !destination.trim()) {
      Alert.alert("Error", "Please enter a destination");
      return;
    }

    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "YOUR_API_KEY_HERE") {
      Alert.alert(
        "API Key Required",
        "Please add your Google Maps API key to use real navigation. Check the console for setup instructions."
      );
      console.log(`
🔑 GOOGLE MAPS API SETUP REQUIRED:

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable these APIs:
   - Maps JavaScript API
   - Directions API
   - Geocoding API
   - Places API (optional)
4. Create credentials (API Key)
5. Add your API key as environment variable:
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here

For development, you can also replace the API key directly in the code.
      `);
      return;
    }

    setLoading(true);
    try {
      const destCoords = await geocodeDestination(destination);
      if (!destCoords) return;

      const route = await getGoogleDirections(
        currentLocation,
        destCoords,
        routeMode
      );
      if (route) {
        setRouteInfo(route);

        // Fit map to show the route
        if (mapRef.current && route.bounds) {
          mapRef.current.fitToCoordinates(
            [
              {
                latitude: route.bounds.southwest.lat,
                longitude: route.bounds.southwest.lng,
              },
              {
                latitude: route.bounds.northeast.lat,
                longitude: route.bounds.northeast.lng,
              },
            ],
            {
              edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
              animated: true,
            }
          );
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to calculate route");
      console.error("Route error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGoogleDirections = async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    mode: "driving" | "walking"
  ): Promise<RouteInfo | null> => {
    try {
      const travelMode = mode === "driving" ? "driving" : "walking";
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=${travelMode}&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        // Decode polyline points
        const coordinates = decodePolyline(route.overview_polyline.points);

        // Process steps
        const steps: RouteStep[] = leg.steps.map((step: any) => ({
          instruction: stripHtmlTags(step.html_instructions),
          distance: step.distance.text,
          duration: step.duration.text,
          maneuver: step.maneuver || "straight",
          startLocation: step.start_location,
          endLocation: step.end_location,
        }));

        return {
          distance: leg.distance.text,
          duration: leg.duration.text,
          steps,
          coordinates,
          bounds: route.bounds,
        };
      } else {
        throw new Error(data.error_message || "No route found");
      }
    } catch (error) {
      console.error("Google Directions error:", error);
      Alert.alert("Error", "Failed to get directions from Google Maps");
      return null;
    }
  };

  const decodePolyline = (
    encoded: string
  ): { latitude: number; longitude: number }[] => {
    const points: { latitude: number; longitude: number }[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b: number;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  const stripHtmlTags = (html: string): string => {
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
  };

  const clearRoute = () => {
    setDestination("");
    setDestinationCoords(null);
    setRouteInfo(null);
    setShowDirections(false);
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Navigation</Text>
        <TouchableOpacity
          onPress={getCurrentLocation}
          style={styles.refreshButton}
        >
          <Text style={styles.refreshButtonText}>📍</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter destination address..."
          value={destination}
          onChangeText={setDestination}
          onSubmitEditing={getDirections}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={getDirections}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>Go</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            routeMode === "driving" && styles.activeModeButton,
          ]}
          onPress={() => setRouteMode("driving")}
        >
          <Text
            style={[
              styles.modeButtonText,
              routeMode === "driving" && styles.activeModeButtonText,
            ]}
          >
            🚗 Drive
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            routeMode === "walking" && styles.activeModeButton,
          ]}
          onPress={() => setRouteMode("walking")}
        >
          <Text
            style={[
              styles.modeButtonText,
              routeMode === "walking" && styles.activeModeButtonText,
            ]}
          >
            🚶 Walk
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        {currentLocation && !locationLoading ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
            followsUserLocation={false}
          >
            <Marker
              coordinate={currentLocation}
              title="Your Location"
              description="Current position"
              pinColor="blue"
            />
            {destinationCoords && (
              <Marker
                coordinate={destinationCoords}
                title="Destination"
                description={destination}
                pinColor="red"
              />
            )}
            {routeInfo && (
              <Polyline
                coordinates={routeInfo.coordinates}
                strokeColor={routeMode === "driving" ? "#3b82f6" : "#22c55e"}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
            )}
          </MapView>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1e40af" />
            <Text style={styles.loadingText}>
              {locationLoading ? "Getting your location..." : "Loading map..."}
            </Text>
          </View>
        )}
      </View>

      {routeInfo && (
        <View style={styles.routeInfoContainer}>
          <View style={styles.routeHeader}>
            <View style={styles.routeStats}>
              <Text style={styles.routeDistance}>{routeInfo.distance}</Text>
              <Text style={styles.routeDuration}>
                {routeInfo.duration} •{" "}
                {routeMode === "driving" ? "Driving" : "Walking"}
              </Text>
            </View>
            <View style={styles.routeActions}>
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={() => setShowDirections(!showDirections)}
              >
                <Text style={styles.directionsButtonText}>
                  {showDirections ? "Hide" : "Show"} Steps
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearButton} onPress={clearRoute}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showDirections && (
            <ScrollView
              style={styles.directionsContainer}
              showsVerticalScrollIndicator={false}
            >
              {routeInfo.steps.map((step, index) => (
                <View key={index} style={styles.directionStep}>
                  <View style={styles.stepIcon}>
                    <Text style={styles.stepIconText}>
                      {getManeuverIcon(step.maneuver)}
                    </Text>
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={styles.stepInstruction}>
                      {step.instruction}
                    </Text>
                    <Text style={styles.stepDetails}>
                      {step.distance} • {step.duration}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </SafeAreaView>
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
    color: "#1e40af",
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  refreshButton: {
    padding: 5,
  },
  refreshButtonText: {
    fontSize: 18,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  searchButton: {
    backgroundColor: "#1e40af",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 60,
  },
  searchButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  modeSelector: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "white",
    gap: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  activeModeButton: {
    backgroundColor: "#1e40af",
    borderColor: "#1e40af",
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  activeModeButtonText: {
    color: "white",
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  routeInfoContainer: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    maxHeight: height * 0.4,
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  routeStats: {
    flex: 1,
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
  routeActions: {
    flexDirection: "row",
    gap: 10,
  },
  directionsButton: {
    backgroundColor: "#1e40af",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  directionsButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  clearButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  directionsContainer: {
    maxHeight: 200,
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
