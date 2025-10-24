import { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

// ✅ Tu logo aquí
const logoImage = require("../assets/images/logo.png");

export default function InicioScreen() {
  const [activeTab, setActiveTab] = useState("inicio");
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Datos de noticias
  const newsItems: {
    id: number;
    title: string;
    description: string;
    color: [string, string, ...string[]];
  }[] = [
    {
      id: 1,
      title: "¡Torneo de verano próximamente!",
      description: "Inscripciones abiertas hasta el 30 de noviembre",
      color: ["#476EAE", "#48B3AF"],
    },
    {
      id: 2,
      title: "Nueva cancha disponible",
      description: "Reserva ahora en el Club Central",
      color: ["#48B3AF", "#A7E399"],
    },
    {
      id: 3,
      title: "Ranking actualizado",
      description: "Revisa tu posición en el ranking mensual",
      color: ["#A7E399", "#e0c25eff"],
    },
  ];

  // Auto-scroll cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => {
        const nextIndex = (prev + 1) % newsItems.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * (width - 15),
          animated: true,
        });
        return nextIndex;
      });
    }, 5000); // 30 segundos

    return () => clearInterval(interval);
  }, []);

  // Datos de ejemplo para el feed
  const feedItems = [
    { id: 1, user: "Carlos M.", action: "ganó un partido", time: "Hace 2h" },
    { id: 2, user: "Ana L.", action: "reservó una cancha", time: "Hace 4h" },
    { id: 3, user: "Miguel R.", action: "subió de ranking", time: "Hace 6h" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "inicio":
        return (
          <ScrollView style={styles.feedContainer}>
            <Text style={styles.sectionTitle}>Noticias</Text>
            
            {/* Carrusel de Noticias */}
            <View style={styles.newsCarouselContainer}>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(event) => {
                  const newIndex = Math.round(
                    event.nativeEvent.contentOffset.x / (width - 32)
                  );
                  setCurrentNewsIndex(newIndex);
                }}
              >
                {newsItems.map((news) => (
                  <LinearGradient
                    key={news.id}
                    colors={news.color}
                    style={styles.newsCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.newsTitle}>{news.title}</Text>
                    <Text style={styles.newsDescription}>
                      {news.description}
                    </Text>
                  </LinearGradient>
                ))}
              </ScrollView>
              
              {/* Indicadores de puntos */}
              <View style={styles.dotsContainer}>
                {newsItems.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      currentNewsIndex === index && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            </View>

            <Text style={styles.sectionTitle}>Actividad de amigos</Text>
            
            {feedItems.map((item) => (
              <View key={item.id} style={styles.feedItem}>
                <View style={styles.feedAvatar}>
                  <Text style={styles.avatarText}>
                    {item.user.charAt(0)}
                  </Text>
                </View>
                <View style={styles.feedContent}>
                  <Text style={styles.feedUser}>{item.user}</Text>
                  <Text style={styles.feedAction}>{item.action}</Text>
                  <Text style={styles.feedTime}>{item.time}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        );
      case "buscar":
        return (
          <View style={styles.centerContent}>
            <Text style={styles.comingSoon}>🔍</Text>
            <Text style={styles.comingSoonText}>Buscar jugadores y canchas</Text>
          </View>
        );
      case "partidos":
        return (
          <View style={styles.centerContent}>
            <Text style={styles.comingSoon}>🎾</Text>
            <Text style={styles.comingSoonText}>Tus próximos partidos</Text>
          </View>
        );
      case "ranking":
        return (
          <View style={styles.centerContent}>
            <Text style={styles.comingSoon}>🏆</Text>
            <Text style={styles.comingSoonText}>Rankings y estadísticas</Text>
          </View>
        );
      case "perfil":
        return (
          <View style={styles.centerContent}>
            <Text style={styles.comingSoon}>👤</Text>
            <Text style={styles.comingSoonText}>Chatsport</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* ✅ Logo como imagen PNG */}
          <Image 
            source={logoImage} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.greetingText}>Hola, usuario</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <LinearGradient
            colors={["#476EAE", "#48B3AF"]}
            style={styles.profileGradient}
          >
            <Text style={styles.profileText}>TU</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Contenido principal */}
      <View style={styles.mainContent}>{renderContent()}</View>

      {/* Barra de navegación inferior */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("inicio")}
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab === "inicio" && styles.tabIconActive,
            ]}
          >
            🏠
          </Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "inicio" && styles.tabLabelActive,
            ]}
          >
            Inicio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("buscar")}
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab === "buscar" && styles.tabIconActive,
            ]}
          >
            🔍
          </Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "buscar" && styles.tabLabelActive,
            ]}
          >
            Buscar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("partidos")}
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab === "partidos" && styles.tabIconActive,
            ]}
          >
            🎾
          </Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "partidos" && styles.tabLabelActive,
            ]}
          >
            Partidos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("ranking")}
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab === "ranking" && styles.tabIconActive,
            ]}
          >
            🏆
          </Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "ranking" && styles.tabLabelActive,
            ]}
          >
            Ranking
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("perfil")}
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab === "perfil" && styles.tabIconActive,
            ]}
          >
            👤
          </Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "perfil" && styles.tabLabelActive,
            ]}
          >
            Chatsport
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoImage: {    //tamano 40 a 45
    width: 45,
    height: 45,
    marginRight: 10,  
  },
  greetingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#476EAE",
    letterSpacing: 1,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  profileGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  profileText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  mainContent: {
    flex: 1,
  },
  feedContainer: {
    flex: 1,
    padding: 16,
  },
  newsCarouselContainer: {
    marginBottom: 20,
  },
  newsCard: {
    width: width - 32,
    height: 150,
    borderRadius: 16,
    padding: 20,
    marginRight: 0,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  newsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  newsDescription: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
    opacity: 0.95,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#476EAE",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  feedItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  feedAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#476EAE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  feedContent: {
    flex: 1,
    justifyContent: "center",
  },
  feedUser: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  feedAction: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  feedTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  comingSoon: {
    fontSize: 60,
    marginBottom: 16,
  },
  comingSoonText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "500",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#476EAE",
    fontWeight: "700",
  },
});