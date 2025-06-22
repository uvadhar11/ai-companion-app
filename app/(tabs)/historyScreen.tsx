import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const callHistory = [
  {
    id: '1',
    name: 'Mom',
    image: require('@/assets/images/mom.png'),
    time: '9:45 PM',
    type: 'Incoming',
  },
  {
    id: '2',
    name: 'Dad',
    image: require('@/assets/images/dad.png'),
    time: '6:20 PM',
    type: 'Outgoing',
  },
  {
    id: '3',
    name: 'Sophie',
    image: require('@/assets/images/woman.png'),
    time: '4:15 PM',
    type: 'Incoming',
  },
];

const HistoryScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Call History</Text>
        </View>

        <Text style={styles.sectionTitle}>Today</Text>

        <View style={styles.companionsList}>
          {callHistory.map((call) => (
            <View key={call.id} style={styles.card}>
              <Image source={call.image} style={styles.profileImage} />

              <View style={styles.cardContent}>
                <View style={styles.rowTop}>
                  <Text style={styles.name}>{call.name}</Text>
                  <Text style={styles.time}>{call.time}</Text>
                </View>

                <Text style={styles.callType}>
                  {call.type === 'Incoming' ? '↙ Incoming' : '↗ Outgoing'}
                </Text>

                <View style={styles.linksRow}>
                  <TouchableOpacity>
                    <Text style={styles.linkText}>Transcript</Text>
                  </TouchableOpacity>

                  <TouchableOpacity>
                    <Text style={styles.linkText}>Audio recording</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    lineHeight: 36,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  companionsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 100,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  time: {
    fontSize: 14,
    color: '#0f172a',
  },
  callType: {
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 8,
  },
  linksRow: {
    flexDirection: 'row',
    gap: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#1e40af',
    textDecorationLine: 'underline',
  },
});
