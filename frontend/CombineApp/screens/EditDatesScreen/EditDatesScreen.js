import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const EditDatesScreen = ({ navigation }) => {
    const { user, updateUser } = useAuth();

    // Mevcut tarihleri state'e alıyoruz
    const [dates, setDates] = useState(user.importantDates || []);
    
    // Yeni eklenecek tarih için form state'leri
    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState('');

    // --- YENİ TARİH EKLEME ---
    const handleAddDate = () => {
        // Validasyonlar
        if (!newTitle || !newDate) {
            Alert.alert('Eksik Bilgi', 'Lütfen başlık ve tarih girin.');
            return;
        }
        // Basit tarih formatı kontrolü (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
            Alert.alert('Geçersiz Format', 'Lütfen tarihi YYYY-MM-DD formatında girin.');
            return;
        }

        // Yeni objeyi oluştur (ID olarak rastgele sayı kullanıyoruz şimdilik)
        const newDateObject = { id: Math.random().toString(), title: newTitle, date: newDate };
        
        // Listeye ekle ve inputları temizle
        setDates([...dates, newDateObject]);
        setNewTitle('');
        setNewDate('');
    };

    // --- TARİH SİLME ---
    const handleDeleteDate = (idToDelete) => {
        Alert.alert('Sil', 'Bu tarihi silmek istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            { 
                text: 'Sil', 
                style: 'destructive', 
                // ID'si eşleşmeyenleri tutarak filtreleme yapıyoruz (yani eşleşeni atıyoruz)
                onPress: () => setDates(dates.filter(date => date.id !== idToDelete)) 
            }
        ]);
    };

    // --- KAYDETME ---
    const handleSave = () => {
        // Güncellenmiş listeyi Context'e gönder
        updateUser({ importantDates: dates });
        Alert.alert('Başarılı', 'Önemli tarihler güncellendi.', [
            { text: 'Tamam', onPress: () => navigation.goBack() }
        ]);
    };

    // Liste Elemanı Görünümü
    const renderDateItem = ({ item }) => (
        <View style={styles.dateItem}>
            <View>
                <Text style={styles.dateTitle}>{item.title}</Text>
                <Text style={styles.dateText}>{item.date}</Text>
            </View>
            {/* Çöp Kutusu İkonu */}
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteDate(item.id)}>
                <Ionicons name="trash-bin-outline" size={20} color={'#E74C3C'} />
            </TouchableOpacity>
        </View>
    );

    return (
        <LinearGradient colors={COLORS.gradient} style={styles.gradient}>
            <SafeAreaView style={styles.container}>
                {/* Ekleme Formu */}
                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>Yeni Tarih Ekle</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Başlık (örn: Doğum Günü)"
                        placeholderTextColor={COLORS.gray}
                        value={newTitle}
                        onChangeText={setNewTitle}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Tarih (YYYY-MM-DD)"
                        placeholderTextColor={COLORS.gray}
                        value={newDate}
                        onChangeText={setNewDate}
                    />
                    <TouchableOpacity style={styles.addButton} onPress={handleAddDate}>
                        <Text style={styles.addButtonText}>Listeye Ekle</Text>
                    </TouchableOpacity>
                </View>
                
                {/* Tarih Listesi */}
                <FlatList
                    data={dates}
                    renderItem={renderDateItem}
                    keyExtractor={item => item.id}
                    style={styles.list}
                    // Listenin en altına Kaydet butonu koyuyoruz
                    ListFooterComponent={
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
                        </TouchableOpacity>
                    }
                />
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: { flex: 1 },
    formContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10, 
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.secondary,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 10,
    },
    input: {
        backgroundColor: COLORS.card,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        marginBottom: 10,
        borderColor: COLORS.secondary,
        borderWidth: 1,
        color: COLORS.textPrimary,
    },
    addButton: {
        backgroundColor: COLORS.primary, 
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    addButtonText: {
        color: COLORS.primaryText, 
        fontWeight: 'bold',
        fontSize: 16,
    },
    list: { flex: 1 },
    dateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.secondary,
    },
    dateTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    dateText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    deleteButton: { padding: 5 },
    saveButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        height: 50,
        margin: 20,
    },
    saveButtonText: {
        color: COLORS.primaryText,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default EditDatesScreen;
