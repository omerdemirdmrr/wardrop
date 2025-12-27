import React, { useState, useEffect} from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions, // 1. Import Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../colors";
import * as clothingApi from "../../api/clothing";
import * as outfitsApi from "../../api/outfits";
import { useError } from "../../context/ErrorContext";
import { errorHandler } from "../../utils";

// --- GRID CALCULATIONS ---
const { width } = Dimensions.get("window");
const COLUMN_COUNT = 3;
const SPACING = 10;
const PADDING = 20; // Total side padding (20)
// Formula: (Screen Width - Side Padding - (Space between items * 2)) / 3
const ITEM_SIZE =
  (width - PADDING * 2 - SPACING * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

const CreateOutfitScreen = ({ navigation }) => {
  const { showError } = useError();
  const [outfitName, setOutfitName] = useState("");
  const [clothes, setClothes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    const loadWardrobe = async () => {
      try {
        const response = await clothingApi.getClothingItems();
        if (response.success) {
          setClothes(response.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadWardrobe();
  }, []);

  const toggleSelection = (item) => {
    const itemId = item._id || item.id;
    if (selectedItems.find((i) => (i._id || i.id) === itemId)) {
      setSelectedItems((prev) => prev.filter((i) => (i._id || i.id) !== itemId));
    } else {
      setSelectedItems((prev) => [...prev, item]);
    }
  };

  const handleSaveOutfit = async () => {
    if (!outfitName.trim()) {
      showError({
        title: 'Validation Error',
        message: 'Please name your outfit',
        category: 'VALIDATION'
      });
      return;
    }
    if (selectedItems.length === 0) {
      showError({
        title: 'Validation Error',
        message: 'Select at least one item',
        category: 'VALIDATION'
      });
      return;
    }

    setLoading(true);
    try {
      // Extract only the IDs from selected items
      const itemIds = selectedItems.map(item => item._id || item.id);
      
      const response = await outfitsApi.createOutfit(outfitName, itemIds);
      
      if (response.success) {
        // Navigate back to Outfits screen
        navigation.navigate("MainTabs", {
          screen: "Outfits",
        });
      } else {
        showError(errorHandler.formatErrorForUser(response.error));
      }
    } catch (error) {
      showError({
        title: 'Error',
        message: 'Failed to create outfit',
        category: 'SERVER'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderGridItem = ({ item }) => {
    const itemId = item._id || item.id;
    const isSelected = selectedItems.find((i) => (i._id || i.id) === itemId);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.gridItem, isSelected && styles.gridItemSelected]}
        onPress={() => toggleSelection(item)}
      >
        <View style={styles.imageContainer}>
          {item.imageUrl && !item.imageUrl.includes("placeholder") ? (
            <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
          ) : (
            <Ionicons
              name="shirt-outline"
              size={40}
              color={COLORS.secondaryText}
            />
          )}
        </View>

        <Text style={styles.itemName} numberOfLines={1}>
          {item.name || "Unnamed"}
        </Text>

        {isSelected && (
          <View style={styles.checkIcon}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={COLORS.primary}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={COLORS.gradient} style={styles.gradient}>
      <View style={styles.container}>
        {/* Input Section */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Outfit Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Cinema Night"
            placeholderTextColor={COLORS.gray}
            value={outfitName}
            onChangeText={setOutfitName}
          />
        </View>

        {/* Preview Section */}
        {selectedItems.length > 0 && (
          <View style={styles.previewContainer}>
            <Text style={styles.label}>Selected ({selectedItems.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedItems.map((item) => (
                <View key={item._id || item.id} style={styles.previewBox}>
                  <Ionicons
                    name="shirt"
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={[styles.label, { marginHorizontal: 20, marginTop: 10 }]}>
          Select Items
        </Text>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={clothes}
            renderItem={renderGridItem}
            keyExtractor={(item) => item._id || item.id}
            numColumns={COLUMN_COUNT}
            // This aligns the columns properly
            columnWrapperStyle={{ gap: SPACING }}
            contentContainerStyle={styles.listContent}
          />
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveOutfit}
          >
            <Text style={styles.saveButtonText}>Save Outfit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  inputContainer: { padding: 20, backgroundColor: "rgba(0,0,0,0.2)" },
  label: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "bold",
  },
  textInput: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    color: COLORS.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  previewContainer: { paddingVertical: 10, paddingLeft: 20 },
  previewBox: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },

  // --- GRID STYLES ---
  listContent: {
    paddingHorizontal: PADDING,
    paddingTop: 10,
    paddingBottom: 100,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE + 25, // Extra space for name
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 8,
    marginBottom: SPACING,
    borderWidth: 2,
    borderColor: "transparent",
  },
  gridItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(177, 59, 255, 0.1)",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 8,
  },
  itemName: {
    fontSize: 11,
    color: COLORS.textPrimary,
    textAlign: "center",
    fontWeight: "500",
  },
  checkIcon: { position: "absolute", top: 5, right: 5 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.gradient[0],
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
	marginBottom: 30,//save outfit button çakışmasını önlemek için margin bottom ekledim
  },
  saveButtonText: {
    color: COLORS.primaryText,
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default CreateOutfitScreen;
