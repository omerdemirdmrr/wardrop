import axios from 'axios';
import { Platform } from 'react-native';

// ⚠️ ÖNEMLİ: Network yapılandırması
// - Android Emulator: 10.0.2.2 kullan (localhost yerine)
// - iOS Simulator: localhost veya IP adresi kullanılabilir
// - Fiziksel Cihaz: Bilgisayarınızın IP adresini kullanın (aynı WiFi'de olmalı)

// IP adresini buradan değiştirebilirsiniz
const BACKEND_IP = '192.168.1.102';
const BACKEND_PORT = '4000';

// Android Emulator için özel IP
const getBaseURL = () => {
  if (Platform.OS === 'android' && __DEV__) {
    // Android emulator için localhost = 10.0.2.2
    // Eğer emulator kullanıyorsanız aşağıdaki satırı açın:
    // return `http://10.0.2.2:${BACKEND_PORT}/api`;
  }
  return `http://${BACKEND_IP}:${BACKEND_PORT}/api`;
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Accept': 'application/json',
  },
});

// Request interceptor - Her request'te log
apiClient.interceptors.request.use(
  (config) => {
    console.log('📤 [API Request]', config.method?.toUpperCase(), config.url);
    console.log('📤 [API Request] Full URL:', config.baseURL + config.url);
    console.log('📤 [API Request] Headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('📤 [API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Her response'da log
apiClient.interceptors.response.use(
  (response) => {
    console.log('📥 [API Response]', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('📥 [API Response Error]', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config?.baseURL + error.config?.url,
    });
    return Promise.reject(error);
  }
);

export default apiClient;