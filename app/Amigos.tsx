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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function Amigos() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFriend, setNewFriend] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const fabAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  const friends = [
    { id: 1, name: "Carlos Martínez", username: "carlosm", matches: 24, wins: 15 },
    { id: 2, name: "Ana López", username: "analopez", matches: 12, wins: 8 },
    { id: 3, name: "Miguel Rojas", username: "miguelr", matches: 30, wins: 18 },
    { id: 4, name: "Lucía Gómez", username: "luciag", matches: 10, wins: 6 },
  ];

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

  const handleAddFriend = () => {
    if (newFriend.trim() === "") return;
    console.log("Nuevo amigo agregado:", newFriend);
    setNewFriend("");
    setShowAddModal(false);
    showSuccessMessage();
  };

  return (
    <View style={styles.container}>
      {/* Header con degradado */}
      <LinearGradient colors={["#476EAE", "#48B3AF"]} style={styles.headerGradient}>
        <Text style={styles.headerTitle}>Amigos</Text>
      </LinearGradient>

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
        {filtered.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={styles.friendCard}
            onPress={() => {
              setSelectedFriend(f);
              setShowFriendModal(true);
            }}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{f.name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.friendName}>{f.name}</Text>
              <Text style={styles.friendUsername}>@{f.username}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No se encontraron amigos</Text>
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
                  {selectedFriend?.name.charAt(0)}
                </Text>
              </View>
              <Text style={styles.modalName}>{selectedFriend?.name}</Text>
              <Text style={styles.modalUsername}>@{selectedFriend?.username}</Text>
            </LinearGradient>

            <View style={styles.modalStats}>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatNumber}>{selectedFriend?.matches}</Text>
                <Text style={styles.modalStatLabel}>Partidos</Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatNumber}>{selectedFriend?.wins}</Text>
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -20,
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
});
