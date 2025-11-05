import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import React from "react";

const registerBackground = require("../assets/images/Registro.jpeg");

export default function RegisterScreen() {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const router = useRouter();

  const handleRegister = async (): Promise<void> => {
    // Resetear mensajes
    setErrorMessage("");
    setSuccessMessage("");

    // Validaciones
    if (!username || !email || !password || !confirmPassword) {
      setErrorMessage("Por favor completa todos los campos");
      return;
    }

    if (username.length < 3) {
      setErrorMessage("El usuario debe tener al menos 3 caracteres");
      return;
    }

    if (!email.includes("@")) {
      setErrorMessage("Por favor ingresa un email válido");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      // Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Actualizar el perfil con el nombre de usuario
      await updateProfile(user, {
        displayName: username,
      });

      // Guardar datos adicionales en Firestore
    // Guardar datos adicionales en Firestore con estadísticas iniciales
     await setDoc(doc(db, "users", user.uid), {
     username: username,
     email: email,
     level: 1,
     xp: 0,
     xpToNextLevel: 100,
     matchesPlayed: 0,
     wins: 0,
     loses: 0,
     createdAt: new Date().toISOString(),
     updatedAt: new Date().toISOString(),
});
      // Mostrar éxito
      setSuccessMessage("¡Cuenta creada exitosamente!");
      
      // Esperar 1.5 segundos y redirigir
      setTimeout(() => {
        router.replace("/hom");
      }, 1500);
    } catch (error: any) {
      console.error("Error al registrar:", error);

      let errorMsg = "Ocurrió un error al crear la cuenta";

      switch (error.code) {
        case "auth/email-already-in-use":
          errorMsg = "Este email ya está registrado";
          break;
        case "auth/invalid-email":
          errorMsg = "El email no es válido";
          break;
        case "auth/operation-not-allowed":
          errorMsg = "Operación no permitida";
          break;
        case "auth/weak-password":
          errorMsg = "La contraseña es muy débil";
          break;
        default:
          errorMsg = error.message || "Error desconocido";
      }

      setErrorMessage(errorMsg);
      setLoading(false);
    }
  };

  const handleBackToLogin = (): void => {
    router.back();
  };

  return (
    <ImageBackground
      source={registerBackground}
      style={styles.background}
      imageStyle={{ resizeMode: "cover" }}
    >
      <BlurView intensity={5} tint="dark" style={styles.blurOverlay}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.wrapper}>
            <Text style={styles.title}>Registro</Text>

            {/* Mensaje de error */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={20} color="#fff" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Mensaje de éxito */}
            {successMessage ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            {/* Usuario */}
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="Usuario"
                placeholderTextColor="#fff"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setErrorMessage("");
                }}
                autoCapitalize="none"
                editable={!loading && !successMessage}
              />
              <Ionicons
                name="person-circle-outline"
                size={24}
                color="#fff"
                style={styles.icon}
              />
            </View>

            {/* Email */}
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#fff"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading && !successMessage}
              />
              <Ionicons
                name="mail-outline"
                size={24}
                color="#fff"
                style={styles.icon}
              />
            </View>

            {/* Contraseña */}
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#fff"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMessage("");
                }}
                editable={!loading && !successMessage}
              />
              <Ionicons
                name="lock-closed-outline"
                size={24}
                color="#fff"
                style={styles.icon}
              />
            </View>

            {/* Confirmar Contraseña */}
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="Confirmar contraseña"
                placeholderTextColor="#fff"
                secureTextEntry
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrorMessage("");
                }}
                editable={!loading && !successMessage}
              />
              <Ionicons
                name="lock-closed-outline"
                size={24}
                color="#fff"
                style={styles.icon}
              />
            </View>

            {/* Botón Registro */}
            <TouchableOpacity
              style={[
                styles.btn, 
                loading && styles.btnDisabled,
                successMessage && styles.btnSuccess
              ]}
              onPress={handleRegister}
              disabled={loading || !!successMessage}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#333" />
                  <Text style={styles.loadingText}>Creando cuenta...</Text>
                </View>
              ) : successMessage ? (
                <Text style={styles.btnText}>✓ Registrado</Text>
              ) : (
                <Text style={styles.btnText}>Registrarse</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginLink}>
              <Text style={styles.loginText}>
                ¿Ya tienes una cuenta?{" "}
                <Text style={styles.link} onPress={handleBackToLogin}>
                  Inicia sesión
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  blurOverlay: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  wrapper: {
    width: 340,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  title: {
    fontSize: 30,
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 20,
  },
  errorBox: {
    width: "100%",
    backgroundColor: "rgba(244, 67, 54, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.5)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },
  successBox: {
    width: "100%",
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.5)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  successText: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },
  inputBox: {
    width: "100%",
    height: 50,
    marginVertical: 8,
    position: "relative",
  },
  input: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 40,
    fontSize: 16,
    color: "#fff",
    paddingHorizontal: 20,
    paddingRight: 45,
  },
  icon: {
    position: "absolute",
    right: 16,
    top: 13,
  },
  btn: {
    width: "100%",
    height: 45,
    backgroundColor: "#fff",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnSuccess: {
    backgroundColor: "#4CAF50",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 16,
  },
  btnText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 16,
  },
  loginLink: {
    marginTop: 16,
    alignItems: "center",
  },
  loginText: {
    color: "#fff",
  },
  link: {
    color: "#fff",
    textDecorationLine: "underline",
  },
});