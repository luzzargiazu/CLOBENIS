import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserUsername: string;
  status: "pending" | "accepted" | "rejected";
}

export default function SolicitudesAmigos() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = auth.currentUser?.uid;

  // 📡 Escuchar solicitudes pendientes en tiempo real
  useEffect(() => {
    if (!currentUserId) return;

    const requestsRef = collection(db, "friendRequests");
    const q = query(
      requestsRef,
      where("toUserId", "==", currentUserId),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const requestsData: FriendRequest[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Obtener datos del usuario que envió la solicitud
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

      setRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // ✅ Aceptar solicitud
  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!currentUserId) return;

    try {
      // Actualizar el estado de la solicitud
      await updateDoc(doc(db, "friendRequests", request.id), {
        status: "accepted",
      });

      // Agregar a la lista de amigos de ambos usuarios
      const currentUserRef = doc(db, "users", currentUserId);
      const fromUserRef = doc(db, "users", request.fromUserId);

      await updateDoc(currentUserRef, {
        friends: arrayUnion(request.fromUserId),
      });

      await updateDoc(fromUserRef, {
        friends: arrayUnion(currentUserId),
      });

      // Opcional: Eliminar la solicitud después de aceptarla
      await deleteDoc(doc(db, "friendRequests", request.id));

      Alert.alert("Éxito", `Ahora eres amigo de ${request.fromUserName}`);
    } catch (error) {
      console.error("Error aceptando solicitud:", error);
      Alert.alert("Error", "No se pudo aceptar la solicitud");
    }
  };

  // ❌ Rechazar solicitud
  const handleRejectRequest = async (request: FriendRequest) => {
    try {
      await updateDoc(doc(db, "friendRequests", request.id), {
        status: "rejected",
      });

      // Opcional: Eliminar la solicitud después de rechazarla
      await deleteDoc(doc(db, "friendRequests", request.id));

      Alert.alert("Solicitud rechazada");
    } catch (error) {
      console.error("Error rechazando solicitud:", error);
      Alert.alert("Error", "No se pudo rechazar la solicitud");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#476EAE", "#48B3AF"]} style={styles.headerGradient}>
        <Text style={styles.headerTitle}>Solicitudes de Amistad</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Cargando solicitudes...</Text>
          </View>
        ) : requests.length > 0 ? (
          requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {request.fromUserName.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.requestInfo}>
                <Text style={styles.userName}>{request.fromUserName}</Text>
                <Text style={styles.username}>@{request.fromUserUsername}</Text>
              </View>

              <View style={styles.actions}>
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
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No tienes solicitudes pendientes</Text>
          </View>
        )}
      </ScrollView>
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
  listContainer: { padding: 20 },
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
  requestInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "700", color: "#333" },
  username: { fontSize: 14, color: "#777" },
  actions: { flexDirection: "row", gap: 8 },
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
  emptyState: { marginTop: 80, alignItems: "center" },
  emptyText: { color: "#999", fontSize: 16, marginTop: 10 },
});