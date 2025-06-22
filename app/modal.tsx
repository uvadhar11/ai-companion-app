import { useLocalSearchParams } from 'expo-router';
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Modal() {
  const { phrase, context, number } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://via.placeholder.com/150' }}
        style={{
          width: 150,
          height: 150,
          borderRadius: '100%',
        }}
      />
      <Text style={styles.name}>Mom</Text>
      <Text style={styles.label}>Description</Text>
      <View
        style={{
          backgroundColor: 'white',
          padding: 10,
          borderRadius: 8,
          width: '100%',
        }}
      >
        <Text style={styles.input}>
          Soft-spoken, warm, and calming. She checks in on you and is here for
          you.
        </Text>
      </View>
      <Text style={styles.label}>Safe word</Text>
      <Text style={styles.details}>
        Choose a word or phrase only you know. If you say it during a call, the
        AI will immediately transfer to your emergency contact.
      </Text>
      <TextInput style={styles.input}>
        <TouchableOpacity style={styles.editButton}>
          <Text
            style={{
              color: '#003063',
            }}
          >
            Edit
          </Text>
        </TouchableOpacity>
      </TextInput>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    maxHeight: '50%',
    gap: 20,
    padding: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#003063',
  },
  label: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003063',
    alignSelf: 'flex-start',
  },
  details: {
    color: '#003063',
    alignSelf: 'flex-start',
  },
  input: {
    height: 40,
    backgroundColor: 'white',
    padding: 10,
    paddingRight: 20,
    width: '100%',
    borderRadius: 8,
    position: 'relative',
  },
  editButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    color: '#003063',
    textDecorationLine: 'underline',
    fontSize: 16,
  },
});
