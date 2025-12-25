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
import { COLORS_OPTIONS } from '../../constants/options'; // Renk listesi
import SelectionModal from '../../components/SelectionModal'; // Seçim Modalı

const AddClothingScreen = ({ navigation }) => {
  // --- STATE ---
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false); 
  
  // AI Sonuçları ve Kullanıcı Düzenlemeleri
  const [aiResult, setAiResult] = useState(null);
  const [name, setName] = useState(''); // Kullanıcının gireceği isim
  const [color1, setColor1] = useState(null); // Seçilen Renk 1 Objesi {label, value}
  const [color2, setColor2] = useState(null); // Seçilen Renk 2 Objesi {label, value}

  // Modal Kontrolü
  const [modalVisible, setModalVisible] = useState(false);
  const [activeColorSelection, setActiveColorSelection] = useState(null); // 'color1' veya 'color2'

  // --- RESİM SEÇME VE ANALİZ ---
  const handleImagePicked = async (uri) => {
    setImageUri(uri);
    setAiResult(null); 
    setAnalyzing(true); 

    try {
        const response = await analyzeImageWithAI(uri);
        
        if (response.success && response.data && response.data.kiyafet_analizi && response.data.kiyafet_analizi.success) {
            const analysis = response.data.kiyafet_analizi;
            setAiResult(response.data);
            
            const anaRenk = analysis.renk_paleti?.ana_renk;
            const ikincilRenk = analysis.renk_paleti?.ikincil_renk;
            const kategori = analysis.genel_bilgi?.kategori;
            const tur = analysis.genel_bilgi?.tur;
            const mevsim = analysis.stil_kullanimi?.tarz?.[0] || 'Tüm Mevsimler';

            const foundColor1 = COLORS_OPTIONS.find(c => c.label.toLowerCase() === anaRenk?.toLowerCase());
            const foundColor2 = COLORS_OPTIONS.find(c => c.label.toLowerCase() === ikincilRenk?.toLowerCase());

            setColor1(foundColor1 || null);
            setColor2(foundColor2 || null);
            
            setName(`${mevsim} ${tur}`);

        } else {
            const errorMessage = response.error || "Görüntü analiz edilemedi.";
            Alert.alert("Hata", errorMessage);
        }
    } catch (error) {
        console.error(error);
        Alert.alert("Hata", "Analiz sırasında bir sorun oluştu.");
    } finally {
        setAnalyzing(false);
    }
  };

  const pickImageGallery = async () => {
    if (loading || analyzing) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Reddedildi', 'Galeriye erişim izni gerekiyor.');
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
      Alert.alert('İzin Reddedildi', 'Kamera izni gerekiyor.');
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

  // --- RENK SEÇİMİ ---
  const openColorModal = (selectionType) => {
    setActiveColorSelection(selectionType);
    setModalVisible(true);
  };

  const handleColorSelect = (item) => {
    if (activeColorSelection === 'color1') {
        setColor1(item);
    } else {
        setColor2(item);
    }
    // Modalı kapatma işlemi SelectionModal içinde yapılıyor veya burada setModalVisible(false) çağırabiliriz.
    // SelectionModal component'in mevcut yapısında onSelect ve onClose ayrı çalışıyor.
  };

  // --- KAYDETME İŞLEMİ (Arka Plan Silme Dahil) ---
  const handleSave = async () => {
    if (!name) {
        Alert.alert('Eksik Bilgi', 'Lütfen kıyafete bir isim verin.');
        return;
    }
    if (!color1) {
        Alert.alert('Eksik Bilgi', 'Lütfen en az bir ana renk seçin.');
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

      // Kaydet
      const saveResponse = await saveClothingItem(finalJson);
      if (!saveResponse.success) throw new Error('Veritabanına kayıt başarısız.');

      Alert.alert('Harika!', 'Kıyafet gardırobuna eklendi.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);

    } catch (error) {
      Alert.alert('Hata', error.message || 'Beklenmedik bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Renk Seçim Kutusu Bileşeni
  const ColorSelector = ({ label, value, onPress }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity style={styles.selector} onPress={onPress}>
            <Text style={value ? styles.selectorText : styles.placeholderText}>
                {value ? value.label : "Renk Seçiniz"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
        </TouchableOpacity>
    </View>
  );

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
                <Text style={styles.placeholderText}>Kıyafetini Yükle</Text>
              </View>
            )}
            
            {/* Yükleniyor Overlay */}
            {analyzing && (
                <View style={styles.analyzingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.analyzingText}>Yapay Zeka Analiz Ediyor...</Text>
                </View>
            )}
          </View>
          
          {/* 2. BUTONLAR (Resim yoksa veya analiz bitmediyse) */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.imageButton} onPress={pickImageCamera} disabled={loading || analyzing}>
              <Ionicons name="camera" size={20} color={COLORS.primaryText} />
              <Text style={styles.imageButtonText}>Kamera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton} onPress={pickImageGallery} disabled={loading || analyzing}>
              <Ionicons name="images" size={20} color={COLORS.primaryText} />
              <Text style={styles.imageButtonText}>Galeri</Text>
            </TouchableOpacity>
          </View>
          
          {/* 3. SONUÇ VE DÜZENLEME ALANI */}
          {aiResult && !analyzing && (
            <View style={styles.resultContainer}>
                <Text style={styles.sectionTitle}>Analiz Tamamlandı</Text>
                
                {/* İSİM GİRİŞİ */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Kıyafet Adı</Text>
                    <TextInput 
                        style={styles.textInput}
                        value={name}
                        onChangeText={setName}
                        placeholder="Örn: Mavi Gömleğim"
                        placeholderTextColor={COLORS.gray}
                    />
                </View>

                {/* AI BİLGİ KARTI */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Kategori:</Text>
                        <Text style={styles.infoValue}>{aiResult.kiyafet_analizi?.genel_bilgi?.kategori}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Tür:</Text>
                        <Text style={styles.infoValue}>{aiResult.kiyafet_analizi?.genel_bilgi?.tur}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Mevsim:</Text>
                        <Text style={styles.infoValue}>{aiResult.kiyafet_analizi?.stil_kullanimi?.tarz?.[0] || 'Tüm Mevsimler'}</Text>
                    </View>
                </View>

                <Text style={styles.instructionText}>Renkleri aşağıdan değiştirebilirsin:</Text>

                {/* RENK SEÇİMLERİ (Dropdown) */}
                <ColorSelector 
                    label="Baskın Renk (Color 1)" 
                    value={color1} 
                    onPress={() => openColorModal('color1')} 
                />
                
                <ColorSelector 
                    label="İkincil Renk (Color 2)" 
                    value={color2} 
                    onPress={() => openColorModal('color2')} 
                />

                {/* KAYDET BUTONU */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color={COLORS.primaryText} />
                    ) : (
                        <Text style={styles.saveButtonText}>Kaydet</Text>
                    )}
                </TouchableOpacity>
            </View>
          )}

        </ScrollView>

        {/* RENK SEÇİM MODALI */}
        <SelectionModal 
            visible={modalVisible}
            options={COLORS_OPTIONS}
            onSelect={handleColorSelect}
            onClose={() => setModalVisible(false)}
            modalTitle="Renk Seçin"
        />

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