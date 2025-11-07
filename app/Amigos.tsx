import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";

interface Friend {
  id: string;
  name: string;
  username: string;
  email: string;
  matches?: number;
  wins?: number;
}

interface PendingRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserUsername: string;
  status: string;
}

export default function Amigos() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFriend, setNewFriend] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  const fabAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const currentUserId = auth.currentUser?.uid;

  // 📡 Cargar solicitudes pendientes en tiempo real
  useEffect(() => {
    if (!currentUserId) return;

    const requestsRef = collection(db, "friendRequests");
    const q = query(
      requestsRef,
      where("toUserId", "==", currentUserId),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setPendingRequestsCount(snapshot.size);

      const requestsData: PendingRequest[] = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const fromUserDoc = await getDoc(doc(db, "users", data.fromUserId));
        const fromUserData = fromUserDoc.data();

        requestsData.push({
          id: docSnap.id,
          fromUserId: data.fromUserId,
          fromUserName: fromUserData?.name || "Usuario desconocido",
          fromUserUsername: fromUserData?.username || "usuario",
          status: data.status,
        });
      }
      setPendingRequests(requestsData);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // 📡 Cargar amigos en tiempo real
  useEffect(() => {
    if (!currentUserId) return;

    const userDocRef = doc(db, "users", currentUserId);
    
    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const friendIds = userData.friends || [];

        if (friendIds.length === 0) {
          setFriends([]);
          setLoading(false);
          return;
        }

        const friendsData: Friend[] = [];
        for (const friendId of friendIds) {
          const friendDoc = await getDoc(doc(db, "users", friendId));
          if (friendDoc.exists()) {
            const data = friendDoc.data();
            friendsData.push({
              id: friendDoc.id,
              name: data.name || "Sin nombre",
              username: data.username || "usuario",
              email: data.email || "",
              matches: data.matches || 0,
              wins: data.wins || 0,
            });
          }
        }

        setFriends(friendsData);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const filtered = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 🔹 Animación del botón flotante
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fabAnim, { toValue: -5, duration: 900, useNativeDriver: true }),
        Animated.timing(fabAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ✅ Mostrar animación de éxito
  const showSuccessMessage = () => {
    setShowSuccess(true);
    successAnim.setValue(0);
    Animated.timing(successAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => setShowSuccess(false));
      }, 1600);
    });
  };

  // 🔍 Buscar usuario por username o email
  const searchUser = async (searchTerm: string) => {
    try {
      const usersRef = collection(db, "users");
      
      const usernameQuery = query(
        usersRef,
        where("username", "==", searchTerm.toLowerCase())
      );
      let snapshot = await getDocs(usernameQuery);

      if (snapshot.empty) {
        const emailQuery = query(usersRef, where("email", "==", searchTerm.toLowerCase()));
        snapshot = await getDocs(emailQuery);
      }

      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      }

      return null;
    } catch (error) {
      console.error("Error buscando usuario:", error);
      return null;
    }
  };

  // ➕ Agregar amigo (enviar solicitud)
  const handleAddFriend = async () => {
    if (newFriend.trim() === "") {
      Alert.alert("Error", "Ingresa un nombre de usuario o correo");
      return;
    }

    if (!currentUserId) {
      Alert.alert("Error", "Debes iniciar sesión");
      return;
    }

    try {
      const user = await searchUser(newFriend.trim());

      if (!user) {
        Alert.alert("Error", "Usuario no encontrado");
        return;
      }

      if (user.id === currentUserId) {
        Alert.alert("Error", "No puedes agregarte a ti mismo");
        return;
      }

      const currentUserDoc = await getDoc(doc(db, "users", currentUserId));
      const currentUserData = currentUserDoc.data();
      const currentFriends = currentUserData?.friends || [];

      if (currentFriends.includes(user.id)) {
        Alert.alert("Info", "Ya son amigos");
        return;
      }

      const requestsRef = collection(db, "friendRequests");
      const existingRequestQuery = query(
        requestsRef,
        where("fromUserId", "==", currentUserId),
        where("toUserId", "==", user.id),
        where("status", "==", "pending")
      );
      const existingRequests = await getDocs(existingRequestQuery);

      if (!existingRequests.empty) {
        Alert.alert("Info", "Ya enviaste una solicitud a este usuario");
        return;
      }

      await addDoc(collection(db, "friendRequests"), {
        fromUserId: currentUserId,
        toUserId: user.id,
        status: "pending",
        createdAt: new Date(),
      });

      setNewFriend("");
      setShowAddModal(false);
      showSuccessMessage();
    } catch (error) {
      console.error("Error agregando amigo:", error);
      Alert.alert("Error", "No se pudo enviar la solicitud");
    }
  };

  // ✅ Aceptar solicitud
  const handleAcceptRequest = async (request: PendingRequest) => {
    if (!currentUserId) return;

    try {
      const currentUserRef = doc(db, "users", currentUserId);
      const fromUserRef = doc(db, "users", request.fromUserId);

      await updateDoc(currentUserRef, {
        friends: arrayUnion(request.fromUserId),
      });

      await updateDoc(fromUserRef, {
        friends: arrayUnion(currentUserId),
      });

      await deleteDoc(doc(db, "friendRequests", request.id));

      Alert.alert("Éxito", `Ahora eres amigo de ${request.fromUserName}`);
    } catch (error) {
      console.error("Error aceptando solicitud:", error);
      Alert.alert("Error", "No se pudo aceptar la solicitud");
    }
  };

  // ❌ Rechazar solicitud
  const handleRejectRequest = async (request: PendingRequest) => {
    try {
      await deleteDoc(doc(db, "friendRequests", request.id));
      Alert.alert("Solicitud rechazada");
    } catch (error) {
      console.error("Error rechazando solicitud:", error);
      Alert.alert("Error", "No se pudo rechazar la solicitud");
    }
  };

  // 🗑️ Eliminar amigo
  const handleRemoveFriend = async (friendId: string) => {
    if (!currentUserId) return;

    Alert.alert(
      "Eliminar amigo",
      "¿Estás seguro de que quieres eliminar este amigo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const currentUserRef = doc(db, "users", currentUserId);
              const friendUserRef = doc(db, "users", friendId);

              await updateDoc(currentUserRef, {
                friends: arrayRemove(friendId),
              });

              await updateDoc(friendUserRef, {
                friends: arrayRemove(currentUserId),
              });

              setShowFriendModal(false);
              Alert.alert("Éxito", "Amigo eliminado");
            } catch (error) {
              console.error("Error eliminando amigo:", error);
              Alert.alert("Error", "No se pudo eliminar el amigo");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header con degradado */}
      <LinearGradient colors={["#476EAE", "#48B3AF"]} style={styles.headerGradient}>
        <Text style={styles.headerTitle}>Amigos</Text>
      </LinearGradient>

      {/* Botón de solicitudes pendientes (ahora debajo del header) */}
      {pendingRequestsCount > 0 && (
        <TouchableOpacity
          style={styles.requestsBanner}
          onPress={() => setShowRequestsModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.requestsBannerContent}>
            <View style={styles.requestsBannerIcon}>
              <Ionicons name="mail" size={22} color="#476EAE" />
              <View style={styles.requestsBadge}>
                <Text style={styles.requestsBadgeText}>
                  {pendingRequestsCount > 9 ? "9+" : pendingRequestsCount}
                </Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.requestsBannerTitle}>
                {pendingRequestsCount === 1
                  ? "Tienes 1 solicitud pendiente"
                  : `Tienes ${pendingRequestsCount} solicitudes pendientes`}
              </Text>
              <Text style={styles.requestsBannerSubtitle}>
                Toca para revisar
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#476EAE" />
          </View>
        </TouchableOpacity>
      )}

      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#666" />
        <TextInput
          placeholder="Buscar amigos..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* Lista de amigos */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Cargando amigos...</Text>
          </View>
        ) : filtered.length > 0 ? (
          filtered.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={styles.friendCard}
              onPress={() => {
                setSelectedFriend(f);
                setShowFriendModal(true);
              }}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{f.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.friendName}>{f.name}</Text>
                <Text style={styles.friendUsername}>@{f.username}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? "No se encontraron amigos" : "No tienes amigos aún"}
            </Text>
            {!searchQuery && (
              <Text style={styles.emptySubtext}>
                Presiona el botón + para agregar amigos
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* 🧑 Modal de perfil del amigo */}
      <Modal visible={showFriendModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient colors={["#476EAE", "#48B3AF"]} style={styles.modalHeader}>
              <View style={styles.modalAvatar}>
                <Text style={styles.modalAvatarText}>
                  {selectedFriend?.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.modalName}>{selectedFriend?.name}</Text>
              <Text style={styles.modalUsername}>@{selectedFriend?.username}</Text>
            </LinearGradient>

            <View style={styles.modalStats}>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatNumber}>{selectedFriend?.matches || 0}</Text>
                <Text style={styles.modalStatLabel}>Partidos</Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatNumber}>{selectedFriend?.wins || 0}</Text>
                <Text style={styles.modalStatLabel}>Victorias</Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatNumber}>
                  {Math.round(
                    ((selectedFriend?.wins || 0) / (selectedFriend?.matches || 1)) * 100
                  )}
                  %
                </Text>
                <Text style={styles.modalStatLabel}>Win Rate</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => selectedFriend && handleRemoveFriend(selectedFriend.id)}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>Eliminar amigo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowFriendModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ➕ Modal para agregar amigo */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.addModalContainer}>
            <Text style={styles.addModalTitle}>Agregar amigo</Text>
            <TextInput
              placeholder="Nombre de usuario o correo"
              placeholderTextColor="#999"
              value={newFriend}
              onChangeText={setNewFriend}
              style={styles.addInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={handleAddFriend} style={styles.addButton}>
              <LinearGradient colors={["#476EAE", "#48B3AF"]} style={styles.addGradient}>
                <Text style={styles.addButtonText}>Enviar solicitud</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelAdd}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ✅ Mensaje de éxito */}
      {showSuccess && (
        <Animated.View
          style={[
            styles.successPopup,
            { opacity: successAnim, transform: [{ scale: successAnim }] },
          ]}
        >
          <Ionicons name="checkmark-circle" size={40} color="#48B3AF" />
          <Text style={styles.successText}>Solicitud enviada</Text>
        </Animated.View>
      )}

      {/* 🔵 Botón flotante "Agregar amigo" */}
      <Animated.View style={[styles.fabContainer, { transform: [{ translateY: fabAnim }] }]}>
        <TouchableOpacity onPress={() => setShowAddModal(true)} activeOpacity={0.9}>
          <LinearGradient colors={["#476EAE", "#48B3AF"]} style={styles.fabButton}>
            <Ionicons name="person-add" size={26} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* 📬 Modal de solicitudes pendientes */}
      <Modal visible={showRequestsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.requestsModalContainer}>
            <View style={styles.requestsModalHeader}>
              <Text style={styles.requestsModalTitle}>Solicitudes de Amistad</Text>
              <TouchableOpacity onPress={() => setShowRequestsModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.requestsList}>
              {pendingRequests.length > 0 ? (
                pendingRequests.map((request) => (
                  <View key={request.id} style={styles.requestCard}>
                    <View style={styles.requestAvatar}>
                      <Text style={styles.requestAvatarText}>
                        {request.fromUserName.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.requestInfo}>
                      <Text style={styles.requestName}>{request.fromUserName}</Text>
                      <Text style={styles.requestUsername}>@{request.fromUserUsername}</Text>
                    </View>

                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        onPress={() => handleAcceptRequest(request)}
                        style={styles.acceptButton}
                      >
                        <Ionicons name="checkmark" size={24} color="#fff" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleRejectRequest(request)}
                        style={styles.rejectButton}
                      >
                        <Ionicons name="close" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyRequests}>
                  <Ionicons name="mail-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyRequestsText}>
                    No tienes solicitudes pendientes
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  headerGradient: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "700" },
  requestsBanner: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -15,
    marginBottom: 10,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
  },
  requestsBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  requestsBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F4F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    position: "relative",
  },
  requestsBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ff4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#fff",
  },
  requestsBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  requestsBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  requestsBannerSubtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: "#333" },
  listContainer: { padding: 20 },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#476EAE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  friendName: { fontSize: 16, fontWeight: "700", color: "#333" },
  friendUsername: { fontSize: 14, color: "#777" },
  emptyState: { marginTop: 80, alignItems: "center" },
  emptyText: { color: "#999", fontSize: 16, marginTop: 10 },
  emptySubtext: { color: "#bbb", fontSize: 14, marginTop: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "85%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: { alignItems: "center", paddingVertical: 30 },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  modalAvatarText: { fontSize: 36, color: "#fff", fontWeight: "700" },
  modalName: { color: "#fff", fontSize: 22, fontWeight: "700" },
  modalUsername: { color: "rgba(255,255,255,0.9)", fontSize: 14, marginTop: 4 },
  modalStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
  },
  modalStatItem: { alignItems: "center" },
  modalStatNumber: { fontSize: 20, fontWeight: "700", color: "#476EAE" },
  modalStatLabel: { color: "#666", fontSize: 13 },
  removeButton: {
    paddingVertical: 14,
    backgroundColor: "#ffebee",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  removeButtonText: { fontSize: 16, fontWeight: "600", color: "#d32f2f" },
  closeButton: { paddingVertical: 14, backgroundColor: "#f0f0f0", alignItems: "center" },
  closeButtonText: { fontSize: 16, fontWeight: "600", color: "#333" },
  addModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    alignItems: "center",
  },
  addModalTitle: { fontSize: 20, fontWeight: "700", color: "#333", marginBottom: 16 },
  addInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
    color: "#333",
  },
  addButton: { width: "100%", borderRadius: 12, overflow: "hidden", marginBottom: 10 },
  addGradient: { paddingVertical: 12, alignItems: "center" },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancelAdd: { color: "#476EAE", fontSize: 14, fontWeight: "600" },
  fabContainer: { position: "absolute", bottom: 30, right: 30 },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 6,
    elevation: 6,
  },
  successPopup: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  successText: {
    color: "#48B3AF",
    fontWeight: "700",
    fontSize: 16,
    marginTop: 6,
  },
  requestsModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
    marginTop: "auto",
  },
  requestsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  requestsModalTitle: { fontSize: 20, fontWeight: "700", color: "#333" },
  requestsList: { flex: 1, padding: 16 },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  requestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#476EAE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  requestAvatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  requestInfo: { flex: 1 },
  requestName: { fontSize: 16, fontWeight: "700", color: "#333" },
  requestUsername: { fontSize: 14, color: "#777", marginTop: 2 },
  requestActions: { flexDirection: "row", gap: 8 },
  acceptButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  rejectButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f44336",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyRequests: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyRequestsText: {
    color: "#999",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
});