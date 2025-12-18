import axios from 'axios';

const API_KEY = 'fbb681e81b22d031bf1f14e820e7144d';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Fetches real weather data from the OpenWeatherMap API based on coordinates.
 * @param {number} latitude The latitude.
 * @param {number} longitude The longitude.
 * @returns {Promise<object>} A promise that resolves with weather data.
 */
export const getWeatherByCoords = async (latitude, longitude) => {
  if (API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') {
    console.error("OpenWeatherMap API key is not set. Please replace 'YOUR_OPENWEATHERMAP_API_KEY' in api/weather.js.");
    // Return a dummy response to avoid breaking the app
    return {
      success: true,
      data: {
        location: 'API Key Missing',
        temperature: 'N/A',
        condition: 'Please set API key',
        icon: 'alert-circle',
      },
    };
  }

  try {
    console.log('Fetching real weather data for coordinates...', { latitude, longitude });

    const response = await axios.get(API_BASE_URL, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: API_KEY,
        units: 'metric', // For Celsius
        lang: 'tr'
      },
    });

    const data = response.data;

    // Map OpenWeatherMap icon codes to Ionicons
    const getIconName = (weatherId) => {
      if (weatherId >= 200 && weatherId < 300) return 'thunderstorm';
      if (weatherId >= 300 && weatherId < 500) return 'rainy';
      if (weatherId >= 500 && weatherId < 600) return 'rainy';
      if (weatherId >= 600 && weatherId < 700) return 'snow';
      if (weatherId >= 700 && weatherId < 800) return 'cloudy';
      if (weatherId === 800) return 'sunny';
      if (weatherId > 800) return 'partly-sunny';
      return 'cloud'; // Default icon
    };

    const weatherData = {
      location: data.name,
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].description,
      icon: getIconName(data.weather[0].id),
    };

    console.log('Real weather data fetched successfully.', weatherData);
    return { success: true, data: weatherData };

  } catch (error) {
    console.error('Error fetching weather data from OpenWeatherMap:', error);
    // You might want to handle different error types (e.g., network error, API error)
    return { success: false, message: 'Hava durumu alınamadı.' };
  }
};
