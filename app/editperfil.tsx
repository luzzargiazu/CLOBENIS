import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  Switch, 
  Alert,
  ActivityIndicator
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { auth, db, storage } from "../firebase";
import { updatePassword, updateProfile } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "expo-router";

export default function EditProfile() {
  const router = useRouter();
  const user = auth.currentUser;
  
  const [username, setUsername] = useState("");
  const [photo, setPhoto] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUsername(data.username || user.displayName || "");
        setPhoto(data.photo || data.photoURL || user.photoURL || "");
        setIsPrivate(data.isPrivate || false);
        
        console.log("📋 Datos cargados:");
        console.log("   Username:", data.username);
        console.log("   Photo:", data.photo || data.photoURL);
      }
    } catch (error) {
      console.error("❌ Error al cargar datos:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del perfil.");
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la galería.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      await uploadImage(uri);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) return;
    
    setUploading(true);
    
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const filename = `profile_photos/${user.uid}_${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      setPhoto(downloadURL);
      console.log("✅ Foto subida:", downloadURL);
      Alert.alert("✅ Éxito", "Foto cargada. Presiona 'Guardar cambios' para confirmar.");
      
    } catch (error) {
      console.error("❌ Error al subir imagen:", error);
      Alert.alert("Error", "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    
    // ✅ VALIDACIÓN: Verificar que el username no esté vacío
    if (!username.trim()) {
      Alert.alert("⚠️ Campo requerido", "El nombre de usuario no puede estar vacío.");
      return;
    }

    // ✅ VALIDACIÓN: Verificar longitud del username
    if (username.trim().length < 3) {
      Alert.alert("⚠️ Muy corto", "El nombre debe tener al menos 3 caracteres.");
      return;
    }

    if (username.trim().length > 30) {
      Alert.alert("⚠️ Muy largo", "El nombre no puede tener más de 30 caracteres.");
      return;
    }

    setLoading(true);
    
    try {
      // ✅ PASO 1: Actualizar Firebase Auth PRIMERO (esto persiste entre sesiones)
      await updateProfile(user, {
        displayName: username.trim(),
        photoURL: photo,
      });
      console.log("✅ Firebase Auth actualizado con displayName:", username.trim());

      // ✅ PASO 2: Recargar el usuario para asegurar que los cambios se aplicaron
      await user.reload();
      console.log("✅ Usuario recargado");

      // ✅ PASO 3: Actualizar Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        username: username.trim(),
        isPrivate,
        photo: photo,
        photoURL: photo,
        updatedAt: new Date().toISOString(),
      });
      console.log("✅ Firestore actualizado");

      // ✅ Cambiar contraseña si se proporcionó
      if (newPassword.trim()) {
        if (newPassword.trim().length < 6) {
          Alert.alert("⚠️ Contraseña débil", "Debe tener al menos 6 caracteres.");
          setLoading(false);
          return;
        }
        await updatePassword(user, newPassword);
        console.log("✅ Contraseña actualizada");
      }

      Alert.alert(
        "✅ ¡Listo!", 
        "Tu perfil fue actualizado correctamente.", 
        [
          {
            text: "OK",
            onPress: () => {
              console.log("🔄 Volviendo a inicio...");
              router.back();
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error("❌ Error al guardar:", error);
      
      let errorMsg = "No se pudieron guardar los cambios.";
      
      if (error.code === "auth/requires-recent-login") {
        errorMsg = "⚠️ Por seguridad, cierra sesión y vuelve a iniciar para cambiar la contraseña.";
      } else if (error.code === "auth/weak-password") {
        errorMsg = "⚠️ La contraseña debe tener al menos 6 caracteres.";
      } else if (error.code === "permission-denied") {
        errorMsg = "⚠️ No tienes permisos para actualizar este perfil.";
      }
      
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Perfil</Text>

      {/* Imagen de perfil */}
      <TouchableOpacity 
        style={styles.imageContainer} 
        onPress={pickImage}
        disabled={uploading || loading}
      >
        {uploading ? (
          <View style={styles.placeholderImage}>
            <ActivityIndicator size="large" color="#476EAE" />
            <Text style={styles.uploadingText}>Subiendo...</Text>
          </View>
        ) : photo ? (
          <Image source={{ uri: photo }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="person-circle-outline" size={90} color="#ccc" />
          </View>
        )}
        <View style={styles.cameraIconContainer}>
          <Ionicons name="camera" size={24} color="#fff" />
        </View>
        <Text style={styles.changePhotoText}>
          {uploading ? "Subiendo imagen..." : "Cambiar foto"}
        </Text>
      </TouchableOpacity>

      {/* Nombre de usuario - CON VALIDACIÓN */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre de usuario</Text>
        <TextInput
          value={username}
          onChangeText={(text) => {
            // ✅ Prevenir caracteres especiales problemáticos
            const cleanText = text.replace(/[^\w\sáéíóúñÁÉÍÓÚÑ]/g, '');
            setUsername(cleanText);
          }}
          style={styles.input}
          placeholder="Ingresa tu nombre de usuario"
          placeholderTextColor="#888"
          editable={!loading && !uploading}
          maxLength={30}
        />
        <Text style={styles.helperText}>
          {username.trim().length}/30 caracteres
        </Text>
      </View>

      {/* Nueva contraseña */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nueva contraseña (opcional)</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#888"
          secureTextEntry
          editable={!loading && !uploading}
          maxLength={50}
        />
        <Text style={styles.helperText}>
          Mínimo 6 caracteres. Deja en blanco para no cambiarla
        </Text>
      </View>

      {/* Privacidad */}
      <View style={styles.switchContainer}>
        <View>
          <Text style={styles.label}>Cuenta privada</Text>
          <Text style={styles.helperText}>
            Solo tus amigos verán tu perfil
          </Text>
        </View>
        <Switch
          value={isPrivate}
          onValueChange={setIsPrivate}
          thumbColor={isPrivate ? "#48B3AF" : "#ccc"}
          trackColor={{ true: "#A7E399", false: "#dcdcdc" }}
          disabled={loading || uploading}
        />
      </View>

      {/* Botón Guardar */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSaveChanges}
        disabled={loading || uploading || !username.trim()}
      >
        <LinearGradient
          colors={loading || uploading || !username.trim() ? ["#ccc", "#999"] : ["#476EAE", "#48B3AF"]}
          style={styles.gradient}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.saveText}>Guardando...</Text>
            </>
          ) : (
            <>
              <Ionicons name="save-outline" size={22} color="#fff" />
              <Text style={styles.saveText}>Guardar cambios</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Botón Volver */}
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.backButton}
        disabled={loading || uploading}
      >
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
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#476EAE",
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 25,
    right: 0,
    backgroundColor: "#476EAE",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  changePhotoText: {
    color: "#476EAE",
    fontSize: 14,
    marginTop: 8,
    fontWeight: "600",
  },
  uploadingText: {
    color: "#476EAE",
    fontSize: 12,
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
  helperText: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    marginVertical: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  saveButton: {
    width: "100%",
    marginTop: 30,
  },
  gradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
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
    fontWeight: "600",
  },
});