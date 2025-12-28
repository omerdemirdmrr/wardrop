const { GoogleGenerativeAI } = require('@google/generative-ai');
// Gerekli modelleri import edelim. Bu yolların projenizin yapısına göre doğru olduğundan emin olun.
const ClothingItem = require('../db/models/ClothingItems'); 
const Outfit = require('../db/models/Outfits');
const CustomError  = require('../lib/CustomError');


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("Gemini API Key not found. Please set GEMINI_API_KEY in your .env file.");
  // Başlatma sırasında hata fırlatmak, sunucunun eksik konfigürasyonla çalışmasını engeller.
  throw new Error("Gemini API Key is missing.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Verilen kıyafetlerle Gemini API'sini kullanarak bir kombin oluşturur.
 * @param {Array<Object>} clothingItems - Kullanıcının gardırobundaki kıyafetlerin listesi.
 * @returns {Array<String>} - Kombini oluşturan kıyafetlerin ID'lerini içeren bir dizi.
 */
async function generateOutfitWithGemini(clothingItems, excludedOutfits = [], weather = null) {
  console.log("Combine is starting..."); // Durum: Başlangıç

  // Kıyafet verilerini Gemini'nin anlayacağı daha basit bir formata dönüştürelim.
  const simplifiedClothes = clothingItems.map(item => ({
    id: item._id.toString(),
    name: item.name,
    category: item.category,
    color: item.color,
    style: item.style,
  }));

  // Hariç tutulacak kombinleri Gemini'ye anlatmak için basitleştirelim.
  const simplifiedExcludedOutfits = excludedOutfits.map(outfit => ({
    name: outfit.name,
    items: outfit.items.map(item => item.name || item.toString()) // item bir obje veya sadece id olabilir
  }));

  const prompt = `
    Hello, act as a fashion assistant. Below is a list of clothing items in JSON format.
    I want you to create a stylish outfit combination using these items.
    Please pay attention to seasonal appropriateness, color harmony, and stylistic cohesion when creating this outfit.
    
    ${weather ? `IMPORTANT: The current weather is "${weather}". Please create an outfit combination suitable for this weather.` : ''}

    Clothing Items:
    ${JSON.stringify(simplifiedClothes, null, 2)}

    IMPORTANT: The following outfits have already been suggested or were rejected by the user.
    Please AVOID creating a combination similar to these.
    Outfits to Avoid:
    ${JSON.stringify(simplifiedExcludedOutfits, null, 2)}

    Instructions:
    1. Select compatible items from the "Clothing Items" list to create a fresh outfit, ensuring it is distinct from the "Outfits to Avoid" list.
    2. Ensure the outfit includes at least one top, one bottom, and one pair of shoes.
    3. As a response, return ONLY a JSON object containing the 'id's of the selected items.
    
    The response format must be strictly: { "outfit_ids": ["id1", "id2", "id3", ...] }
    
    Do not add any explanations, markdown formatting, or extra text. Return ONLY the JSON object.
  `;
  console.log("Gemini prompt:", prompt);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawResponse = response.text();
    console.log("Gemini raw response:", rawResponse);

    let parsedJson;
    try {
        const jsonString = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedJson = JSON.parse(jsonString);
        console.log("Parsed Gemini response:", parsedJson);
        console.log("Gemini response parsed."); // Durum: JSON ayrıştırma başarısı
    } catch (parseError) {
        console.error('Gemini response parsed error.', parseError);
        console.error('Gemini Response:', rawResponse);
        throw new CustomError( 500 , "The combination data could not be parsed from Gemini. The response format is invalid.");
    }

    if (!parsedJson.outfit_ids || !Array.isArray(parsedJson.outfit_ids)) {
      console.error('Geminis response contains an invalid JSON structure.:', parsedJson);
      throw new CustomError( 500 ,'Geminis response indicates an invalid data structure. The "outfit_ids" array is either missing or not an array.');
    }

    console.log("Creating the outfit with Gemini has been successfully completed."); // Durum: Bitiş
    console.log("weather:",weather);
    return parsedJson.outfit_ids;

  } catch (error) {
    if (error instanceof CustomError) {
        // Özel hataları denetleyici tarafından işlenmek üzere yeniden fırlat
        throw error;
    }
    console.error('An unexpected error occurred while calling the Gemini API:', error);
    throw new CustomError( 500 , "An unexpected API error prevented the creation of combos from Gemini.");
  }
}

module.exports = {
  generateOutfitWithGemini,
};
