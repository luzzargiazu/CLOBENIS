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
} from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import React from "react";

const loginBackground = require("../assets/images/Olvidado.jpg");

export default function OlvidadoScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const router = useRouter();

  const handleResetPassword = async () => {
    // Resetear mensajes
    setErrorMessage("");
    setSuccessMessage("");

    // Validaciones básicas
    if (!email) {
      setErrorMessage("Por favor ingresa tu email");
      return;
    }

    if (!email.includes("@")) {
      setErrorMessage("Por favor ingresa un email válido");
      return;
    }

    setLoading(true);

    try {
      // Enviar email de restablecimiento
      await sendPasswordResetEmail(auth, email);
      
      setSuccessMessage("Se ha enviado un email para restablecer tu contraseña. Revisa tu bandeja de entrada.");
      setEmail("");
      
      // Opcional: redirigir después de 3 segundos
      setTimeout(() => {
        router.back();
      }, 3000);
      
    } catch (error: any) {
      console.error("Error al enviar email:", error);

      let errorMsg = "Ocurrió un error al enviar el email";

      switch (error.code) {
        case "auth/user-not-found":
          errorMsg = "No existe una cuenta con este email";
          break;
        case "auth/invalid-email":
          errorMsg = "El email no es válido";
          break;
        case "auth/too-many-requests":
          errorMsg = "Demasiados intentos. Intenta más tarde";
          break;
        default:
          errorMsg = error.message || "Error desconocido";
      }

      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={loginBackground}
      style={styles.background}
      imageStyle={{ resizeMode: "cover" }}
    >
      <BlurView intensity={5} tint="dark" style={styles.blurOverlay}>
        <View style={styles.wrapper}>
          {/* Botón volver */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.title}>Restablecer Contraseña</Text>
          <Text style={styles.subtitle}>
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </Text>

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
                setSuccessMessage("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            <Ionicons
              name="mail-outline"
              size={24}
              color="#fff"
              style={styles.icon}
            />
          </View>

          {/* Botón Enviar */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#333" />
                <Text style={styles.btnText}>Enviando...</Text>
              </View>
            ) : (
              <Text style={styles.btnText}>Enviar Enlace</Text>
            )}
          </TouchableOpacity>

          {/* Volver a Login */}
          <View style={styles.registerLink}>
            <Text style={styles.registerText}>
              Ya tienes una cuenta?{" "}
              <Text
                style={styles.link}
                onPress={() => !loading && router.back()}
              >
                Inicia sesión
              </Text>
            </Text>
          </View>
        </View>
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
    alignItems: "center",
    justifyContent: "center",
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
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
  },
  title: {
    fontSize: 26,
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
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
    alignItems: "flex-start",
    gap: 8,
  },
  successText: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  inputBox: {
    width: "100%",
    height: 50,
    marginVertical: 10,
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
    marginTop: 10,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 16,
  },
  registerLink: {
    marginTop: 16,
    alignItems: "center",
  },
  registerText: {
    color: "#fff",
  },
  link: {
    color: "#fff",
    textDecorationLine: "underline",
  },
});