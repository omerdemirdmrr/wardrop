import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../colors';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// API ve Sabitler
import { saveClothingItem } from '../../api/clothing';
import { analyzeImageWithAI } from '../../api/clothingAnalyze';
import { COLORS_OPTIONS } from '../../constants/options';
import { useError } from '../../context/ErrorContext';
import { errorHandler } from '../../utils';

const AddClothingScreen = ({ navigation }) => {
  const { showError } = useError();
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // AI Sonuçları ve Kullanıcı Düzenlemeleri
  const [aiResult, setAiResult] = useState(null);
  const [name, setName] = useState(''); // Kullanıcının gireceği isim
  const [color1, setColor1] = useState(null); // Seçilen Renk 1 Objesi {label, value}
  const [color2, setColor2] = useState(null); // Seçilen Renk 2 Objesi {label, value}

  // Modal Kontrolü

  // --- RESİM SEÇME VE ANALİZ ---
  const handleImagePicked = async (uri) => {
    setImageUri(uri);
    setAiResult(null);
    setAnalyzing(true);

    try {
      const response = await analyzeImageWithAI(uri);

      if (!response.success) {
        showError(errorHandler.formatErrorForUser(response.error));
        return;
      }

      if (!response.data?.clothing_analysis?.success) {
        showError({
          title: 'Not Clothing',
          message: 'Please upload an image of clothing or accessories',
          category: 'VALIDATION'
        });
        return;
      }

      const analysis = response.data.clothing_analysis;
      setAiResult(response.data);

      const primaryColor = analysis.color_palette?.primary_color;
      const secondaryColor = analysis.color_palette?.secondary_color;
      const category = analysis.general_info?.category;
      const type = analysis.general_info?.type;
      const season = analysis.general_info?.season || 'All Seasons';

      const foundColor1 = COLORS_OPTIONS.find(c => c.label.toLowerCase() === primaryColor?.toLowerCase());
      const foundColor2 = COLORS_OPTIONS.find(c => c.label.toLowerCase() === secondaryColor?.toLowerCase());

      const finalColor1 = foundColor1 || (primaryColor ? { label: primaryColor, value: primaryColor } : null);
      const finalColor2 = foundColor2 || (secondaryColor ? { label: secondaryColor, value: secondaryColor } : null);

      setColor1(finalColor1);
      setColor2(finalColor2);

      const namePrefix = primaryColor ? `${primaryColor} ` : '';
      setName(`${namePrefix}${type}`);

    } catch (error) {
      const standardError = errorHandler.handleApiError(error);
      showError(errorHandler.formatErrorForUser(standardError));
    } finally {
      setAnalyzing(false);
    }
  };

  const pickImageGallery = async () => {
    if (loading || analyzing) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showError({
        title: 'Permission Required',
        message: 'Gallery access permission is required',
        category: 'PERMISSION'
      });
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4], // Kıyafet için dikey daha iyi olabilir
      quality: 1,
    });
    if (!result.canceled) {
      handleImagePicked(result.assets[0].uri);
    }
  };

  const pickImageCamera = async () => {
    if (loading || analyzing) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showError({
        title: 'Permission Required',
        message: 'Camera permission is required',
        category: 'PERMISSION'
      });
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });
    if (!result.canceled) {
      handleImagePicked(result.assets[0].uri);
    }
  };


  // --- KAYDETME İŞLEMİ (Arka Plan Silme Dahil) ---
  const handleSave = async () => {
    if (!name) {
      showError({
        title: 'Validation Error',
        message: 'Please provide a name for the clothing item',
        category: 'VALIDATION'
      });
      return;
    }
    if (!color1) {
      showError({
        title: 'Validation Error',
        message: 'Please select at least one color',
        category: 'VALIDATION'
      });
      return;
    }

    setLoading(true);

    try {
      // Final veriyi hazırla
      const finalJson = {
        ...aiResult,          // category, season vb.
        name: name,           // Kullanıcının girdiği isim
        color1: color1.value, // Seçilen rengin değeri (örn: 'red')
        color2: color2 ? color2.value : null,
        imageUrl: imageUri // Orjinal resim
      };

      console.log("Saving JSON:", finalJson);

      const saveResponse = await saveClothingItem(finalJson);
      
      if (saveResponse.success) {
        navigation.goBack();
      } else {
        showError(errorHandler.formatErrorForUser(saveResponse.error));
      }

    } catch (error) {
      const standardError = errorHandler.handleApiError(error);
      showError(errorHandler.formatErrorForUser(standardError));
    } finally {
      setLoading(false);
    }
  };


  return (
    <LinearGradient colors={COLORS.gradient} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

          {/* 1. RESİM ALANI */}
          <View style={styles.imagePickerContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="shirt-outline" size={60} color={COLORS.gray} />
                <Text style={styles.placeholderText}>Load Your Clothing</Text>
              </View>
            )}

            {/* Yükleniyor Overlay */}
            {analyzing && (
              <View style={styles.analyzingOverlay}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.analyzingText}>AI is Analyzing...</Text>
              </View>
            )}
          </View>

          {/* 2. BUTONLAR (Resim yoksa veya analiz bitmediyse) */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.imageButton} onPress={pickImageCamera} disabled={loading || analyzing}>
              <Ionicons name="camera" size={20} color={COLORS.primaryText} />
              <Text style={styles.imageButtonText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton} onPress={pickImageGallery} disabled={loading || analyzing}>
              <Ionicons name="images" size={20} color={COLORS.primaryText} />
              <Text style={styles.imageButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {/* 3. SONUÇ VE DÜZENLEME ALANI */}
          {aiResult && !analyzing && (
            <View style={styles.resultContainer}>
              <Text style={styles.sectionTitle}>Analysis Completed</Text>

              {/* İSİM GİRİŞİ */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Clothing Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Example: My Blue Shirt"
                  placeholderTextColor={COLORS.gray}
                />
              </View>

              {/* AI BİLGİ KARTI */}
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>category:</Text>
                  <Text style={styles.infoValue}>{aiResult.clothing_analysis?.general_info?.category}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Type:</Text>
                  <Text style={styles.infoValue}>{aiResult.clothing_analysis?.general_info?.type}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>season:</Text>
                  <Text style={styles.infoValue}>{aiResult.clothing_analysis?.general_info?.season || 'Tüm seasonler'}</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>primary Color:</Text>
                  <Text style={styles.infoValue}>{color1 ? color1.label : 'Belirlenemedi'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>secondary Color:</Text>
                  <Text style={styles.infoValue}>{color2 ? color2.label : '-'}</Text>
                </View>
              </View>

              {/* KAYDET BUTONU */}
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={COLORS.primaryText} />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>


      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  imagePickerContainer: {
    height: 300,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 15,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // Kıyafetin tamamı görünsün
  },
  imagePlaceholder: { alignItems: 'center' },
  placeholderText: {
    color: COLORS.gray,
    fontSize: 16,
    marginTop: 10,
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: COLORS.white,
    marginTop: 10,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 10,
  },
  imageButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  imageButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 8
  },
  resultContainer: {
    backgroundColor: COLORS.card,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: { marginBottom: 15 },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  selectorText: { fontSize: 16, color: COLORS.white },
  placeholderText: { fontSize: 16, color: COLORS.gray },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  infoLabel: { color: COLORS.gray, fontSize: 15 },
  infoValue: { color: COLORS.white, fontSize: 15, fontWeight: 'bold' },
  instructionText: {
    color: COLORS.gray,
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddClothingScreen;