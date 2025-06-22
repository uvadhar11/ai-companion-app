import { companions } from '@/app/(tabs)/companionScreen';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CustomizeCompanionScreen() {
  const { id } = useLocalSearchParams();
  
  const navigation = useNavigation();

  useLayoutEffect(() => {
    if (id) {
      const capitalized = (id as string).charAt(0).toUpperCase() + (id as string).slice(1);
      navigation.setOptions({
        title: capitalized,
        headerBackTitle: 'Call AI',
        headerShown: false, // Remove the black header
      });
    }
  }, [id]);

  const companion = companions.find(c => c.id === id);

  if (!companion) return <Text>Companion not found</Text>;

  return (
    <View style={styles.container}>
      {/* Custom back button */}
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
        <Section title="Safe word" content={`"${companion.safeWord}"`} editable />
        <Section title="Emergency contact" content={companion.emergencyContact} editable />
        <Section title="Personal context" content={companion.personalContext} editable />
      </ScrollView>
    </View>
  );
}

function Section({ title, content, editable }: { title: string; content: string; editable?: boolean }) {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.cardRow}>
        <Text style={styles.cardText}>{content}</Text>
        {editable && <Text style={styles.editText}>Edit</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#f1f5f9',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: '#1e40af',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginTop: 10,
    backgroundColor: '#d1d5db',
  },
  name: {
    textAlign: 'center',
    fontSize: 26,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#0f172a',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  cardRow: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
  },
  editText: {
    color: '#3b82f6',
    fontWeight: '600',
    marginLeft: 12,
  },
});