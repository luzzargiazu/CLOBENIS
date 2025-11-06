import React from "react";
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

// Imagen local dentro de tu carpeta del proyecto
const tennisBallImage = require("../assets/images/pelotatenis.png");

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const ballY = useRef(new Animated.Value(0)).current;
  const [showBall, setShowBall] = useState(false);
  const bounceSound = useRef(new Audio.Sound());

  // Para el fade in/out del gradiente
  const gradientOpacity1 = useRef(new Animated.Value(1)).current;
  const gradientOpacity2 = useRef(new Animated.Value(0)).current;
  const [currentGradientIndex, setCurrentGradientIndex] = useState(0);
  const [nextGradientIndex, setNextGradientIndex] = useState(1);

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

  // Efecto de fade in/out para el gradiente
  useEffect(() => {
    const interval = setInterval(() => {
      // Animar fade out del gradiente actual y fade in del siguiente
      Animated.parallel([
        Animated.timing(gradientOpacity1, {
          toValue: 0,
          duration: 1500, // Duración del fade
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(gradientOpacity2, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Después de la animación, swap los índices y reset opacidades
        setCurrentGradientIndex(nextGradientIndex);
        setNextGradientIndex((nextGradientIndex + 1) % gradientColors.length);
        gradientOpacity1.setValue(1);
        gradientOpacity2.setValue(0);
      });
    }, 1800); // Cambia cada 4 segundos
    return () => clearInterval(interval);
  }, [nextGradientIndex]);

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
      router.push("/inicio");
    }, 300);
  };

  // Gradientes con los mismos colores rotados
  const gradientColors: [string, string, ...string[]][] = [
    ["#476EAE", "#48B3AF", "#A7E399", "#e0c25eff"],
    ["#48B3AF", "#A7E399", "#e0c25eff", "#476EAE"],
    ["#A7E399", "#e0c25eff", "#476EAE", "#48B3AF"],
    ["#e0c25eff", "#476EAE", "#48B3AF", "#A7E399"],
  ];

  return (
    <Animated.View style={styles.gradientContainer}>
      {/* Gradiente actual */}
      <Animated.View style={{ ...styles.gradient, opacity: gradientOpacity1 }}>
        <LinearGradient
          colors={gradientColors[currentGradientIndex]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      {/* Gradiente siguiente */}
      <Animated.View style={{ ...styles.gradient, opacity: gradientOpacity2 }}>
        <LinearGradient
          colors={gradientColors[nextGradientIndex]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

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

        {showBall && (
          <Animated.Image
            source={tennisBallImage}
            style={[styles.ball, { transform: [{ translateY: ballY }] }]}
          />
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    alignItems: "center",
    zIndex: 1, // Asegura que el contenido esté encima
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
