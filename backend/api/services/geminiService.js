
const { GoogleGenerativeAI } = require('@google/generative-ai');
// Gerekli modelleri import edelim. Bu yolların projenizin yapısına göre doğru olduğundan emin olun.
const ClothingItem = require('../db/models/ClothingItems'); 
const Outfit = require('../db/models/Outfits');
const OutfitItem = require('../db/models/OutfitItems');
const CustomError  = require('../lib/CustomError');

// ÖNEMLİ: @google/generative-ai paketini backend/api dizininde kurmanız gerekir:
// npm install @google/generative-ai

// Google AI Studio'dan veya Google Cloud projenizden aldığınız API anahtarınız.
// Bu anahtarı .env dosyasında saklamak en iyi pratiktir.
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
async function generateOutfitWithGemini(clothingItems, excludedOutfits = []) {
  console.log("Kombin oluşturma işlemi Gemini ile başlıyor..."); // Durum: Başlangıç

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
    Merhaba, ben bir moda asistanıyım. Aşağıda JSON formatında bir kıyafet listesi bulunuyor.
    Bu kıyafetleri kullanarak harika bir kombin oluşturmanı istiyorum.
    Lütfen bu kombini oluştururken mevsimsel uyuma, renk uyumuna ve stil bütünlüğüne dikkat et.

    Kıyafetler:
    ${JSON.stringify(simplifiedClothes, null, 2)}

    ÖNEMLİ: Aşağıdaki kombinleri daha önce önerdim veya kullanıcı bunları beğenmedi.
    Lütfen bunlara benzer bir kombin oluşturmaktan KAÇIN.
    Kaçınılması Gereken Kombinler:
    ${JSON.stringify(simplifiedExcludedOutfits, null, 2)}

    Yapman gereken:
    1. "Kıyafetler" listesinden, "Kaçınılması Gereken Kombinler" listesindekilere benzemeyen, birbiriyle uyumlu kıyafetleri seçerek yeni bir kombin oluştur.
    2. Cevap olarak, sadece seçtiğin kıyafetlerin 'id'lerini içeren bir JSON nesnesi döndür.
    Cevabın şu formatta olmalı: { "outfit_ids": ["id1", "id2", "id3", ...] }
    Başka hiçbir açıklama veya metin ekleme. Sadece JSON nesnesini döndür.
  `;
  console.log("Gemini prompt:", prompt);

  try {
    console.log("Gemini API çağrılıyor..."); // Durum: API çağrısı
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawResponse = response.text();
    console.log("Gemini raw response:", rawResponse);
    console.log("Gemini'den yanıt başarıyla alındı."); // Durum: API başarısı

    let parsedJson;
    try {
        const jsonString = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedJson = JSON.parse(jsonString);
        console.log("Parsed Gemini response:", parsedJson);
        console.log("Gemini yanıtı başarıyla ayrıştırıldı."); // Durum: JSON ayrıştırma başarısı
    } catch (parseError) {
        console.error('Gemini yanıtından JSON ayrıştırılırken hata oluştu:', parseError);
        console.error('Ham Gemini yanıtı:', rawResponse);
        throw new CustomError( 500 , "Gemini'den kombin verileri ayrıştırılamadı. Yanıt formatı geçersiz.");
    }

    if (!parsedJson.outfit_ids || !Array.isArray(parsedJson.outfit_ids)) {
      console.error('Gemini yanıtında geçersiz JSON yapısı:', parsedJson);
      throw new CustomError( 500 ,'Gemini yanıtında geçersiz veri yapısı. "outfit_ids" dizisi eksik veya bir dizi değil.');
    }

    console.log("Gemini ile kombin oluşturma başarıyla tamamlandı."); // Durum: Bitiş
    return parsedJson.outfit_ids;

  } catch (error) {
    if (error instanceof CustomError) {
        // Özel hataları denetleyici tarafından işlenmek üzere yeniden fırlat
        throw error;
    }
    console.error('Gemini API çağrılırken beklenmedik bir hata oluştu:', error);
    throw new CustomError( 500 , "Beklenmedik bir API hatası nedeniyle Gemini'den kombin oluşturulamadı.");
  }
}

module.exports = {
  generateOutfitWithGemini,
};
