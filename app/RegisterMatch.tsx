import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { useRouter } from "expo-router";

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

      // ⚙️ Aseguramos que los campos existan
      const matchesPlayed = (userData.matchesPlayed || 0) + 1;
      const wins = result === "win" ? (userData.wins || 0) + 1 : userData.wins || 0;
      const loses = result === "loss" ? (userData.loses || 0) + 1 : (userData.loses || 0);

      // 🧮 Experiencia y nivel
      const xpGained = result === "win" ? 50 : 20;
      let xp = (userData.xp || 0) + xpGained;
      let level = userData.level || 1;
      let xpToNextLevel = userData.xpToNextLevel || 100;

      if (xp >= xpToNextLevel) {
        level++;
        xp -= xpToNextLevel;
        xpToNextLevel += 50;
      }

      // 💾 Guardamos también las fechas de actualización
      await updateDoc(userRef, {
        matchesPlayed,
        wins,
        loses, // 👈 ahora siempre se guarda
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar Partido</Text>
      <Text style={styles.subtitle}>¿Cómo fue tu último partido?</Text>

      <TouchableOpacity
        style={styles.button}
        disabled={loading}
        onPress={() => handleRegisterMatch("win")}
      >
        <LinearGradient colors={["#48B3AF", "#85cf75"]} style={styles.gradient}>
          <Ionicons name="trophy-outline" size={22} color="#fff" />
          <Text style={styles.buttonText}>Gané el partido</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        disabled={loading}
        onPress={() => handleRegisterMatch("loss")}
      >
        <LinearGradient colors={["#ff6666", "#ff9966"]} style={styles.gradient}>
          <Ionicons name="close-circle-outline" size={22} color="#fff" />
          <Text style={styles.buttonText}>Perdí el partido</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>⬅ Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 30,
  },
  button: {
    width: "80%",
    marginVertical: 10,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  backButton: {
    marginTop: 30,
  },
  backText: {
    fontSize: 16,
    color: "#476EAE",
  },
});
