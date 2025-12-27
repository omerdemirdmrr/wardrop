import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { COLORS } from "../screens/colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { updateClothingItem, deleteClothingItem } from "../api/clothing";
import { useError } from "../context/ErrorContext";
import { errorHandler } from "../utils";

const ClothingDetailModal = ({ visible, item, onClose, onUpdateTrigger }) => {
  const { showError } = useError();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Düzenlenebilir Veriler
  const [name, setName] = useState("");

  // Modal her açıldığında verileri item'dan alıp state'e yükle
  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setIsEditing(false);
    }
  }, [item, visible]);

  if (!item) return null;

  const handleDelete = () => {
    Alert.alert(
      "Delete Clothing",
      "Are you sure you want to remove this item from your wardrobe?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const res = await deleteClothingItem(item._id || item.id);
            setLoading(false);
            if (res.success) {
              onUpdateTrigger();
              onClose();
            } else {
              showError(errorHandler.formatErrorForUser(res.error));
            }
          },
        },
      ]
    );
  };

  // --- KAYDETME (GÜNCELLEME) İŞLEMİ ---
  const handleSave = async () => {
    setLoading(true);
    const updatedData = {
      ...item,
      name: name,
    };

    const res = await updateClothingItem(updatedData);
    setLoading(false);

    if (res.success) {
      setIsEditing(false);
      onUpdateTrigger();
    } else {
      showError(errorHandler.formatErrorForUser(res.error));
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <LinearGradient
          colors={["#4c2a85", "#2a1a45"]}
          style={styles.modalView}
        >
          {/* --- HEADER (Kapat, Düzenle, Sil Butonları) --- */}
          <View style={styles.headerButtons}>
            {/* Sol Üst: Kapat */}
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <Ionicons name="close-circle" size={30} color={COLORS.gray} />
            </TouchableOpacity>

            {/* Sağ Üst: İşlem Butonları */}
            <View style={styles.actionButtons}>
              {!isEditing ? (
                <>
                  {/* DÜZENLEME MODUNU AÇ */}
                  <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    style={styles.iconBtn}
                  >
                    <Ionicons name="pencil" size={26} color={COLORS.primary} />
                  </TouchableOpacity>
                  {/* SİL */}
                  <TouchableOpacity
                    onPress={handleDelete}
                    style={[styles.iconBtn, { marginLeft: 15 }]}
                  >
                    <Ionicons name="trash" size={26} color="#E74C3C" />
                  </TouchableOpacity>
                </>
              ) : (
                // DÜZENLEME MODUNDAYSA: İPTAL BUTONU
                <TouchableOpacity
                  onPress={() => setIsEditing(false)}
                  style={styles.iconBtn}
                >
                  <Text style={{ color: COLORS.gray, fontWeight: "bold" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* RESİM */}
            <Image source={{ uri: item.imageUrl }} style={styles.modalImage} />

            {/* --- FORM AREA --- */}

            {/* 1. NAME FIELD */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Name:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                />
              ) : (
                <Text style={styles.valueText}>{name}</Text>
              )}
            </View>

            {/* CATEGORY & SEASON (Read Only - Can be made editable if needed) */}
            <View style={styles.row}>
              <View style={styles.fieldContainerHalf}>
                <Text style={styles.label}>Category:</Text>
                <Text style={styles.valueText}>{item.category}</Text>
              </View>
              <View style={styles.fieldContainerHalf}>
                <Text style={styles.label}>Season:</Text>
                <Text style={styles.valueText}>{item.season}</Text>
              </View>
            </View>

            {/* COLOR (Display only) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Color:</Text>
              <Text style={styles.valueText}>{item.color || "-"}</Text>
            </View>

            {/* SAVE BUTTON (Only visible in Edit Mode) */}
            {isEditing && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.primaryText} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalView: {
    width: "90%",
    maxHeight: "85%",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  headerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    padding: 5,
  },
  modalImage: {
    width: "100%",
    height: 300,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    resizeMode: "contain",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldContainerHalf: {
    flex: 1,
    marginBottom: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  label: {
    fontWeight: "bold",
    color: COLORS.primary,
    fontSize: 14,
    marginBottom: 5,
  },
  valueText: {
    fontSize: 18,
    color: COLORS.white,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    color: COLORS.white,
    fontSize: 18,
    paddingVertical: 5,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  saveButtonText: {
    color: COLORS.primaryText,
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ClothingDetailModal;
