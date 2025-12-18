import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { COLORS } from '../screens/colors';

const ClothingCard = ({ item, onCardLongPress }) => {
    // isExpanded state ve ilgili mantık kaldırıldı.

    return (
        <TouchableOpacity 
            style={styles.card} 
            onLongPress={onCardLongPress} // onPress, onLongPress olarak değiştirildi ve prop'tan gelen fonksiyon kullanıldı
            activeOpacity={0.9}
        >
            <ImageBackground
                source={{ uri: item.imageUrl }}
                style={styles.image}
                imageStyle={{ borderRadius: 12 }}
            >
                {/* isExpanded kontrolü kaldırıldı, isim her zaman görünür */}
                <View style={styles.nameContainer}>
                    <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                </View>
            </ImageBackground>

            {/* Genişletilmiş detaylar ve butonlar kaldırıldı */}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        margin: 8,
        borderRadius: 12,
        backgroundColor: COLORS.card,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        overflow: 'hidden',
    },
    image: {
        aspectRatio: 3 / 4,
        justifyContent: 'flex-end',
    },
    nameContainer: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    cardName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary, // Yazı rengi beyaz olarak güncellendi
        textAlign: 'center',
    },
    // Kullanılmayan stiller temizlendi
});

export default ClothingCard;
