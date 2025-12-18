import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Dimensions // YENİ: Ekran genişliği hesapları için
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../colors';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as clothingApi from '../../api/clothing';
import ClothingCard from '../../components/ClothingCard';
import ClothingDetailModal from '../../components/ClothingDetailModal';
import SelectionModal from '../../components/SelectionModal';
import { CATEGORIES, COLORS_OPTIONS, SEASONS } from '../../constants/options';

const WardrobeScreen = ({ navigation }) => {
    // --- STATE ---
    const [clothes, setClothes] = useState([]);           
    const [loading, setLoading] = useState(true);         
    
    // Arama ve Filtreleme State'leri
    const [searchQuery, setSearchQuery] = useState('');           
    const [filteredClothes, setFilteredClothes] = useState([]);   
    const [filtersVisible, setFiltersVisible] = useState(false);  
    
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [isAnyFilterActive, setIsAnyFilterActive] = useState(false);

    // Modal State
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
    const [isColorModalVisible, setColorModalVisible] = useState(false);
    const [isSeasonModalVisible, setSeasonModalVisible] = useState(false);

    // --- YENİ FONKSİYON: Listeyi Çift Sayıya Tamamlama ---
    // Bu fonksiyon, liste tek sayıdaysa sonuna görünmez bir eleman ekler.
    const formatData = (dataList, numColumns) => {
        if (!dataList) return [];
        
        const totalRows = Math.floor(dataList.length / numColumns);
        let totalLastRow = dataList.length - (totalRows * numColumns);

        // Eğer son satırda eksik eleman varsa (tek sayıysa)
        if (totalLastRow !== 0 && totalLastRow !== numColumns) {
            // Orijinal diziyi bozmamak için kopyasını alıp ekleme yapıyoruz
            const newData = [...dataList];
            newData.push({ id: 'blank-item', empty: true });
            return newData;
        }
        return dataList;
    };

    // --- VERİ ÇEKME ---
    const fetchClothes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await clothingApi.getClothingItems();
            if (response && Array.isArray(response.data)) {
                setClothes(response.data);          
                setFilteredClothes(response.data);  
            } else {
                Alert.alert("Hata", "Kıyafetler yüklenemedi.");
                setClothes([]);
            }
        } catch (error) {
            console.error("Kıyafet çekme hatası:", error);
            Alert.alert("Hata", "Beklenmedik bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchClothes();
        }, [fetchClothes])
    );

    // --- FİLTRELEME MANTIĞI ---
    useEffect(() => {
        let result = clothes; 

        const anyFilterActive = searchQuery || selectedCategory || selectedColor || selectedSeason;
        setIsAnyFilterActive(anyFilterActive);

        if (searchQuery) {
            result = result.filter(item =>
                item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (selectedCategory) {
            const categoryLabel = CATEGORIES.find(c => c.value === selectedCategory)?.label;
            result = result.filter(item => item.category === categoryLabel);
        }
        if (selectedColor) {
            const colorLabel = COLORS_OPTIONS.find(c => c.value === selectedColor)?.label;
            result = result.filter(item => item.color === colorLabel || item.color1 === selectedColor); 
        }
        if (selectedSeason) {
            const seasonLabel = SEASONS.find(s => s.value === selectedSeason)?.label;
            result = result.filter(item => item.season === seasonLabel);
        }

        setFilteredClothes(result);
    }, [clothes, searchQuery, selectedCategory, selectedColor, selectedSeason]);

    // --- HANDLERS ---
    const handleCardLongPress = (item) => {
        setSelectedItem(item);
        setDetailModalVisible(true);
    };

    const handleCloseDetailModal = () => {
        setDetailModalVisible(false);
        setSelectedItem(null);
    };
    
    const handleClearFilters = () => {
        setSelectedCategory(null);
        setSelectedColor(null);
        setSelectedSeason(null);
        setSearchQuery('');
    };
    
    const handleSelectCategory = (category) => {
        setSelectedCategory(category.value);
        setCategoryModalVisible(false);
    };
    const handleSelectColor = (color) => {
        setSelectedColor(color.value);
        setColorModalVisible(false);
    };
    const handleSelectSeason = (season) => {
        setSelectedSeason(season.value);
        setSeasonModalVisible(false);
    };

    const handleAddPhoto = () => navigation.navigate('AddClothing');

    // --- RENDER ITEM GÜNCELLEMESİ ---
    const renderItem = ({ item }) => {
        // Eğer bu eleman bizim eklediğimiz boş elemansa, görünmez bir kutu çiz
        if (item.empty === true) {
            return <View style={[styles.itemInvisible, { flex: 1, margin: 8}]} />;
        }
        
        return (
            <ClothingCard 
                item={item}
                onCardLongPress={() => handleCardLongPress(item)}
            />
        );
    };

    const getButtonText = (options, value) => {
        if (!value) return null;
        return options.find(opt => opt.value === value)?.label;
    };

    const handleUpdateTrigger = () => {
        console.log("Liste güncelleniyor...");
        fetchClothes(); // Listeyi sunucudan/dummydatan tekrar çek
    };

    return (
        <LinearGradient colors={COLORS.gradient} style={styles.gradient}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search in your wardrobe..."
                            placeholderTextColor={COLORS.gray}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity style={styles.filterButton} onPress={() => setFiltersVisible(!filtersVisible)}>
                        <Ionicons name="filter" size={24} color={filtersVisible ? COLORS.primary : COLORS.secondaryText} />
                    </TouchableOpacity>
                </View>

                {filtersVisible && (
                    <View style={styles.filtersContainer}>
                        <TouchableOpacity style={styles.filterChip} onPress={() => setCategoryModalVisible(true)}>
                            <Text style={styles.filterChipText}>{getButtonText(CATEGORIES, selectedCategory) || 'Category'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.filterChip} onPress={() => setColorModalVisible(true)}>
                            <Text style={styles.filterChipText}>{getButtonText(COLORS_OPTIONS, selectedColor) || 'Color'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.filterChip} onPress={() => setSeasonModalVisible(true)}>
                            <Text style={styles.filterChipText}>{getButtonText(SEASONS, selectedSeason) || 'Season'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
                            <Text style={styles.clearButtonText}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
                ) : (
                    <FlatList
                        // YENİ: formatData fonksiyonunu burada kullanıyoruz
                        data={formatData(filteredClothes, 2)}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                        numColumns={2}
                        style={styles.list}
                        contentContainerStyle={{ paddingBottom: 80 }}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                {isAnyFilterActive ? (
                                    <>
                                        <Text style={styles.emptyMessage}>Filtrelere uygun eşya bulunamadı.</Text>
                                        <Text style={styles.emptySubMessage}>Aramayı veya filtreleri değiştirmeyi dene.</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.emptyMessage}>Wardrobe is empty.</Text>
                                        <Text style={styles.emptySubMessage}>Yeni kıyafet eklemek için '+' butonuna bas.</Text>
                                    </>
                                )}
                            </View>
                        }
                    />
                )}

                <TouchableOpacity 
                    style={styles.fab} 
                    onPress={handleAddPhoto}
                    activeOpacity={0.8}
                    hitSlop={{top: 5, bottom: 5, left: 5, right: 5}}
                >
                    <Ionicons name="add" size={32} color={COLORS.white} />
                </TouchableOpacity>
                
                <ClothingDetailModal 
                    visible={detailModalVisible}
                    item={selectedItem}
                    onClose={handleCloseDetailModal}
                    onUpdateTrigger={handleUpdateTrigger}
                />
                
                <SelectionModal
                    visible={isCategoryModalVisible}
                    options={CATEGORIES}
                    onClose={() => setCategoryModalVisible(false)}
                    onSelect={handleSelectCategory}
                    modalTitle="Select a Category"
                />
                <SelectionModal
                    visible={isColorModalVisible}
                    options={COLORS_OPTIONS}
                    onClose={() => setColorModalVisible(false)}
                    onSelect={handleSelectColor}
                    modalTitle="Select a Color"
                />
                <SelectionModal
                    visible={isSeasonModalVisible}
                    options={SEASONS}
                    onClose={() => setSeasonModalVisible(false)}
                    onSelect={handleSelectSeason}
                    modalTitle="Select a Season"
                />

            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 5,
        backgroundColor: 'transparent',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 25,
        height: 45,
        paddingHorizontal: 15,
        marginRight: 10,
    },
    searchIcon: { marginRight: 10 },
    searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    filterButton: {
        width: 45,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 25,
    },
    filtersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        paddingBottom: 10,
        alignItems: 'center',
    },
    filterChip: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginRight: 8,
        marginBottom: 8,
    },
    filterChipText: {
        color: COLORS.primaryText,
        fontSize: 14,
    },
    clearButton: {
        backgroundColor: '#E74C3C', 
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginBottom: 8,
    },
    clearButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    list: {
        flex: 1,
        paddingHorizontal: 5,
    },
    // YENİ: Görünmez kutu stili
    itemInvisible: {
        backgroundColor: 'transparent',
    },
    fab: {
        position: 'absolute',
        bottom: 15,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        zIndex: 1000, // Diğer öğelerin üzerinde kalmasını sağlar
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '40%',
    },
    emptyMessage: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textSecondary,
    },
    emptySubMessage: {
        fontSize: 14,
        color: COLORS.gray,
        marginTop: 8,
    },
});

export default WardrobeScreen;
