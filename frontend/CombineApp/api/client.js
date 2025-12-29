import axios from "axios";
import { Platform } from "react-native";

// ⚠️ ÖNEMLİ: Network yapılandırması
// - Android Emulator: 10.0.2.2 kullan (localhost yerine)
// - iOS Simulator: localhost veya IP adresi kullanılabilir
// - Fiziksel Cihaz: Bilgisayarınızın IP adresini kullanın (aynı WiFi'de olmalı)

// IP ve Port .env dosyasından okunuyor
const BACKEND_IP = process.env.EXPO_PUBLIC_BACKEND_IP || "10.1.245.82";
const BACKEND_PORT = process.env.EXPO_PUBLIC_BACKEND_PORT || "4000";
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL; // Production URL (optional)

// Android Emulator için özel IP
const getBaseURL = () => {
  // Production mode: if BACKEND_URL is set, use it
  if (BACKEND_URL) {
    console.log('🌐 [BACKEND] Using PRODUCTION URL:', BACKEND_URL);
    return `${BACKEND_URL}/api`;
  }

  // Development mode: use IP and PORT
  console.log('🌐 [BACKEND] Using DEVELOPMENT URL:', `http://${BACKEND_IP}:${BACKEND_PORT}`);
  if (Platform.OS === "android" && __DEV__) {
    // Android emulator için localhost = 10.0.2.2
    // Eğer emulator kullanıyorsanız .env dosyasında EXPO_PUBLIC_BACKEND_IP=10.0.2.2 ayarlayın
    // return `http://10.0.2.2:${BACKEND_PORT}/api`;
  }
  return `http://${BACKEND_IP}:${BACKEND_PORT}/api`;
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    Accept: "application/json",
  },
});

// Logout callback - will be set by AuthContext
let logoutCallback = null;

export const setLogoutCallback = (callback) => {
  logoutCallback = callback;
};

// Request interceptor - Her request'te log
apiClient.interceptors.request.use(
  (config) => {
    console.log("📤 [API Request]", config.method?.toUpperCase(), config.url);
    console.log("📤 [API Request] Full URL:", config.baseURL + config.url);
    console.log("📤 [API Request] Headers:", config.headers);
    return config;
  },
  (error) => {
    console.error("📤 [API Request Error]", error);
    return Promise.reject(error);
  }
);

// Response interceptor - Her response'da log
apiClient.interceptors.response.use(
  (response) => {
    console.log("📥 [API Response]", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("📥 [API Response Error]", {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config?.baseURL + error.config?.url,
    });

    // Auto-logout on token expiration
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log("🔒 Token expired or unauthorized, triggering logout...");
      if (logoutCallback) {
        logoutCallback();
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
