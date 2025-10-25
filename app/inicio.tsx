import { GoogleGenerativeAI } from "@google/generative-ai";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GEMINI_API_KEY } from './config';
const { width } = Dimensions.get("window");
// Inicializa la IA con tu API key (fuera del componente para  reutilizar)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ✅ Tu logo aquí
const logoImage = require("../assets/images/logo.png");

// 🤖 Tipos para el chatbot
interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function InicioScreen() {
  const [activeTab, setActiveTab] = useState("inicio");
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  
  // 🤖 Estados del chatbot
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

  // Auto-scroll cada 5 segundos
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
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Datos de ejemplo para el feed
  const feedItems = [
    { id: 1, user: "Carlos M.", action: "ganó un partido", time: "Hace 2h" },
    { id: 2, user: "Ana L.", action: "reservó una cancha", time: "Hace 4h" },
    { id: 3, user: "Miguel R.", action: "subió de ranking", time: "Hace 6h" },
  ];

  // 🤖 Función para llamar a Gemini API
  const callGeminiAPI = async (userMessage: string): Promise<string> => {
    // Verificar que la API key existe
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
    
    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: messages.length + 1,
      text: userMessageText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // Scroll al final
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Llamar a Gemini API
      const botResponseText = await callGeminiAPI(userMessageText);
      
      const botMessage: Message = {
        id: messages.length + 2,
        text: botResponseText,
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
      
      // Auto-scroll al final
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

  // 🤖 Sugerencias rápidas
  const quickSuggestions = [
    "Cómo mejorar mi derecha",
    "Nutrición antes del partido",
    "Consejos para principiantes",
    "Prevenir lesiones",
  ];

  const handleQuickSuggestion = (suggestion: string) => {
    setInputText(suggestion);
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
  logoImage: {
    width: 45,
    height: 45,
    marginRight: 10,  
  },
  greetingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
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
  // 🤖 Estilos del Chat
  chatContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#476EAE",
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 20,
  },
  userMessageText: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  userMessageTime: {
    color: "rgba(255,255,255,0.7)",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  suggestionsContainer: {
    maxHeight: 50,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  suggestionsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  suggestionButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: "#476EAE",
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  sendGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
});