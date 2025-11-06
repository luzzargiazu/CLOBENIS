import { GoogleGenerativeAI } from "@google/generative-ai";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { Linking } from "react-native";
import { GEMINI_API_KEY } from './config';
import { styles } from './inicio.styles';
import TennisCourtMap from './maps';
import Amigos from "./Amigos";
import React from "react";
// 🔥 IMPORTS PARA FIREBASE AUTH
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get("window");

// Inicializa la IA con tu API key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Logo
const logoImage = require("../assets/images/logo.png");

// Tipos para el chatbot
interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function InicioScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("inicio");
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Estado del menú de usuario
  const [showUserMenu, setShowUserMenu] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  
  // Datos del usuario
  const [userData, setUserData] = useState({
    name: "Usuario",
    initials: "U",
    level: 0,
    xp: 0,
    xpToNextLevel: 0,
    memberSince: "Enero 2024",
    matchesPlayed: 0,
    wins: 0,
    loses: 0,
  });
  
  // Estados del chatbot
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "¡Hola! 👋 Soy tu asistente de tenis con IA. Puedo ayudarte con técnicas, nutrición y consejos personalizados para mejorar tu juego. ¿En qué puedo ayudarte hoy?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

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
      description: "Reserva ahora en la Facdef",
      color: ["#48B3AF", "#85cf75ff"],
    },
    {
      id: 3,
      title: "NOTICIA 3",
      description: "...",
      color: ["#85cf75ff", "#e0c25eff"],
    },
  ];

  // 🔥 Cargar datos del usuario autenticado
 // 🔥 Cargar datos del usuario autenticado desde Firestore
useEffect(() => {
  let unsubscribeFirestore: (() => void) | undefined;

  const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // 📌 LISTENER EN TIEMPO REAL - Se actualiza automáticamente
        const userDocRef = doc(db, "users", user.uid);
        
        // onSnapshot escucha cambios en tiempo real
        unsubscribeFirestore = onSnapshot(userDocRef, (docSnap: { exists: () => any; data: () => any; }) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const displayName = user.displayName || userData.username || "Usuario";
            const initials = displayName
              .split(" ")
              .map((word: string) => word.charAt(0).toUpperCase())
              .slice(0, 2)
              .join("");
            
            // Calcular la fecha de registro
            const createdDate = userData.createdAt 
              ? new Date(userData.createdAt).toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'long' 
                })
              : "Enero 2024";
            
            // ✅ Actualiza el estado cada vez que cambian los datos
            setUserData({
              name: displayName,
              initials: initials || "U",
              level: userData.level || 1,
              xp: userData.xp || 0,
              xpToNextLevel: userData.xpToNextLevel || 100,
              memberSince: createdDate,
              matchesPlayed: userData.matchesPlayed || 0,
              wins: userData.wins || 0,
              loses: userData.loses || 0,
            });
            
            console.log("✅ Datos del usuario actualizados desde Firestore:", displayName);
          } else {
            console.log("⚠️ No se encontraron datos del usuario en Firestore");
          }
        }, (error: any) => {
          console.error("❌ Error al escuchar cambios del usuario:", error);
        });
        
      } catch (error) {
        console.error("❌ Error al configurar listener:", error);
      }
    } else {
      console.log("⚠️ No hay usuario autenticado");
      // Limpia el listener si no hay usuario
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    }
  });

  // 🧹 Limpieza: cancela ambos listeners cuando el componente se desmonte
  return () => {
    unsubscribeAuth();
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}, []);

  // Auto-scroll cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => {
        const nextIndex = (prev + 1) % newsItems.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * width,
          animated: true,
        });
        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Animación del menú de usuario
  useEffect(() => {
    if (showUserMenu) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [showUserMenu]);

  // Datos de ejemplo para el feed
  const feedItems = [
    { id: 1, user: "Carlos M.", action: "ganó un partido", time: "Hace 2h" },
    { id: 2, user: "Ana L.", action: "reservó una cancha", time: "Hace 4h" },
    { id: 3, user: "Miguel R.", action: "subió de nivel", time: "Hace 6h" },
  ];

  // 🤖 Función para llamar a Gemini API
  const callGeminiAPI = async (userMessage: string): Promise<string> => {
    if (!GEMINI_API_KEY) {
      console.error("❌ ERROR: API Key no encontrada");
      return "⚠️ Error de configuración: No se encontró la clave API de Gemini.";
    }

    console.log("📡 Enviando mensaje a Gemini...");
    
    try {
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      console.log("🌐 URL construida correctamente");
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Eres un asistente experto en tenis llamado "Chatsport". Tu función es ayudar a jugadores de tenis de todos los niveles con:
1. Técnicas de tenis (golpes, saques, voleas, estrategias)
2. Nutrición deportiva específica para tenistas
3. Consejos de entrenamiento y mejora del juego
4. Prevención de lesiones
5. Aspectos mentales del tenis

Responde de manera clara, concisa y amigable. Usa emojis relevantes (🎾, 💪, 🥗, etc.) para hacer las respuestas más visuales. 

Si la pregunta no está relacionada con tenis, nutrición deportiva o fitness, responde amablemente que solo puedes ayudar con temas relacionados al tenis.

Pregunta del usuario: ${userMessage}

Responde de forma estructurada con bullets cuando sea necesario y mantén las respuestas entre 100-200 palabras.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      console.log("📥 Respuesta recibida. Status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error de API:", errorText);
        throw new Error(`API respondió con status ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Datos recibidos correctamente");
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        console.error("❌ Formato de respuesta inválido");
        throw new Error("Respuesta inválida de la API");
      }
    } catch (error) {
      console.error("❌ Error al llamar a Gemini API:", error);
      return "Lo siento, hubo un error al procesar tu pregunta. Por favor intenta de nuevo. 🙏\n\nDetalles: " + (error instanceof Error ? error.message : "Error desconocido");
    }
  };

  // 🤖 Enviar mensaje
  const sendMessage = async () => {
    if (inputText.trim() === "" || isLoading) return;

    const userMessageText = inputText.trim();
    
    const userMessage: Message = {
      id: messages.length + 1,
      text: userMessageText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const botResponseText = await callGeminiAPI(userMessageText);
      
      const botMessage: Message = {
        id: messages.length + 2,
        text: botResponseText,
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
      
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: messages.length + 2,
        text: "Lo siento, hubo un problema al procesar tu mensaje. Por favor intenta nuevamente.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Sugerencias rápidas
  const quickSuggestions = [
    "Cómo mejorar mi derecha",
    "Nutrición antes del partido",
    "Consejos para principiantes",
    "Prevenir lesiones",
  ];

  const handleQuickSuggestion = (suggestion: string) => {
    setInputText(suggestion);
  };

  // Funciones del menú de usuario
  const handleViewProfile = () => {
    setShowUserMenu(false);
    console.log("Ver perfil");
  };

  const handleEditProfile = () => {
    setShowUserMenu(false);
    console.log("Editar perfil");
  };

const handleOpenSettings = async () => {
  setShowUserMenu(false);
  try {
    // Abre la configuración del sistema (Android / iOS)
    await Linking.openSettings();
    console.log("⚙️ Abriendo configuraciones del dispositivo...");
  } catch (error) {
    console.error("❌ No se pudo abrir Configuración:", error);
  }
};

  // 🔥 Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("✅ Sesión cerrada correctamente");
      router.replace("/login");
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
    }
  };

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
                    event.nativeEvent.contentOffset.x / width
                  );
                  setCurrentNewsIndex(newIndex);
                }}
                snapToInterval={width}
                decelerationRate="fast"
              >
                {newsItems.map((news) => (
                  <View key={news.id} style={styles.newsCardWrapper}>
                    <LinearGradient
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
                  </View>
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
  return <TennisCourtMap />;
      case "partidos":
  return (
    <View style={styles.centerContent}>
      <Text style={styles.comingSoon}>🎾</Text>
      <Text style={styles.comingSoonText}>Tus próximos partidos</Text>

      <TouchableOpacity
        style={styles.registerMatchButton}
        onPress={() => router.push("/RegisterMatch")}
      >
        <Ionicons name="tennisball-outline" size={22} color="#fff" />
        <Text style={styles.registerMatchText}>Registrar Partido</Text>
      </TouchableOpacity>
    </View>
  );

      case "ranking":
         return <Amigos />;
        
      case "perfil":
        return (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.chatContainer}
            keyboardVerticalOffset={100}
          >
            {/* Mensajes del chat */}
            <ScrollView
              ref={chatScrollRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() =>
                chatScrollRef.current?.scrollToEnd({ animated: true })
              }
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.sender === "user"
                      ? styles.userMessage
                      : styles.botMessage,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.sender === "user" && styles.userMessageText,
                    ]}
                  >
                    {message.text}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      message.sender === "user" && styles.userMessageTime,
                    ]}
                  >
                    {message.timestamp.toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              ))}
              
              {/* Indicador de carga */}
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#476EAE" />
                  <Text style={styles.loadingText}>Escribiendo...</Text>
                </View>
              )}
            </ScrollView>

            {/* Sugerencias rápidas */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.suggestionsContainer}
              contentContainerStyle={styles.suggestionsContent}
            >
              {quickSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionButton}
                  onPress={() => handleQuickSuggestion(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Input de mensaje */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Escribe tu pregunta..."
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={sendMessage}
                multiline
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.sendButton} 
                onPress={sendMessage}
                disabled={isLoading || inputText.trim() === ""}
              >
                <LinearGradient
                  colors={isLoading || inputText.trim() === "" ? ["#ccc", "#999"] : ["#476EAE", "#48B3AF"]}
                  style={styles.sendGradient}
                >
                  <Text style={styles.sendButtonText}>➤</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
          <Image 
            source={logoImage} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.greetingText}>Hola, {userData.name}</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => setShowUserMenu(!showUserMenu)}
        >
          <LinearGradient
            colors={["#476EAE", "#48B3AF"]}
            style={styles.profileGradient}
          >
            <Text style={styles.profileText}>{userData.initials}</Text>
          </LinearGradient>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{userData.level}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Contenido principal */}
      <View style={styles.mainContent}>{renderContent()}</View>

      {/* Menú desplegable de usuario */}
<Modal
  visible={showUserMenu}
  transparent={true}
  animationType="none"
  onRequestClose={() => setShowUserMenu(false)}
>
  <TouchableOpacity 
    style={styles.menuOverlay}
    activeOpacity={1}
    onPress={() => setShowUserMenu(false)}
  >
    <Animated.View 
      style={[
        styles.userMenuContainer,
        {
          transform: [{ translateX: slideAnim }]
        }
      ]}
    >
      {/* Header del menú */}
      <LinearGradient
        colors={["#476EAE", "#48B3AF"]}
        style={styles.userMenuHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.userMenuAvatar}>
          <Text style={styles.userMenuAvatarText}>{userData.initials}</Text>
        </View>
        <Text style={styles.userMenuName}>{userData.name}</Text>
        <Text style={styles.userMenuMember}>Miembro desde {userData.memberSince}</Text>
      </LinearGradient>

      {/* Nivel y XP */}
      <View style={styles.levelSection}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelTitle}>Nivel {userData.level}</Text>
          <Text style={styles.levelXP}>{userData.xp}/{userData.xpToNextLevel} XP</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <LinearGradient
            colors={["#476EAE", "#48B3AF"]}
            style={[
              styles.progressBar,
              { width: `${(userData.xp / userData.xpToNextLevel) * 100}%` }
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
        <Text style={styles.levelDescription}>
          🎾 Juega más partidos y usa la app para subir de nivel
        </Text>
      </View>

      {/* Estadísticas rápidas */}
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userData.matchesPlayed}</Text>
          <Text style={styles.statLabel}>Partidos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userData.wins}</Text>
          <Text style={styles.statLabel}>Victorias</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {userData.matchesPlayed > 0 
              ? Math.round((userData.wins / userData.matchesPlayed) * 100)
              : 0}%
          </Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
      </View>

      {/* Opciones del menú */}
      <View style={styles.menuOptions}>

        <TouchableOpacity 
          style={styles.menuOption}
          onPress={handleEditProfile}
        >
          <Text style={styles.menuOptionIcon}>✏️</Text>
          <Text style={styles.menuOptionText}>Editar Perfil</Text>
          <Text style={styles.menuOptionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuOption}
          onPress={async () => {
            setShowUserMenu(false);
            try {
              await Linking.openSettings();
              console.log("⚙️ Abriendo configuraciones del dispositivo...");
            } catch (error) {
              console.error("❌ No se pudo abrir Configuración:", error);
            }
          }}
        >
          <Text style={styles.menuOptionIcon}>⚙️</Text>
          <Text style={styles.menuOptionText}>Configuraciones</Text>
          <Text style={styles.menuOptionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Botón de cerrar sesión */}
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={handleLogout}
      >
        <Text style={styles.closeButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </Animated.View>
  </TouchableOpacity>
</Modal>


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
            👥
          </Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "ranking" && styles.tabLabelActive,
            ]}
          >
            Amigos
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
            💬
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