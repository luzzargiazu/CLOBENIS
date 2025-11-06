import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  Switch, 
  Alert 
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase";
import { updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "expo-router";

export default function EditProfile() {
  const router = useRouter();
  const user = auth.currentUser;
  
  const [username, setUsername] = useState(user?.displayName || "");
  const [photo, setPhoto] = useState(user?.photoURL || "");
  const [newPassword, setNewPassword] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        username,
        isPrivate,
        photo,
      });

      if (newPassword) {
        await updatePassword(user, newPassword);
      }

      Alert.alert("✅ Cambios guardados", "Tu perfil fue actualizado correctamente.");
      router.back();
    } catch (error) {
      console.error("❌ Error al guardar cambios:", error);
      Alert.alert("Error", "No se pudieron guardar los cambios.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Perfil</Text>

      {/* Imagen de perfil */}
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="person-circle-outline" size={90} color="#ccc" />
          </View>
        )}
        <Text style={styles.changePhotoText}>Cambiar foto</Text>
      </TouchableOpacity>

      {/* Nombre de usuario */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre de usuario</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          placeholder="Ingresa tu nombre de usuario"
          placeholderTextColor="#888"
        />
      </View>

      {/* Nueva contraseña */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nueva contraseña</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#888"
          secureTextEntry
        />
      </View>

      {/* Privacidad */}
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Cuenta privada</Text>
        <Switch
          value={isPrivate}
          onValueChange={setIsPrivate}
          thumbColor={isPrivate ? "#48B3AF" : "#ccc"}
          trackColor={{ true: "#A7E399", false: "#dcdcdc" }}
        />
      </View>

      {/* Botón Guardar */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSaveChanges}
        disabled={loading}
      >
        <LinearGradient
          colors={["#476EAE", "#48B3AF"]}
          style={styles.gradient}
        >
          <Ionicons name="save-outline" size={22} color="#fff" />
          <Text style={styles.saveText}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Botón Volver */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>⬅ Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#333",
    marginVertical: 10,
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  changePhotoText: {
    color: "#476EAE",
    fontSize: 14,
    marginTop: 8,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#444",
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    marginVertical: 10,
  },
  saveButton: {
    width: "100%",
    marginTop: 30,
  },
  gradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 20,
  },
  saveText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  backButton: {
    marginTop: 25,
  },
  backText: {
    fontSize: 16,
    color: "#476EAE",
  },
});
