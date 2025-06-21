import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Dimensions,
} from "react-native";

const { width, height } = Dimensions.get("window");

interface WelcomeScreenProps {
  onNavigateToLogin: () => void;
}

export default function WelcomeScreen({
  onNavigateToLogin,
}: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateToLogin}>
          <Text style={styles.loginLink}>Log In</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <Image
            // source={{
            //   uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-rQ5cUj2YWwwOEwsX6fpMC2STJ7bYWr.png",
            // }}
            source={require("@/assets/images/homeScreenImage.png")}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>CompanionAI</Text>
          <Text style={styles.subtitle}>
            Always here to accompany you{"\n"}on any ride or walk!
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={onNavigateToLogin}>
          <Text style={styles.buttonText}>Let&#39;s Talk!</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  loginLink: {
    color: "#1e40af",
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  illustration: {
    width: width * 0.8,
    height: height * 0.4,
    maxWidth: 300,
    maxHeight: 300,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#003063",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#003063",
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 25,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
