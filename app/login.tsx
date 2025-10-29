import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Checkbox from "expo-checkbox";
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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const loginBackground = require("../assets/images/Login.jpg");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();

  const handleLogin = async () => {
    // Resetear mensaje de error
    setErrorMessage("");

    // Validaciones básicas
    if (!email || !password) {
      setErrorMessage("Por favor completa todos los campos");
      return;
    }

    if (!email.includes("@")) {
      setErrorMessage("Por favor ingresa un email válido");
      return;
    }

    setLoading(true);

    try {
      // Iniciar sesión con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("Usuario autenticado:", user.uid);
      console.log("Email:", user.email);
      console.log("Nombre:", user.displayName);

      // Redirigir a la pantalla principal
      router.replace("/hom");
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);

      let errorMsg = "Ocurrió un error al iniciar sesión";

      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
          errorMsg = "Email o contraseña incorrectos";
          break;
        case "auth/invalid-email":
          errorMsg = "El email no es válido";
          break;
        case "auth/user-disabled":
          errorMsg = "Esta cuenta ha sido deshabilitada";
          break;
        case "auth/too-many-requests":
          errorMsg = "Demasiados intentos. Intenta más tarde";
          break;
        default:
          errorMsg = error.message || "Error desconocido";
      }

      setErrorMessage(errorMsg);
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
          <Text style={styles.title}>Login</Text>

          {/* Mensaje de error */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color="#fff" />
              <Text style={styles.errorText}>{errorMessage}</Text>
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
              editable={!loading}
            />
            <Ionicons
              name="lock-closed-outline"
              size={24}
              color="#fff"
              style={styles.icon}
            />
          </View>

          {/* Remember / Forgot */}
          <View style={styles.rememberForgot}>
            <View style={styles.rememberRow}>
              <Checkbox
                value={remember}
                onValueChange={setRemember}
                color={remember ? "#fff" : undefined}
                disabled={loading}
              />
              <Text style={styles.rememberText}>Recuerdame</Text>
            </View>

            <TouchableOpacity disabled={loading}>
              <Text style={styles.link}>Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          {/* Botón Login */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#333" />
                <Text style={styles.btnText}>Iniciando sesión...</Text>
              </View>
            ) : (
              <Text style={styles.btnText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Register */}
          <View style={styles.registerLink}>
            <Text style={styles.registerText}>
              No tienes una cuenta?{" "}
              <Text
                style={styles.link}
                onPress={() => !loading && router.push("/register")}
              >
                Registrate
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
  rememberForgot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberText: {
    color: "#fff",
    marginLeft: 6,
  },
  link: {
    color: "#fff",
    textDecorationLine: "underline",
  },
  btn: {
    width: "100%",
    height: 45,
    backgroundColor: "#fff",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
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
});