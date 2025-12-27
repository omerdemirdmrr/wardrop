import apiClient from "./client";
import { Buffer } from "buffer";
import { errorHandler } from '../utils';

/**
 * Uploads an image to the backend to remove its background.
 * @param {string} imageUri The URI of the image to process.
 * @returns {Promise<{success: boolean, imageUrl?: string, message?: string}>}
 */
export const uploadImageForBgRemoval = async (imageUri) => {
  const formData = new FormData();

  // Extract file name and type from URI
  const uriParts = imageUri.split("/");
  const fileName = uriParts[uriParts.length - 1];
  let fileType;
  const fileTypeMatch = /\.(\w+)$/.exec(fileName);
  if (fileTypeMatch) {
    fileType = `image/${fileTypeMatch[1]}`;
  } else {
    fileType = "image/jpeg"; // Default
  }

  formData.append("image", {
    uri: imageUri,
    name: fileName,
    type: fileType,
  });

  try {
    const response = await apiClient.post("/image/remove-bg", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      responseType: "arraybuffer", // Important to handle the binary data
    });

    // Convert the binary data (ArrayBuffer) to a Base64 string
    const base64 = Buffer.from(response.data, "binary").toString("base64");
    const imageUrl = `data:image/png;base64,${base64}`;

    return { success: true, imageUrl };
  } catch (error) {
    const standardError = errorHandler.handleApiError(error, { operation: 'removeBg', imageUri });
    return { 
      success: false, 
      error: standardError
    };
  }
};

// [NOTE]: We are keeping this dummy data for now because 'getClothingItems'
// at the bottom still depends on it.
const dummyWardrobeData = [
  {
    id: "1",
    name: "White T-Shirt",
    category: "Top",
    color: "White",
    season: "Summer",
    imageUrl: "https://via.placeholder.com/100/FFFFFF/1B1229?text=T-Shirt",
  },
  {
    id: "2",
    name: "Blue Jeans",
    category: "Bottom",
    color: "Blue",
    season: "All-Season",
    imageUrl: "https://via.placeholder.com/100/3498db/FFFFFF?text=Jeans",
  },
  {
    id: "3",
    name: "Black Boots",
    category: "Shoes",
    color: "Black",
    season: "Winter",
    imageUrl: "https://via.placeholder.com/100/000000/FFFFFF?text=Boots",
  },
  {
    id: "4",
    name: "Red Jacket",
    category: "Outerwear",
    color: "Red",
    season: "Autumn",
    imageUrl: "https://via.placeholder.com/100/FF0000/FFFFFF?text=Jacket",
  },
];

/**
 * Yapay Zeka Görüntü Analizi
 * [RESOLUTION]: Kept simulated version because no backend endpoint exists for this yet.
 */
export const analyzeImageWithAI = (imageUri) => {
  console.log("Simulating: Sending image to AI for analysis...", imageUri);

  return new Promise((resolve) => {
    setTimeout(() => {
      // AI'ın döndüreceği örnek JSON yanıtı
      const aiResponse = {
        category: "Top",
        season: "Summer",
        color1: "red", // constants/options.js içindeki value değerleriyle eşleşmeli
        color2: "black", // constants/options.js içindeki value değerleriyle eşleşmeli
        confidence: 0.95,
      };

      console.log("Simulating: AI Analysis complete.", aiResponse);
      resolve({ success: true, data: aiResponse });
    }, 2000);
  });
};

// [RESOLUTION]: Removed duplicate 'uploadImageForBgRemoval' here.
// We are using the Real one defined at the top of the file.

/**
 * Kıyafeti veritabanına kaydetme
 * [RESOLUTION]: Used the Remote (Real) version to connect to the backend.
 */
export const saveClothingItem = async (clothingData) => {
  const formData = new FormData();
  const { imageUrl, name, color1, ...aiResult } = clothingData;

  // 1. Resmi ekle
  const uriParts = imageUrl.split('/');
  const fileName = uriParts[uriParts.length - 1];
  let fileType = 'image/jpeg'; // Varsayılan
  const fileTypeMatch = /\.(\w+)$/.exec(fileName);
  if (fileTypeMatch) {
    fileType = `image/${fileTypeMatch[1]}`;
  }

  formData.append('image', {
    uri: imageUrl,
    name: fileName,
    type: fileType,
  });

  // 2. Diğer verileri AI sonucundan ve formdan alıp ekle
  formData.append('name', name);
  
  const anaRenk = aiResult?.kiyafet_analizi?.renk_paleti?.ana_renk;
  formData.append('color', anaRenk || color1?.label || color1);

  if (aiResult && aiResult.kiyafet_analizi) {
    const analysis = aiResult.kiyafet_analizi;
    if (analysis.genel_bilgi) {
      formData.append('category', analysis.genel_bilgi.kategori || 'General');
      formData.append('subCategory', analysis.genel_bilgi.tur || 'General');
      formData.append('season', analysis.genel_bilgi.mevsim || 'All-Season');
    }
    if (analysis.tasarim_detaylari) {
      formData.append('size', analysis.tasarim_detaylari.kesim || 'One Size');
    }
    if (analysis.malzeme_tahmini) {
        formData.append('material', analysis.malzeme_tahmini.kumas_tipi || 'Unknown');
    }
  } else {
    // Eski veya basitleştirilmiş AI verisi için fallback
    formData.append('category', aiResult.category || 'General');
    formData.append('season', aiResult.season || 'All-Season');
  }


  try {
    const response = await apiClient.post('/clothes/add', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Clothing item saved successfully:', response.data);  
    return { success: true, data: response.data };
  } catch (error) {
    const standardError = errorHandler.handleApiError(error, { operation: 'saveClothing', fileName: formData.get('name') });
    return { 
      success: false, 
      error: standardError
    };
  }
};

// [WARNING]: The functions below are still SIMULATED.
// If you save an item using the real function above, it will NOT appear
// in 'getClothingItems' below until you convert these to real API calls too.

export const updateClothingItem = async (updatedItem) => {
  try {
    const response = await apiClient.put(`/clothes/update/${updatedItem._id || updatedItem.id}`, {
      name: updatedItem.name,
      color: updatedItem.color1 || updatedItem.color,
      color1: updatedItem.color1,
      color2: updatedItem.color2,
    });
    return { success: true, data: response.data };
  } catch (error) {
    const standardError = errorHandler.handleApiError(error, { operation: 'updateClothing', itemId: updatedItem._id || updatedItem.id });
    return { 
      success: false, 
      error: standardError
    };
  }
};

export const deleteClothingItem = async (itemId) => {
  try {
    const response = await apiClient.delete(`/clothes/delete/${itemId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const standardError = errorHandler.handleApiError(error, { operation: 'deleteClothing', itemId });
    return { 
      success: false, 
      error: standardError
    };
  }
};

export const getClothingItems = async () => {
  try {
    const response = await apiClient.get('/clothes/list');
    return response.data;
  } catch (error) {
    const standardError = errorHandler.handleApiError(error, { operation: 'getClothingList' });
    return { 
      success: false, 
      data: [],
      error: standardError
    };
  }
};
