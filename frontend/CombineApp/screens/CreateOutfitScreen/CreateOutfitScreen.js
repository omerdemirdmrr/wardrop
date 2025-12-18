import React, { useState, useEffect } from "react";
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

// --- GRID CALCULATIONS ---
const { width } = Dimensions.get("window");
const COLUMN_COUNT = 3;
const SPACING = 10;
const PADDING = 20; // Total side padding (20)
// Formula: (Screen Width - Side Padding - (Space between items * 2)) / 3
const ITEM_SIZE =
  (width - PADDING * 2 - SPACING * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

const CreateOutfitScreen = ({ navigation }) => {
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
    if (selectedItems.find((i) => i.id === item.id)) {
      setSelectedItems((prev) => prev.filter((i) => i.id !== item.id));
    } else {
      setSelectedItems((prev) => [...prev, item]);
    }
  };

  const handleSaveOutfit = () => {
    if (!outfitName.trim()) {
      Alert.alert("Missing Info", "Please name your outfit.");
      return;
    }
    if (selectedItems.length === 0) {
      Alert.alert("Empty", "Select at least one item.");
      return;
    }

    const newOutfit = {
      id: Math.random().toString(),
      name: outfitName,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      items: selectedItems.length,
      outfitItems: selectedItems, // <--- ADD THIS LINE!
    };

    // Navigate back to the specific tab and screen
    navigation.navigate("MainTabs", {
      screen: "Outfits",
      params: { newOutfit: newOutfit },
    });
  };

  const renderGridItem = ({ item }) => {
    const isSelected = selectedItems.find((i) => i.id === item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.gridItem, isSelected && styles.gridItemSelected]}
        onPress={() => toggleSelection(item)}
      >
        {/* Fallback Icon if image fails or is a placeholder */}
        {item.imageUrl && !item.imageUrl.includes("placeholder") ? (
          <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
        ) : (
          <Ionicons
            name="shirt-outline"
            size={30}
            color={COLORS.secondaryText}
          />
        )}

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
                <View key={item.id} style={styles.previewBox}>
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
            keyExtractor={(item) => item.id}
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
    width: ITEM_SIZE, // STRICT WIDTH
    height: ITEM_SIZE, // STRICT HEIGHT (Square)
    backgroundColor: COLORS.card,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING,
    borderWidth: 2,
    borderColor: "transparent",
    // NO flex: 1 here!
  },
  gridItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(177, 59, 255, 0.1)",
  },
  gridImage: { width: "80%", height: "80%", resizeMode: "contain" },
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
