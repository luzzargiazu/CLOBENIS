import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur"; // 👈 agregado para el efecto blur
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
} from "react-native";

// 🖼️ Imagen local (ruta corregida, porque assets está fuera de app)
const loginBackground = require("../assets/images/Login.jpg");

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const router = useRouter();

  const handleLogin = () => {
    console.log("Usuario:", username);
    console.log("Contraseña:", password);
    router.push("/hom");
  };

  return (
    <ImageBackground
      source={loginBackground}
      style={styles.background}
      imageStyle={{ resizeMode: "cover" }}
    >
      {/*  BlurView: efecto difuminado */}
      <BlurView intensity={5} tint="dark" style={styles.blurOverlay}>
        <View style={styles.wrapper}>
          <Text style={styles.title}>Login</Text>

          {/* Usuario */}
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              placeholderTextColor="#fff"
              value={username}
              onChangeText={setUsername}
            />
            <Ionicons
              name="person-circle-outline"
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
              onChangeText={setPassword}
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
              />
              <Text style={styles.rememberText}>Recuerdame</Text>
            </View>

            <TouchableOpacity>
              <Text style={styles.link}>Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          {/* Botón */}
          <TouchableOpacity style={styles.btn} onPress={handleLogin}>
            <Text style={styles.btnText}>Login</Text>
          </TouchableOpacity>

          {/* Register */}
          <View style={styles.registerLink}>
            <Text style={styles.registerText}>
              No tienes una cuenta?{" "}
              <Text style={styles.link} onPress={() => router.push("/register")}>
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
