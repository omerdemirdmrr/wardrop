import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal, // Added
  TextInput, // Added
  KeyboardAvoidingView, // Added
  Platform, // Added
  Alert, // Added
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../../colors";

import { getUserOutfits, deleteOutfit, clearDislikedOutfits } from "../../api/outfits";
import { useAuth } from "../../context/AuthContext";
import { useError } from "../../context/ErrorContext";
import { errorHandler } from "../../utils";

const OutfitScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { showError } = useError();
  const [activeTab, setActiveTab] = useState("favorites");
  const [customOutfits, setCustomOutfits] = useState([]);
  const [favoriteOutfits, setFavoriteOutfits] = useState([]);
  const [dislikedOutfits, setDislikedOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // --- RENAME STATE ---
  const [isRenameModalVisible, setRenameModalVisible] = useState(false);
  const [itemToRename, setItemToRename] = useState(null);
  const [newNameText, setNewNameText] = useState("");

  // --- FETCH OUTFITS ---
  const fetchOutfits = useCallback(async () => {
    // Check for both _id and id
    if (!user?._id && !user?.id) {
        return;
    }
    
    try {
        setLoading(true);
        const response = await getUserOutfits();
        
        if (!response.success) {
            showError(errorHandler.formatErrorForUser(response.error));
            return;
        }
        
        if (response.data && response.data.data) {
            const allOutfits = response.data.data;
            
            const favs = allOutfits.filter(o => o.status === 'worn' || o.status === 'favorite').map(mapOutfitData);
            // Include outfits with no status (user-created), 'created', or 'custom'
            const customs = allOutfits.filter(o => !o.status || o.status === 'created' || o.status === 'custom').map(mapOutfitData);
            const disliked = allOutfits.filter(o => o.status === 'disliked').map(mapOutfitData);
            
            setFavoriteOutfits(favs);
            setCustomOutfits(customs); 
            setDislikedOutfits(disliked); 
        }
    } catch (error) {
        const standardError = errorHandler.handleApiError(error);
        showError(errorHandler.formatErrorForUser(standardError));
    } finally {
        setLoading(false);
    }
  }, [user?._id, user?.id]);

  const mapOutfitData = (outfit) => {
      return {
          id: outfit._id,
          name: outfit.name || `Outfit ${outfit._id.substr(-4)}`,
          date: new Date(outfit.createdAt).toLocaleDateString(),
          items: outfit.items ? outfit.items.length : 0,
          outfitItems: outfit.items || []
      };
  };

  useFocusEffect(
    useCallback(() => {
      fetchOutfits();

      if (route.params?.newOutfit) {
        // ... handle param if really needed, but fetching is better
        // logic for param handling can remain or be merged
      }
    }, [fetchOutfits, route.params?.newOutfit]),
  );

  const currentData =
    activeTab === "favorites" 
        ? favoriteOutfits 
        : activeTab === "custom" 
        ? customOutfits 
        : dislikedOutfits;

  const handleCreateOutfit = () => {
    navigation.navigate("CreateOutfit");
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // --- RENAME LOGIC ---
  const openRenameModal = (item) => {
    setItemToRename(item);
    setNewNameText(item.name); // Pre-fill with current name
    setRenameModalVisible(true);
  };

  const handleSaveRename = () => {
    if (!itemToRename || !newNameText.trim()) {
      setRenameModalVisible(false);
      return;
    }

    const updateList = (list) =>
      list.map((item) =>
        item.id === itemToRename.id ? { ...item, name: newNameText } : item,
      );

    // Try to update both lists (since we don't strictly know which one it came from without checking)
    setFavoriteOutfits((prev) => updateList(prev));
    setCustomOutfits((prev) => updateList(prev));

    setRenameModalVisible(false);
    setItemToRename(null);
  };

  const handleDeleteOutfit = (item) => {
      Alert.alert(
          "Delete Outfit",
          "Are you sure you want to delete this outfit?",
          [
              { text: "Cancel", style: "cancel" },
              { 
                  text: "Delete", 
                  style: "destructive", 
                  onPress: async () => {
                      try {
                          const res = await deleteOutfit(item.id);
                          
                          if (!res.success) {
                              showError(errorHandler.formatErrorForUser(res.error));
                              return;
                          }
                          
                          const filterFunc = (o) => o.id !== item.id;
                          setFavoriteOutfits(prev => prev.filter(filterFunc));
                          setCustomOutfits(prev => prev.filter(filterFunc));
                          setDislikedOutfits(prev => prev.filter(filterFunc));
                      } catch (error) {
                          const standardError = errorHandler.handleApiError(error);
                          showError(errorHandler.formatErrorForUser(standardError));
                      }
                  }
              }
          ]
      );
  };

  const handleClearAllDisliked = () => {
    Alert.alert(
        "Clear All",
        "Are you sure want to delete all disliked outfit records and reset?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Reset", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        const res = await clearDislikedOutfits();
                        
                        if (!res.success) {
                            showError(errorHandler.formatErrorForUser(res.error));
                            return;
                        }
                        
                        setDislikedOutfits([]);
                    } catch (error) {
                        const standardError = errorHandler.handleApiError(error);
                        showError(errorHandler.formatErrorForUser(standardError));
                    }
                }
            }
        ]
    );
  };

  const renderOutfitItem = ({ item }) => {
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity
        style={styles.cardContainer}
        activeOpacity={0.9}
        onPress={() => toggleExpand(item.id)}
      >
        {/* HEADER */}
        <View style={styles.cardHeader}>
          <View style={styles.cardImageContainer}>
            <Ionicons
              name="shirt-outline"
              size={30}
              color={COLORS.secondaryText}
            />
          </View>

          <View style={styles.cardInfo}>
            {/* Title Row with Edit Pencil */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.cardTitle}>{item.name}</Text>

              {/* RENAME BUTTON */}
              <TouchableOpacity
                style={styles.renameIconArea}
                onPress={(e) => {
                  e.stopPropagation(); // Prevent card from expanding when clicking pencil
                  openRenameModal(item);
                }}
              >
                <Ionicons name="pencil" size={16} color={COLORS.gray} />
              </TouchableOpacity>

              {/* DELETE BUTTON */}
              <TouchableOpacity
                style={styles.deleteIconArea}
                onPress={(e) => {
                  e.stopPropagation(); 
                  handleDeleteOutfit(item);
                }}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.error || '#FF6B6B'} />
              </TouchableOpacity>
            </View>

            <View style={styles.cardMetaContainer}>
              <Text style={styles.cardDate}>{item.date}</Text>
              <Text style={styles.cardItemCount}>{item.items} Items</Text>
            </View>
          </View>

          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={COLORS.gray}
          />
        </View>

        {/* BODY */}
        {isExpanded && (
          <View style={styles.cardBody}>
            <View style={styles.divider} />
            <Text style={styles.itemsLabel}>Items in this outfit:</Text>

            {item.outfitItems && item.outfitItems.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {item.outfitItems.map((clothing, index) => (
                  <View
                    key={clothing.id || index}
                    style={styles.clothingItemBox}
                  >
                    {clothing.imageUrl &&
                    !clothing.imageUrl.includes("placeholder") ? (
                      <Image
                        source={{ uri: clothing.imageUrl }}
                        style={styles.clothingImage}
                      />
                    ) : (
                      <Ionicons
                        name="shirt"
                        size={24}
                        color={COLORS.secondaryText}
                      />
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noItemsText}>
                No details available for this outfit.
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={COLORS.gradient} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "favorites" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("favorites")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "favorites" && styles.activeTabText,
              ]}
            >
              Favorites
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "custom" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("custom")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "custom" && styles.activeTabText,
              ]}
            >
              My Creations
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "disliked" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("disliked")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "disliked" && styles.activeTabText,
              ]}
            >
              Disliked
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={currentData}
          renderItem={renderOutfitItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchOutfits}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                  {loading ? "Loading..." : "No outfits yet."}
              </Text>
            </View>
          }
        />

        {activeTab === 'disliked' && dislikedOutfits.length > 0 && (
            <View style={styles.floatingActionContainer}>
                 <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAllDisliked}>
                    <Text style={styles.clearAllText}>Hepsini Temizle</Text>
                    <Ionicons name="trash-bin-outline" size={20} color={COLORS.white} style={{ marginLeft: 5 }} />
                 </TouchableOpacity>
            </View>
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateOutfit}
          activeOpacity={0.8}
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        >
          <Ionicons name="add" size={32} color={COLORS.white} />
        </TouchableOpacity>

        {/* --- RENAME MODAL --- */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isRenameModalVisible}
          onRequestClose={() => setRenameModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rename Outfit</Text>
              <TextInput
                style={styles.modalInput}
                value={newNameText}
                onChangeText={setNewNameText}
                autoFocus={true}
                selectTextOnFocus={true}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setRenameModalVisible(false)}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnSave]}
                  onPress={handleSaveRename}
                >
                  <Text
                    style={[styles.modalBtnText, { color: COLORS.primaryText }]}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginVertical: 15,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTabButton: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  activeTabText: { color: COLORS.primaryText },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },

  // --- CARD STYLES ---
  cardContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    flexDirection: "column",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardImageContainer: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.gradient[0],
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  renameIconArea: {
    padding: 5,
    marginLeft: 5,
  },
  deleteIconArea: {
    padding: 5,
    marginLeft: 8,
  },
  cardMetaContainer: { flexDirection: "row" },
  cardDate: { fontSize: 12, color: COLORS.textSecondary, marginRight: 10 },
  cardItemCount: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },

  // --- EXPANDED BODY ---
  cardBody: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.secondary,
    marginBottom: 10,
  },
  itemsLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  clothingItemBox: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.gradient[0],
    borderRadius: 8,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.secondary,
    overflow: "hidden",
  },
  clothingImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  noItemsText: {
    color: COLORS.gray,
    fontSize: 12,
    fontStyle: "italic",
  },

  fab: {
    position: "absolute",
    bottom: 15,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  
  floatingActionContainer: {
     position: 'absolute',
     bottom: 90, 
     alignSelf: 'center',
     width: '100%',
     alignItems: 'center',
     zIndex: 999
  },
  clearAllButton: {
      backgroundColor: COLORS.error || '#FF6B6B',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 25,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
  },
  clearAllText: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: 14,
  },

  emptyContainer: { marginTop: 50, alignItems: "center" },
  emptyText: { color: COLORS.gray, fontSize: 16 },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: COLORS.gradient[0], // Darker input bg
    color: COLORS.textPrimary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalBtnCancel: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  modalBtnSave: {
    backgroundColor: COLORS.primary,
  },
  modalBtnText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
});

export default OutfitScreen;
