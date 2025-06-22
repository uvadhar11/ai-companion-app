import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function CustomizeCompanion() {
  const { id } = useLocalSearchParams();

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        Customize Companion: {id}
      </Text>
      {/* Add form inputs or UI here */}
    </View>
  );
}
