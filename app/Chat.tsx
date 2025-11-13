import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useLocalSearchParams, useRouter } from "expo-router";

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
  read: boolean;
}

export default function Chat() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const friendId = params.friendId as string;
  const friendName = params.friendName as string;
  const friendUsername = params.friendUsername as string;
  const paramFriendPhoto = params.friendPhoto as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [friendPhoto, setFriendPhoto] = useState<string | null>(null);
  const [loadingFriendData, setLoadingFriendData] = useState(true);
  
  const flatListRef = useRef<FlatList>(null);
  const currentUserId = auth.currentUser?.uid;

  const chatId = [currentUserId, friendId].sort().join("_");

  // 🆕 Cargar datos del amigo desde Firestore
  useEffect(() => {
    const loadFriendData = async () => {
      if (!friendId) return;
      
      try {
        setLoadingFriendData(true);
        const friendDoc = await getDoc(doc(db, "users", friendId));
        
        if (friendDoc.exists()) {
          const friendData = friendDoc.data();
          const photoUrl = friendData.photo || friendData.photoURL || paramFriendPhoto || "";
          
          console.log("📸 Foto del amigo cargada:", photoUrl); // Debug
          setFriendPhoto(photoUrl);
        } else {
          // Si no encuentra el documento, usa la foto de los parámetros
          setFriendPhoto(paramFriendPhoto || "");
        }
      } catch (error) {
        console.error("Error cargando datos del amigo:", error);
        setFriendPhoto(paramFriendPhoto || "");
      } finally {
        setLoadingFriendData(false);
      }
    };

    loadFriendData();
  }, [friendId, paramFriendPhoto]);

  useEffect(() => {
    if (!currentUserId || !friendId) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: Message[] = [];
      snapshot.forEach((doc) => {
        messagesData.push({
          id: doc.id,
          ...doc.data(),
        } as Message);
      });
      setMessages(messagesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId, friendId]);

  const sendMessage = async () => {
    if (inputText.trim() === "" || !currentUserId) return;

    const messageText = inputText.trim();
    setInputText("");

    try {
      const chatDocRef = doc(db, "chats", chatId);
      const chatDoc = await getDoc(chatDocRef);

      if (!chatDoc.exists()) {
        await setDoc(chatDocRef, {
          participants: [currentUserId, friendId],
          createdAt: serverTimestamp(),
          lastMessage: messageText,
          lastMessageTime: serverTimestamp(),
          lastMessageSender: currentUserId,
        });
      } else {
        await setDoc(chatDocRef, {
          lastMessage: messageText,
          lastMessageTime: serverTimestamp(),
          lastMessageSender: currentUserId,
        }, { merge: true });
      }

      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: messageText,
        senderId: currentUserId,
        timestamp: serverTimestamp(),
        read: false,
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error enviando mensaje:", error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === currentUserId;
    const messageTime = item.timestamp?.toDate
      ? new Date(item.timestamp.toDate()).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <View
        style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessage : styles.friendMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.friendMessageText,
          ]}
        >
          {item.text}
        </Text>
        <Text
          style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.friendMessageTime,
          ]}
        >
          {messageTime}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <LinearGradient colors={["#476EAE", "#48B3AF"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          {loadingFriendData ? (
            <View style={styles.headerAvatarPlaceholder}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          ) : friendPhoto && friendPhoto !== "" ? (
            <Image 
              source={{ uri: friendPhoto }} 
              style={styles.headerAvatar}
              onError={(error) => {
                console.log("❌ Error cargando imagen:", error.nativeEvent);
                setFriendPhoto(null); // Si falla, muestra el placeholder
              }}
            />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarText}>
                {friendName?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName}>{friendName || "Usuario"}</Text>
            <Text style={styles.headerUsername}>@{friendUsername || "usuario"}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#476EAE" />
          <Text style={styles.loadingText}>Cargando mensajes...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No hay mensajes aún</Text>
          <Text style={styles.emptySubtext}>
            Envía el primer mensaje a {friendName}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, inputText.trim() === "" && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={inputText.trim() === ""}
        >
          <LinearGradient
            colors={inputText.trim() === "" ? ["#ccc", "#999"] : ["#476EAE", "#48B3AF"]}
            style={styles.sendGradient}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  header: { flexDirection: "row", alignItems: "center", paddingTop: 50, paddingBottom: 15, paddingHorizontal: 16, justifyContent: "space-between" },
  backButton: { padding: 8 },
  headerInfo: { flex: 1, flexDirection: "row", alignItems: "center", marginLeft: 8 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 2, borderColor: "#fff" },
  headerAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.3)", justifyContent: "center", alignItems: "center", marginRight: 12 },
  headerAvatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  headerUsername: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  moreButton: { padding: 8 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#999", fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#666", marginTop: 16 },
  emptySubtext: { fontSize: 14, color: "#999", marginTop: 8, textAlign: "center" },
  messagesList: { padding: 16 },
  messageBubble: { maxWidth: "75%", padding: 12, borderRadius: 16, marginBottom: 8 },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#476EAE", borderBottomRightRadius: 4 },
  friendMessage: { alignSelf: "flex-start", backgroundColor: "#fff", borderBottomLeftRadius: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, elevation: 1 },
  messageText: { fontSize: 15, lineHeight: 20 },
  myMessageText: { color: "#fff" },
  friendMessageText: { color: "#333" },
  messageTime: { fontSize: 11, marginTop: 4 },
  myMessageTime: { color: "rgba(255,255,255,0.7)", textAlign: "right" },
  friendMessageTime: { color: "#999", textAlign: "left" },
  inputContainer: { flexDirection: "row", padding: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e0e0e0", alignItems: "flex-end" },
  input: { flex: 1, backgroundColor: "#f4f6f8", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100, color: "#333" },
  sendButton: { marginLeft: 8 },
  sendButtonDisabled: { opacity: 0.5 },
  sendGradient: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
});