"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { GoogleMapsService } from "../services/GoogleMapsService"; // Adjust the import path as needed

interface PlaceAutocompleteProps {
  onPlaceSelected: (place: {
    description: string;
    coordinates?: { latitude: number; longitude: number };
  }) => void;
  placeholder?: string;
  currentLocation?: { latitude: number; longitude: number };
}

interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export default function PlaceAutocomplete({
  onPlaceSelected,
  placeholder = "Enter destination...",
  currentLocation,
}: PlaceAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length > 2) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const fetchSuggestions = async (input: string) => {
    try {
      setLoading(true);
      const results = await GoogleMapsService.getPlaceAutocomplete(
        input,
        currentLocation
      );
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Autocomplete error:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = async (suggestion: PlaceSuggestion) => {
    setQuery(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);

    try {
      const coordinates = await GoogleMapsService.geocodeAddress(
        suggestion.description
      );
      onPlaceSelected({
        description: suggestion.description,
        coordinates,
      });
    } catch (error) {
      console.error("Error getting place coordinates:", error);
      onPlaceSelected({
        description: suggestion.description,
      });
    }
  };

  const renderSuggestion = ({ item }: { item: PlaceSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Text style={styles.mainText}>{item.mainText}</Text>
      <Text style={styles.secondaryText}>{item.secondaryText}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={query}
        onChangeText={setQuery}
        onFocus={() => query.length > 2 && setShowSuggestions(true)}
        returnKeyType="search"
      />
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.placeId}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  suggestionsContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    maxHeight: 200,
    zIndex: 1000,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  mainText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 2,
  },
  secondaryText: {
    fontSize: 14,
    color: "#6b7280",
  },
});
