import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext'; // Global kullanıcı verisi

// --- YARDIMCI BİLEŞENLER ---

// Menü Elemanı (Artık sadece İstatistikler için kullanılıyor)
const ProfileMenuItem = ({ title, iconName, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuItemContent}>
            <Ionicons name={iconName} size={22} color={COLORS.primary} />
            <Text style={styles.menuItemText}>{title}</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={22} color={COLORS.gray} />
    </TouchableOpacity>
);

// Renk Göstergesi (Yuvarlak)
const ColorCircle = ({ color }) => (
    <View style={[styles.colorCircle, { backgroundColor: color }]} />
);

const ProfileScreen = ({ navigation }) => {
    // Context'ten giriş yapmış kullanıcının bilgilerini çekiyoruz
    const { user } = useAuth();

    // --- YÖNLENDİRME FONKSİYONLARI ---
    const onSettingsPress = () => navigation.navigate('Settings');
    const onStatsPress = () => navigation.navigate('Statistics');

    // Eğer kullanıcı verisi yüklenmediyse (null ise) yükleniyor göstergesi çıkar
    if (!user) {
        return (
            <LinearGradient colors={COLORS.gradient} style={styles.gradient}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={COLORS.gradient}
            style={styles.gradient}
        >
            <SafeAreaView style={styles.container}>
                <ScrollView>
                    
                    {/* --- ÜST BAR (AYARLAR BUTONU) --- */}
                    {/* flex:1 sol tarafı iterek butonu sağa yaslar */}
                    <View style={styles.topBar}>
                        <View style={{ flex: 1 }} /> 
                        <TouchableOpacity onPress={onSettingsPress} style={styles.settingsButton}>
                            <Ionicons name="settings-outline" size={26} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {/* --- PROFİL BAŞLIK ALANI --- */}
                    <View style={styles.header}>
                        <Image
                            source={{ uri: user.profileImageUrl || "https://via.placeholder.com/150/FFFFFF/1B1229?text=User" }}
                            style={styles.profileImage}
                        />
                        <Text style={styles.profileName}>{user.name}</Text>
                        <Text style={styles.profileLocation}>{user.location}</Text>
                    </View>

                    {/* --- MENÜ KARTI --- */}
                    <View style={styles.menuContainer}>
                        <ProfileMenuItem
                            title="Statistics"
                            iconName="pie-chart-outline"
                            onPress={onStatsPress}
                        />
                        {/* NOT: Ayarlar butonu buradan kaldırıldı, yukarı taşındı. */}
                    </View>

                    {/* --- DETAY BİLGİLER --- */}
                    <View style={styles.infoContainer}>
                        {/* 1. Favori Renkler */}
                        <Text style={styles.infoTitle}>Favorite Colors</Text>
                        <View style={styles.colorContainer}>
                            {(user.favoriteColors || []).map((color, index) => (
                                <ColorCircle key={index} color={color} />
                            ))}
                        </View>

                        {/* 2. Stil Tercihleri */}
                        <Text style={styles.infoTitle}>Style Preferences</Text>
                        <View style={styles.styleContainer}>
                            {(user.stylePreferences || []).map((style, index) => (
                                <View key={index} style={styles.styleTag}>
                                    <Text style={styles.styleTagText}>{style}</Text>
                                </View>
                            ))}
                        </View>

                        {/* 3. Önemli Tarihler */}
                        <Text style={styles.infoTitle}>Important Dates</Text>
                        {(user.importantDates || []).map((date) => (
                            <View key={date.id} style={styles.dateItem}>
                                <Text style={styles.dateTitle}>{date.title}</Text>
                                <Text style={styles.dateText}>{date.date}</Text>
                            </View>
                        ))}
                    </View>
                    
                    {/* Alt kısımda kaydırma payı */}
                    <View style={{ height: 30 }} />
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: {
        flex: 1,
    },
    // --- YENİ EKLENEN STİL: SAĞ ÜST İKON İÇİN ---
    topBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 10,
        justifyContent: 'flex-end', // İçeriği sağa yasla
    },
    settingsButton: {
        padding: 5, // Tıklama alanını biraz genişlet
    },
    // -------------------------------------------
    header: {
        backgroundColor: 'transparent',
        alignItems: 'center',
        paddingTop: 0, // Üst buton geldiği için buradaki boşluğu azalttık
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: COLORS.primary,
        marginBottom: 10,
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    profileLocation: {
        fontSize: 16,
        color: COLORS.textSecondary,
        paddingBottom: 10,
    },
    menuContainer: {
        marginTop: 20,
        marginHorizontal: 10,
        backgroundColor: COLORS.card,
        borderRadius: 10,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 0, // Tek eleman kaldığı için çizgiye gerek yok
        borderBottomColor: COLORS.secondary,
    },
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 18,
        color: COLORS.textPrimary,
        marginLeft: 15,
    },
    infoContainer: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    infoTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 15,
    },
    colorContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.card,
        marginRight: 10,
    },
    styleContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    styleTag: {
        backgroundColor: COLORS.primary,
        borderRadius: 15,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    styleTagText: {
        color: COLORS.primaryText,
        fontWeight: 'bold',
    },
    dateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.secondary,
    },
    dateTitle: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    dateText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    }
});

export default ProfileScreen;
