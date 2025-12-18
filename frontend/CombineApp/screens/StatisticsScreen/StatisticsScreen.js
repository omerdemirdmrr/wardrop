import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../colors';
import * as clothingApi from '../../api/clothing';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
    backgroundGradientFrom: COLORS.card,
    backgroundGradientTo: COLORS.card,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: { borderRadius: 16 },
};

const LegendItem = ({ color, name, count }) => (
    <View style={styles.legendItem}>
        <View style={[styles.legendColorBox, { backgroundColor: color }]} />
        <Text style={styles.legendText}>{name} ({count})</Text>
    </View>
);

const StatisticsScreen = () => {
    const [chartData, setChartData] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);

    // --- VERİ HESAPLAMA ---
    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const response = await clothingApi.getClothingItems();
            if (response.success) {
                const clothes = response.data;
                setTotalItems(clothes.length);

                // Kategorileri say
                const categories = {
                    Top: { count: 0, color: '#B13BFF' },
                    Bottom: { count: 0, color: '#1abc9c' },
                    Shoes: { count: 0, color: '#f1c40f' },
                    Outerwear: { count: 0, color: '#e74c3c' },
                    Accessory: { count: 0, color: '#3498db' }
                };

                // Gelen verideki kategorileri eşleştirip say
                clothes.forEach(item => {
                    // toLowerCase ile büyük/küçük harf uyumsuzluğunu önlüyoruz
                    const catKey = Object.keys(categories).find(key => key.toLowerCase() === item.category.toLowerCase());
                    if (catKey) {
                        categories[catKey].count += 1;
                    }
                });

                // Grafik kütüphanesinin istediği formata dönüştür
                const formattedData = Object.keys(categories)
                    .filter(key => categories[key].count > 0)
                    .map(key => ({
                        name: key,
                        count: categories[key].count,
                        color: categories[key].color,
                        legendFontColor: COLORS.textPrimary,
                        legendFontSize: 14
                    }));

                setChartData(formattedData);
            }
        } catch (error) {
            console.error("Stats error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Ekran her odaklandığında istatistikleri yeniden hesapla
    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [fetchStats])
    );

    return (
        <LinearGradient colors={COLORS.gradient} style={styles.gradient}>
            <SafeAreaView style={styles.container}>
                <ScrollView>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    ) : (
                        <>
                            {/* 1. Toplam Parça Sayısı */}
                            <View style={styles.totalContainer}>
                                <Text style={styles.totalCount}>{totalItems}</Text>
                                <Text style={styles.totalLabel}>Gardıroptaki Parçalar</Text>
                            </View>

                            {/* 2. Pasta Grafik */}
                            {totalItems > 0 ? (
                                <View style={styles.chartContainer}>
                                    <Text style={styles.chartTitle}>Kategori Dağılımı</Text>
                                    <PieChart
                                        data={chartData}
                                        width={screenWidth - 40}
                                        height={220}
                                        chartConfig={chartConfig}
                                        accessor="count"
                                        backgroundColor="transparent"
                                        paddingLeft="15"
                                        absolute
                                        hasLegend={false}
                                    />
                                </View>
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>Henüz kıyafet eklenmemiş.</Text>
                                </View>
                            )}

                            {/* 3. Açıklamalar (Legend) */}
                            <View style={styles.legendContainer}>
                                {chartData.map((item, index) => (
                                    <LegendItem
                                        key={index}
                                        color={item.color}
                                        name={item.name}
                                        count={item.count}
                                    />
                                ))}
                            </View>
                        </>
                    )}
                    <View style={{ height: 30 }} />
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', height: 300 },
    totalContainer: {
        backgroundColor: COLORS.primary,
        padding: 30,
        alignItems: 'center',
        marginTop: 10,
        marginHorizontal: 10,
        borderRadius: 10,
    },
    totalCount: {
        fontSize: 48,
        fontWeight: 'bold',
        color: COLORS.primaryText,
    },
    totalLabel: {
        fontSize: 18,
        color: COLORS.primaryText,
        opacity: 0.8,
    },
    chartContainer: {
        marginTop: 20,
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        margin: 10,
        paddingVertical: 20,
    },
    chartTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 15,
    },
    legendContainer: {
        paddingHorizontal: 30,
        marginTop: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    legendColorBox: {
        width: 20,
        height: 20,
        borderRadius: 5,
        marginRight: 10,
    },
    legendText: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    }
});

export default StatisticsScreen;