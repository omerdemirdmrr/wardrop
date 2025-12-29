import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../colors";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAuth } from "../../context/AuthContext";
import { getWeatherByCoords } from "../../api/weather";
import { generateOutfit, updateOutfitStatus } from "../../api/outfits";
import { useError } from "../../context/ErrorContext";
import { errorHandler, ERROR_MESSAGES } from "../../utils";
import ClothingCard from "../../components/ClothingCard";
import ClothingDetailModal from "../../components/ClothingDetailModal";

// --- HAVA DURUMU KARTI BİLEŞENİ ---
const WeatherCard = ({ weather }) => {
    if (!weather) {
        return (
            <View style={styles.weatherCard}>
                <ActivityIndicator color={COLORS.textPrimary} />
                <Text style={styles.weatherLoadingText}>
                    Getting weather...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.weatherCard}>
            <Ionicons
                name={`${weather.icon}-outline`}
                size={40}
                color={COLORS.textPrimary}
            />
            <View style={styles.weatherInfo}>
                <Text style={styles.weatherLocation}>{weather.location}</Text>
                <Text style={styles.weatherCondition}>{weather.condition}</Text>
            </View>
            <Text style={styles.temperature}>{weather.temperature}°C</Text>
        </View>
    );
};

const HomeScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { showError } = useError();

    const [weather, setWeather] = useState(null);
    const [outfit, setOutfit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processingAction, setProcessingAction] = useState(false);

    // Modal kontrolü
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const handleCardLongPress = (item) => {
        setSelectedItem(item);
        setDetailModalVisible(true);
    };

    const handleCloseDetailModal = () => {
        setDetailModalVisible(false);
        setSelectedItem(null);
    };

    // --- AYARLARA GİTME FONKSİYONU ---
    const handleGoToSettings = () => {
        navigation.navigate("Settings");
    };

    // --- KOMBİN GETİRME FONKSİYONU ---
    const fetchOutfit = useCallback(async (additionalParams = {}, currentWeatherData = weather) => {
        console.log("fetchOutfit called with params:", additionalParams, "and weather:", currentWeatherData);
        try {
            setLoading(true);

            const weatherParam = currentWeatherData 
                ? { weather: `${currentWeatherData.condition}, ${currentWeatherData.temperature}°C` }
                : {};

            const params = { ...weatherParam, ...additionalParams };

            const response = await generateOutfit(params);
            console.log("generateOutfit response:", response);

            if (!response.success) {
                showError(errorHandler.formatErrorForUser(response.error));
                return;
            }

            if (response.data?.success) {
                setOutfit(response.data.data);
            } else {
                showError({
                    title: 'Outfit Generation Failed',
                    message: response.data?.message || ERROR_MESSAGES.OUTFIT.NOT_ENOUGH_ITEMS,
                    category: 'VALIDATION'
                });
                console.warn("Outfit generation failed:", response.data?.message);
                return;
            }
        } catch (error) {
            const standardError = errorHandler.handleApiError(error);
            showError(errorHandler.formatErrorForUser(standardError));
        } finally {
            setLoading(false);
        }
    }, [showError, weather]); // weather'ı burada tutmak, refresh gibi eylemlerde güncel kalmasını sağlar

    // --- HAVA DURUMU GETİRME FONKSİYONU ---
    const fetchWeather = useCallback(async () => {
        if (!user) return null;
        try {
            const perm = await Location.getForegroundPermissionsAsync();
            let coords;
            if (perm.status === "granted") {
                const location = await Location.getCurrentPositionAsync({});
                coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
            } else {
                coords = { latitude: 41.0082, longitude: 28.9784 }; // default Istanbul
            }
            const weatherResponse = await getWeatherByCoords(coords.latitude, coords.longitude);
            if (weatherResponse.success) {
                setWeather(weatherResponse.data);
                return weatherResponse.data; // Veriyi geri döndür
            }
            return null;
        } catch (error) {
            console.error("Weather error:", error);
            return null;
        }
    }, [user]);

    // --- BEĞENME İŞLEVİ ---
    const handleLike = async () => {
        if (!outfit || loading || processingAction) return;
        try {
            setProcessingAction(true);
            const response = await updateOutfitStatus(outfit._id, 'worn');

            if (!response.success) {
                showError(errorHandler.formatErrorForUser(response.error));
                setProcessingAction(false);
                return;
            }
            // Yeni kombin isteği
            const newWeather = await fetchWeather();
            fetchOutfit({}, newWeather);

        } catch (error) {
            const standardError = errorHandler.handleApiError(error);
            showError(errorHandler.formatErrorForUser(standardError));
        } finally {
            setProcessingAction(false);
        }
    };

    // --- BEĞENMEME İŞLEVİ ---
    const handleDislike = async () => {
        if (!outfit || loading || processingAction) return;
        try {
            setProcessingAction(true);
            const dislikedId = outfit._id;
            const response = await updateOutfitStatus(dislikedId, 'disliked');

            if (!response.success) {
                showError(errorHandler.formatErrorForUser(response.error));
                 setProcessingAction(false);
                return;
            }
            
            const newWeather = await fetchWeather();
            fetchOutfit({ exclude: dislikedId, feedback: 'disliked' }, newWeather);
           
        } catch (error) {
            const standardError = errorHandler.handleApiError(error);
            showError(errorHandler.formatErrorForUser(standardError));
        } finally {
            setProcessingAction(false);
        }
    };

    // Uygulama açılışında veri çek
    useEffect(() => {
        const loadData = async () => {
            if (user) {
                setLoading(true);
                const newWeather = await fetchWeather();
                fetchOutfit({}, newWeather);
            }
        };

        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?._id]);


    return (
        <LinearGradient colors={COLORS.gradient} style={styles.gradient}>
            <SafeAreaView style={styles.container}>
                <ScrollView>
                    {/* ÜST BAŞLIK VE AYARLAR BUTONU */}
                    <View style={styles.header}>
                        <Text style={styles.greeting}>
                            Hello, {user?.username ? user.username.split(" ")[0] : "User"}
                        </Text>

                        <TouchableOpacity onPress={handleGoToSettings}>
                            <Ionicons
                                name="settings-outline"
                                size={24}
                                color={COLORS.textPrimary}
                            />
                        </TouchableOpacity>
                    </View>

                    <WeatherCard weather={weather} />

                    <View style={styles.suggestionHeader}>
                        <Text style={styles.sectionTitle}>
                            Today's Outfit Suggestion
                        </Text>
                    </View>

                    <View style={styles.gridContainer}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator
                                    size="large"
                                    color={COLORS.primary}
                                />
                                <Text style={styles.loadingText}>
                                    Creating your style...
                                </Text>
                            </View>
                        ) : !outfit ? (
                            <View style={styles.loadingContainer}>
                                <Ionicons
                                    name="shirt-outline"
                                    size={48}
                                    color={COLORS.textSecondary}
                                />
                                <Text style={styles.loadingText}>
                                    No outfit available
                                </Text>
                                <Text style={[styles.loadingText, { fontSize: 14, marginTop: 5 }]}>
                                    Try adding more items to your wardrobe
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.grid}>
                                {outfit.items.map((item) => (
                                    <View style={styles.gridItem} key={item._id}>
                                        <ClothingCard
                                            item={item}
                                            onCardLongPress={() =>
                                                handleCardLongPress(item)
                                            }
                                        />
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                (loading || processingAction) &&
                                styles.disabledButton,
                            ]}
                            onPress={handleLike}
                            disabled={loading || processingAction}
                        >
                            <Ionicons
                                name="checkmark-done-outline"
                                size={24}
                                color={
                                    loading || processingAction
                                        ? COLORS.gray
                                        : COLORS.primary
                                }
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                (loading || processingAction) &&
                                styles.disabledButton,
                            ]}
                            onPress={() => fetchOutfit()}
                            disabled={loading || processingAction}
                        >
                            <Ionicons
                                name="refresh-outline"
                                size={24}
                                color={
                                    loading || processingAction
                                        ? COLORS.gray
                                        : COLORS.primary
                                }
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                (loading || processingAction) &&
                                styles.disabledButton,
                            ]}
                            onPress={handleDislike}
                            disabled={loading || processingAction}
                        >
                            <Ionicons
                                name="thumbs-down-outline"
                                size={24}
                                color={
                                    loading || processingAction
                                        ? COLORS.gray
                                        : COLORS.primary
                                }
                            />
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <ClothingDetailModal
                    visible={detailModalVisible}
                    item={selectedItem}
                    onClose={handleCloseDetailModal}
                />
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: { flex: 1 },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    greeting: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.textPrimary,
    },
    weatherCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.secondary,
        borderRadius: 20,
        padding: 20,
        margin: 20,
        minHeight: 90,
    },
    weatherLoadingText: {
        marginLeft: 15,
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    weatherInfo: {
        flex: 1,
        marginLeft: 15,
    },
    weatherLocation: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textPrimary,
    },
    weatherCondition: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    temperature: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.textPrimary,
    },
    gridContainer: {
        paddingHorizontal: 10,
        marginTop: 10,
        minHeight: 200,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: COLORS.textPrimary,
        marginBottom: 5,
        paddingHorizontal: 10,
    },
    suggestionHeader: {
        paddingHorizontal: 10,
        marginTop: 20,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    gridItem: {
        width: "50%",
    },
    actionButtonsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        padding: 20,
        marginBottom: 20,
    },
    actionButton: {
        backgroundColor: COLORS.card,
        padding: 15,
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
    },
    disabledButton: {
        opacity: 0.5,
    },
    loadingContainer: {
        height: 200,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 10,
        color: COLORS.textSecondary,
        fontSize: 16,
    },
});

export default HomeScreen;
