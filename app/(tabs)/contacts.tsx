import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ListRenderItem, // Import for typing the renderItem function
} from "react-native";
// Import the core module and the specific 'Contact' type for type safety
import * as Contacts from "expo-contacts";

// Define a type for our component's props (even if it's empty, it's good practice)
type Props = {};

const App: React.FC<Props> = () => {
  // State to hold the array of contacts. We explicitly type it as an array of Contact objects.
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);

  // State to track permission status. It can be boolean or null initially.
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // State to show a loading indicator. This is a simple boolean.
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // This useEffect hook runs once when the component first loads.
  useEffect(() => {
    (async () => {
      // Ask the user for permission to access their contacts
      const { status } = await Contacts.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []); // The empty array [] means this effect runs only once.

  const getContacts = async (): Promise<void> => {
    if (hasPermission) {
      setIsLoading(true);
      setContacts([]);

      // Fetch contacts. The 'data' variable is automatically typed as Contacts.Contact[]
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
      });

      if (data.length > 0) {
        setContacts(data);
      } else {
        alert("No contacts found.");
      }
      setIsLoading(false);
    } else {
      alert(
        "Permission to access contacts was denied. Please enable it in your phone settings."
      );
    }
  };

  // Explicitly type the renderItem function using ListRenderItem<T>
  // This gives us full type safety and autocomplete for the 'item' object.
  const renderItem: ListRenderItem<Contacts.Contact> = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.name}</Text>

      {/* Type safety ensures item.phoneNumbers is an array (or undefined), so we check it exists */}
      {item.phoneNumbers && item.phoneNumbers[0] && (
        <Text style={styles.details}>Phone: {item.phoneNumbers[0].number}</Text>
      )}

      {item.emails && item.emails[0] && (
        <Text style={styles.details}>Email: {item.emails[0].email}</Text>
      )}
    </View>
  );

  // --- Render logic is the same, but now it's all type-safe ---

  if (hasPermission === null) {
    return (
      <View style={styles.centerContent}>
        <Text>Requesting permission...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.centerContent}>
        <Text>Permission denied.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Expo Contacts (TypeScript)</Text>
      </View>

      {contacts.length === 0 ? (
        <View style={styles.centerContent}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <Button title="Load Contacts" onPress={getContacts} />
          )}
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderItem}
          // keyExtractor={(item) => item.id} // item.id is guaranteed to be a string
          keyExtractor={(item, index) => item.id ?? index.toString()}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
    backgroundColor: "#eef",
  },
  header: {
    padding: 20,
    backgroundColor: "#007AFF",
  },
  headerText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  item: {
    backgroundColor: "#fff",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  details: {
    fontSize: 14,
    color: "gray",
    marginTop: 4,
  },
});

export default App;
