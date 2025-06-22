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
  FlatList,
  Keyboard,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { router } from "expo-router";

const { width, height } = Dimensions.get("window");

// You'll need to get this from Google Cloud Console
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// interface MapScreenProps {
//   onNavigateBack: () => void;
// }

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

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export default function MapScreen(/*{ onNavigateBack }: MapScreenProps*/) {
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
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Debounced autocomplete search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (destination.length > 2) {
        getPlacePredictions(destination);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [destination]);

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

  const getPlacePredictions = async (input: string) => {
    if (!GOOGLE_MAPS_API_KEY) {
      return;
    }

    try {
      setPredictionLoading(true);
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&key=${GOOGLE_MAPS_API_KEY}`;

      // Add location bias if current location is available
      if (currentLocation) {
        url += `&location=${currentLocation.latitude},${currentLocation.longitude}&radius=50000`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK") {
        setPredictions(data.predictions);
        setShowPredictions(true);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    } catch (error) {
      console.error("Places API error:", error);
      setPredictions([]);
      setShowPredictions(false);
    } finally {
      setPredictionLoading(false);
    }
  };

  const selectPrediction = async (prediction: PlacePrediction) => {
    setDestination(prediction.description);
    setShowPredictions(false);
    setPredictions([]);
    Keyboard.dismiss();

    // Get place details to get coordinates
    try {
      const coords = await getPlaceDetails(prediction.place_id);
      if (coords) {
        setDestinationCoords(coords);
      }
    } catch (error) {
      console.error("Error getting place details:", error);
    }
  };

  const getPlaceDetails = async (placeId: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.result.geometry) {
        const location = data.result.geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
        };
      }
      return null;
    } catch (error) {
      console.error("Place details error:", error);
      return null;
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

    if (!GOOGLE_MAPS_API_KEY) {
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
   - Places API
4. Create credentials (API Key)
5. Add your API key as environment variable:
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here

For development, you can also replace the API key directly in the code.
      `);
      return;
    }

    setLoading(true);
    setShowPredictions(false);
    try {
      let destCoords = destinationCoords;

      // If we don't have coordinates yet, geocode the address
      if (!destCoords) {
        destCoords = await geocodeDestination(destination);
        if (!destCoords) return;
      }

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
    setShowPredictions(false);
    setPredictions([]);
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

  const renderPrediction = ({ item }: { item: PlacePrediction }) => (
    <TouchableOpacity
      style={styles.predictionItem}
      onPress={() => selectPrediction(item)}
    >
      <View style={styles.predictionIcon}>
        <Text style={styles.predictionIconText}>📍</Text>
      </View>
      <View style={styles.predictionText}>
        <Text style={styles.predictionMainText}>
          {item.structured_formatting.main_text}
        </Text>
        <Text style={styles.predictionSecondaryText}>
          {item.structured_formatting.secondary_text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity> */}
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Navigation</Text>
        <TouchableOpacity
          onPress={getCurrentLocation}
          style={styles.refreshButton}
        >
          <Text style={styles.refreshButtonText}>⟳</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter destination address..."
            value={destination}
            onChangeText={(text) => {
              setDestination(text);
              if (text.length > 2) {
                setShowPredictions(true);
              }
            }}
            onSubmitEditing={getDirections}
            returnKeyType="search"
            onFocus={() => {
              if (predictions.length > 0) {
                setShowPredictions(true);
              }
            }}
          />
          {predictionLoading && (
            <View style={styles.searchLoadingIndicator}>
              <ActivityIndicator size="small" color="#6b7280" />
            </View>
          )}
        </View>
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

      {showPredictions && predictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          <FlatList
            data={predictions}
            renderItem={renderPrediction}
            keyExtractor={(item) => item.place_id}
            style={styles.predictionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

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
            onPress={() => setShowPredictions(false)}
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
                // onPress={() => setShowDirections(!showDirections)}
                onPress={() =>
                  router.push({
                    pathname: "/directions",
                    params: {
                      routeInfo: JSON.stringify(routeInfo),
                      routeMode,
                    },
                  })
                }
              >
                {/* <Text style={styles.directionsButtonText}>
                  {showDirections ? "Hide" : "Show"} Steps
                </Text> */}
                <Text style={styles.directionsButtonText}>Show Steps</Text>
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
    backgroundColor: "#f8f9fa", // Match the container background
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    position: "relative",
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
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  refreshButton: {
    padding: 5,
  },
  refreshButtonText: {
    fontSize: 32,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    gap: 10,
    zIndex: 1000,
  },
  searchInputContainer: {
    flex: 1,
    position: "relative",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
    paddingRight: 40,
  },
  searchLoadingIndicator: {
    position: "absolute",
    right: 12,
    top: 12,
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
  predictionsContainer: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: -5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderTopWidth: 0,
    maxHeight: 200,
    zIndex: 999,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  predictionsList: {
    maxHeight: 200,
  },
  predictionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  predictionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  predictionIconText: {
    fontSize: 14,
  },
  predictionText: {
    flex: 1,
  },
  predictionMainText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 2,
  },
  predictionSecondaryText: {
    fontSize: 14,
    color: "#6b7280",
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
    width: "100%",
    height: "55%",
    // flex: 1,
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