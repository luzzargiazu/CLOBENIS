import React, { useState } from "react";
import { View, Text, Alert, TouchableWithoutFeedback, Dimensions, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

export default function RegisterMatch() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRegisterMatch = async (result: "win" | "loss") => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "No hay usuario autenticado.");
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        Alert.alert("Error", "No se encontraron datos del usuario.");
        return;
      }

      const userData = userSnap.data();
      const matchesPlayed = (userData.matchesPlayed || 0) + 1;
      const wins = result === "win" ? (userData.wins || 0) + 1 : userData.wins || 0;
      const loses = result === "loss" ? (userData.loses || 0) + 1 : userData.loses || 0;

      const xpGained = result === "win" ? 50 : 20;
      let xp = (userData.xp || 0) + xpGained;
      let level = userData.level || 1;
      let xpToNextLevel = userData.xpToNextLevel || 100;

      if (xp >= xpToNextLevel) {
        level++;
        xp -= xpToNextLevel;
        xpToNextLevel += 50;
      }

      await updateDoc(userRef, {
        matchesPlayed,
        wins,
        loses,
        xp,
        level,
        xpToNextLevel,
        updatedAt: new Date().toISOString(),
      });

      Alert.alert(
        "✅ Partido registrado",
        result === "win"
          ? "¡Felicitaciones por la victoria! +50 XP 🏆"
          : "Partido registrado como derrota. +20 XP 💪"
      );

      router.back();
    } catch (error) {
      console.error("❌ Error al registrar partido:", error);
      Alert.alert("Error", "No se pudo registrar el partido.");
    } finally {
      setLoading(false);
    }
  };

  // ⚡ Componente de botón animado
  const AnimatedButton = ({ label, colors, icon, onPress }: any) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <TouchableWithoutFeedback
        onPressIn={() => (scale.value = withSpring(0.95))}
        onPressOut={() => (scale.value = withSpring(1))}
        onPress={onPress}
        disabled={loading}
      >
        <Animated.View style={[styles.resultButton, animatedStyle]}>
          <LinearGradient colors={colors} style={styles.gradient}>
            <Ionicons name={icon} size={22} color="#fff" />
            <Text style={styles.buttonText}>{label}</Text>
          </LinearGradient>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registrar Partido</Text>
        <Text style={styles.subtitle}>¿Cómo fue tu último partido?</Text>
      </View>

      <AnimatedButton
        label="Gané el partido"
        colors={["#48B3AF", "#85cf75"]}
        icon="trophy-outline"
        onPress={() => handleRegisterMatch("win")}
      />

      <AnimatedButton
        label="Perdí el partido"
        colors={["#ff6666", "#ff9966"]}
        icon="close-circle-outline"
        onPress={() => handleRegisterMatch("loss")}
      />

      <TouchableWithoutFeedback onPress={() => router.back()}>
        <View style={styles.backButton}>
          <Text style={styles.backText}>Volver</Text>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  resultButton: {
    width: width * 0.8,
    borderRadius: 20,
    overflow: "hidden",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  backButton: {
    marginTop: 40,
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  backText: {
    fontSize: 16,
    color: "#476EAE",
    fontWeight: "600",
  },
});
