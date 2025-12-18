import React, { createContext, useState, useContext, useEffect } from "react";
import authStorage from "../auth/storage";
import apiClient from "../api/client";
import { COLORS } from "../screens/colors";
import * as Location from "expo-location";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

const dummyUserProfile = {
    name: "Elisa Yıldırım",
    location: "Istanbul, TR",
    country: "Turkey",
    city: "Istanbul",
    neighborhood: "Beşiktaş",
    profileImageUrl: "https://via.placeholder.com/150/FFFFFF/1B1229?text=User",
    favoriteColors: [COLORS.primary, COLORS.secondary, "#d1c4e9"],
    stylePreferences: ["Casual", "Minimalist"],
    importantDates: [
        { id: "1", title: "Doğum Günü", date: "2025-11-20" },
        { id: "2", title: "Proje Sunumu", date: "2025-12-15" },
    ],
};

const DEFAULT_LOCATION = {
    country: "Türkiye",
    city: "Istanbul",
    neighborhood: "Beşiktaş",
    location: "Beşiktaş, Istanbul, Türkiye",
    coords: { latitude: 41.0082, longitude: 28.9784 },
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(dummyUserProfile);
    const [token, setToken] = useState(null);
    const [locationUpdated, setLocationUpdated] = useState(false);

    // Load saved location (or default) on startup
    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem("@saved_location");
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setUser((cur) => ({ ...cur, ...parsed }));
                } else {
                    // save default so app has a stable fallback
                    await AsyncStorage.setItem(
                        "@saved_location",
                        JSON.stringify(DEFAULT_LOCATION)
                    );
                    setUser((cur) => ({ ...cur, ...DEFAULT_LOCATION }));
                }
            } catch (err) {
                console.warn("Failed loading saved location", err);
            }

            // Then try to update from device if possible (won't spam permission dialogs)
            updateLocationData();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- KONUM GÜNCELLEME FONKSİYONU ---
    const updateLocationData = async () => {
        let locationSuccess = false;
        let savedLocation = null;

        // 1. Kayıtlı/Varsayılan Konumu Hazırla (Her durumda kullanılacak fallback)
        try {
            const saved = await AsyncStorage.getItem("@saved_location");
            if (saved) {
                savedLocation = JSON.parse(saved);
            } else {
                savedLocation = DEFAULT_LOCATION;
                await AsyncStorage.setItem(
                    "@saved_location",
                    JSON.stringify(DEFAULT_LOCATION)
                );
            }
        } catch (err) {
            console.warn("Failed retrieving saved location for fallback", err);
            savedLocation = DEFAULT_LOCATION;
        }

        try {
            // 2. İzin durumunu kontrol et.
            const currentPerm = await Location.getForegroundPermissionsAsync();
            let status = currentPerm.status;

            // 3. Konum servisleri açık mı? (Ek kontrol, önceki çözümden)
            const isEnabled = await Location.hasServicesEnabledAsync();

            console.log(
                `Location Check: Status=${status}, Enabled=${isEnabled}`
            );

            // Eğer izin verilmediyse VEYA izin verilse bile GPS kapalıysa, konumu almaya kalkma.
            if (status === "granted" && isEnabled) {
                // --- İZİN VERİLDİ VE GPS AÇIK, Konum Almayı Dene ---
                console.log("Attempting to get current GPS location...");

                // getCurrentPositionAsync, GPS kapalıyken bile bir sistem uyarısı tetikleyebilir.
                // Bu yüzden bir timeout ile sarıyoruz.
                const pos = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Highest,
                    timeout: 5000, // 5 saniye bekle, sistem uyarısı gelirse bu süre içinde gelir.
                });

                const coords = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                };

                const places = await Location.reverseGeocodeAsync(coords);

                if (places && places.length > 0) {
                    const place = places[0];
                    const neighborhood =
                        place.subregion ||
                        place.district ||
                        place.name ||
                        place.street ||
                        "";
                    const city =
                        place.city || place.region || place.subregion || "";
                    const country = place.country || "";

                    const locationString = [
                        neighborhood && neighborhood.trim(),
                        city && city.trim(),
                        country && country.trim(),
                    ]
                        .filter(Boolean)
                        .join(", ");

                    savedLocation = {
                        neighborhood: neighborhood || "",
                        city: city || "",
                        country: country || "",
                        location: locationString || "",
                        coords,
                    };
                    locationSuccess = true;
                }
            }
        } catch (err) {
            // getCurrentPositionAsync, zaman aşımı veya sistem ayarı hatası (o meşhur uyarı)
            // verdiğinde BURAYA düşeriz. Bu durumda uyarıyı kullanıcıya yansıtmak yerine sessizce devam ederiz.
            console.warn(
                "Failed to get device location (likely GPS off/timeout):",
                err.message
            );
            locationSuccess = false;
            // Fallback için savedLocation zaten yukarıda ayarlandı.
        }

        // 4. Sonuç ne olursa olsun, kullanıcı state'ini güncelle.
        setUser((current) => {
            const prevLoc = {
                city: current.city || "",
                country: current.country || "",
                neighborhood: current.neighborhood || "",
                coords: current.coords || {},
            };

            const hasChanged =
                prevLoc.city !== savedLocation.city ||
                prevLoc.country !== savedLocation.country ||
                prevLoc.neighborhood !== savedLocation.neighborhood ||
                prevLoc.coords.latitude !== savedLocation.coords.latitude ||
                prevLoc.coords.longitude !== savedLocation.coords.longitude;

            if (locationSuccess && hasChanged) {
                // Başarılı GPS konumu alındıysa, kalıcı kaydet ve güncelle
                AsyncStorage.setItem(
                    "@saved_location",
                    JSON.stringify(savedLocation)
                ).catch((e) =>
                    console.warn("Failed to save location to storage", e)
                );

                setLocationUpdated((prev) => !prev);
                return { ...current, ...savedLocation };
            } else if (!locationSuccess && hasChanged) {
                // GPS alınamadıysa (kullanıcı kapattıysa) ve kayıtlı konum farklıysa
                // yine de kayıtlı konuma geçiş yap.
                return { ...current, ...savedLocation };
            }

            // Konum başarıyla alınamadı ve kayıtlı konumda bir değişiklik yok.
            return current;
        });

        return locationSuccess;
    };

    // --- UYGULAMA AÇILDIĞINDA KONUM AL ---
    useEffect(() => {
        (async () => {
            // ... (Kayıtlı konumu yükleme/varsayılanı ayarlama mantığı aynı kalır)

            // Then try to update from device if possible (won't spam permission dialogs)
            // YENİ: forcePrompt=false olarak çağırıyoruz
            updateLocationData(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- UYGULAMA ARKA PLANDAN ÖN PLANA GELDİĞİNDE KONUM KONTROLÜ ---
    useEffect(() => {
        const subscription = AppState.addEventListener(
            "change",
            (nextState) => {
                if (nextState === "active") {
                    console.log("App came to foreground, checking location...");
                    // When user returns from settings (may have enabled location), try update
                    // YENİ: forcePrompt=false olarak çağırıyoruz
                    updateLocationData(false);
                }
            }
        );

        return () => {
            subscription.remove();
        };
    }, []);

    // --- KULLANICI GÜNCELLEME ---
    const updateUser = (newUserData) => {
        setUser((currentUser) => ({
            ...currentUser,
            ...newUserData,
        }));
    };

    const login = async (email, password) => {
        try {
            const response = await apiClient.post("/users/login", {
                email,
                password,
            });
            console.log("Login response:", response.data);

            if (response.data.token) {
                setToken(response.data.token);
                apiClient.defaults.headers.common[
                    "Authorization"
                ] = `Bearer ${response.data.token}`;
                await authStorage.storeToken(response.data.token);

                if (response.data.user) {
                    setUser(response.data.user);
                }
                return true;
            }
        } catch (error) {
            console.error("Login failed", error);
            return false;
        }
    };

    const logout = async () => {
        setToken(null);
        setUser(null);
        delete apiClient.defaults.headers.common["Authorization"];
        await authStorage.removeToken();
    };

    const restoreToken = async () => {
        const storedToken = await authStorage.getToken();
        if (storedToken) {
            setToken(storedToken);
            apiClient.defaults.headers.common[
                "Authorization"
            ] = `Bearer ${storedToken}`;

            try {
                if (!user) { // sadece user null ise fetch et
                    const response = await apiClient.get("/users/profile");
                    if (response.data && response.data.user) setUser(response.data.user);
                }
            } catch (error) {
                console.log("Failed to restore user profile:", error);
            }
        }
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                login,
                logout,
                restoreToken,
                updateUser,
                locationUpdated,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
