import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../colors';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import apiClient from '../../api/client';
import { errorHandler } from '../../utils';

// Seçenek listeleri
const AVAILABLE_STYLES = ['Casual', 'Minimalist', 'Streetwear', 'Boho', 'Vintage', 'Formal', 'Sporty'];
const AVAILABLE_COLORS = [
    COLORS.primary, COLORS.secondary, '#d1c4e9', '#FF6B6B',
    '#4ECDC4', '#F9E79F', '#34495E', '#E74C3C', '#2ECC71',
];

const EditStyleScreen = ({ navigation }) => {
    const { user, updateUser } = useAuth();
    const { showError } = useError();

    const [selectedColors, setSelectedColors] = useState(user.favoriteColors || []);
    const [selectedStyles, setSelectedStyles] = useState(user.stylePreferences || []);
    const [loading, setLoading] = useState(false);

    // --- RENK SEÇİMİ (TOGGLE) ---
    const toggleColor = (color) => {
        const isSelected = selectedColors.includes(color);
        if (isSelected) {
            // Zaten seçiliyse listeden çıkar
            setSelectedColors(selectedColors.filter(c => c !== color));
        } else {
            if (selectedColors.length < 3) {
                setSelectedColors([...selectedColors, color]);
            } else {
                showError({
                    title: 'Validation Error',
                    message: 'Maximum 3 favorite colors allowed',
                    category: 'VALIDATION'
                });
            }
        }
    };

    // --- STİL SEÇİMİ (TOGGLE) ---
    const toggleStyle = (style) => {
        const isSelected = selectedStyles.includes(style);
        if (isSelected) {
            // Seçiliyse çıkar
            setSelectedStyles(selectedStyles.filter(s => s !== style));
        } else {
            // Değilse ekle
            setSelectedStyles([...selectedStyles, style]);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await apiClient.put("/users/changepreferences", {
                favoriteColors: selectedColors,
                stylePreferences: selectedStyles
            });

            // Backend'den gelen güncellenmiş verileri local state'e yansıt
            if (response.data?.data?.preferences) {
                updateUser({
                    favoriteColors: response.data.data.preferences.favoriteColors,
                    stylePreferences: response.data.data.preferences.stylePreferences
                });
            } else {
                // Fallback: Eğer response yapısı farklıysa local değerleri kullan
                updateUser({
                    favoriteColors: selectedColors,
                    stylePreferences: selectedStyles
                });
            }
            navigation.goBack();
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
                <ScrollView>
                    {/* Renk Seçimi Bölümü */}
                    <View style={styles.section}>
                        <Text style={styles.title}>Favori Renkler (Maksimum 3)</Text>
                        <View style={styles.gridContainer}>
                            {AVAILABLE_COLORS.map((color) => {
                                const isSelected = selectedColors.includes(color);
                                return (
                                    <TouchableOpacity
                                        key={color}
                                        style={[styles.colorBox, { backgroundColor: color }]}
                                        onPress={() => toggleColor(color)}
                                    >
                                        {/* Seçiliyse tik işareti koy */}
                                        {isSelected && <Text style={styles.checkMark}>✓</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Stil Seçimi Bölümü */}
                    <View style={styles.section}>
                        <Text style={styles.title}>Stil Tercihleri</Text>
                        <View style={styles.gridContainer}>
                            {AVAILABLE_STYLES.map((style) => {
                                const isSelected = selectedStyles.includes(style);
                                return (
                                    <TouchableOpacity
                                        key={style}
                                        style={[styles.tag, isSelected ? styles.tagSelected : styles.tagDefault]}
                                        onPress={() => toggleStyle(style)}
                                    >
                                        <Text style={isSelected ? styles.tagTextSelected : styles.tagTextDefault}>
                                            {style}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={styles.saveButtonText}>
                            {loading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

// --- STİLLER GÜNCELLENDİ ---
const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: { flex: 1 },
    section: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        // YENİ: İlk bölüme başlık için 10px boşluk
        paddingTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.secondary,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 20,
        // YENİ: İkinci bölümün başlığı için de 10px boşluk
        paddingTop: 10,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    colorBox: {
        width: 60,
        height: 60,
        borderRadius: 10,
        margin: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.secondary,
    },
    checkMark: {
        fontSize: 24,
        color: 'white',
        fontWeight: 'bold',
    },
    tag: {
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
        margin: 6,
        borderWidth: 1,
    },
    tagDefault: {
        backgroundColor: COLORS.card,
        borderColor: COLORS.secondary,
    },
    tagSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    tagTextDefault: { color: COLORS.textPrimary },
    tagTextSelected: {
        color: COLORS.primaryText,
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        height: 50,
        margin: 20,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: COLORS.primaryText,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default EditStyleScreen;
