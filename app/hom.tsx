import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  Animated,
  TouchableWithoutFeedback,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";

//  Imagen local dentro de tu carpeta del proyecto
const tennisBallImage = require("../assets/images/pelotatenis.png");

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const ballY = useRef(new Animated.Value(0)).current;
  const [showBall, setShowBall] = useState(false);
  const bounceSound = useRef(new Audio.Sound());

  useEffect(() => {
    // Animación inicial
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Cargar sonido
    (async () => {
      try {
        await bounceSound.current.loadAsync(
          require("../assets/sounds/bounce.mp3")
        );
      } catch (e) {
        console.log("Error cargando sonido:", e);
      }
    })();

    return () => {
      bounceSound.current.unloadAsync();
    };
  }, []);

  const handlePressIn = () => {
    Animated.spring(btnScale, { toValue: 0.9, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(btnScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Rebote realista
  const bounce = (height: number) =>
    new Promise<void>((resolve) => {
      Animated.sequence([
        Animated.timing(ballY, {
          toValue: -height,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ballY, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => resolve());
    });

  const handleEnterApp = async () => {
    setShowBall(true);
    const heights = [20, 10, 20];

    for (let h of heights) {
      ballY.setValue(0);
      await bounce(h);

      try {
        await bounceSound.current.replayAsync();
      } catch (e) {}
    }

    setTimeout(() => {
      router.push("/hom");
    }, 300);
  };

  // Fondo degradado animado
  const [gradientIndex, setGradientIndex] = useState(0);
  const gradientColors: [string, string, ...string[]][] = [
    ["#476EAE", "#48B3AF", "#A7E399", "#F6FF99"],
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setGradientIndex((prev) => (prev + 1) % gradientColors.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <LinearGradient
      colors={gradientColors[gradientIndex]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.logo}>GLOBENIS</Text>
        <Text style={styles.slogan}>Transforma tu juego, transforma tu vida</Text>

        <TouchableWithoutFeedback
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleEnterApp}
        >
          <Animated.View
            style={[styles.btn, { transform: [{ scale: btnScale }] }]}
          >
            <Text style={styles.btnText}>Entrar</Text>
          </Animated.View>
        </TouchableWithoutFeedback>

        {/* ✅ Pelota debajo del botón */}
        {showBall && (
          <Animated.Image
            source={tennisBallImage}
            style={[styles.ball, { transform: [{ translateY: ballY }] }]}
          />
        )}
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  logo: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1.5,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  slogan: {
    fontSize: 16,
    color: "#fff",
    marginTop: 8,
    fontWeight: "400",
    marginBottom: 30,
  },
  btn: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  btnText: {
    color: "#476EAE",
    fontWeight: "700",
    fontSize: 18,
  },
  ball: {
    width: 50,
    height: 50,
    marginTop: 20,
  },
});
