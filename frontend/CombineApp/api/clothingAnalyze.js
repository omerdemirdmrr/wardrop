import * as FileSystem from 'expo-file-system/legacy';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { errorHandler } from '../utils';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "AIzaSyC09J4Xp-PQOqY9Y0D7hszfzFIn3aS0QW0";

const genAI = new GoogleGenerativeAI(API_KEY);

// ---------------------------------------------------------
// İSTEDİĞİN DETAYLI JSON FORMATI İÇİN ŞEMA TANIMI
// ---------------------------------------------------------
const complexClothingSchema = {
  description: "Detailed clothing analysis in Turkish",
  type: SchemaType.OBJECT,
  properties: {
    id: { type: SchemaType.NUMBER, description: "Unique ID" },
    kiyafet_analizi: {
      type: SchemaType.OBJECT,
      properties: {
        success: {
          type: SchemaType.BOOLEAN
        },
        genel_bilgi: {
          type: SchemaType.OBJECT,
          properties: {
            kategori: { type: SchemaType.STRING, description: "Örn: Dış Giyim, Üst Giyim" },
            tur: { type: SchemaType.STRING, description: "Örn: Trençkot, Kazak, T-shirt" },
            cinsiyet_grubu: { type: SchemaType.STRING, description: "Kadın, Erkek veya Unisex" },
            mevsim: {
              type: SchemaType.STRING,
              enum: ["İlkbahar", "Yaz", "Sonbahar", "Kış", "Tüm Mevsimler"],
              description: "Select the most appropriate season."
            }
          },
          required: ["kategori", "tur", "cinsiyet_grubu", "mevsim"]
        },
        renk_paleti: {
          type: SchemaType.OBJECT,
          properties: {
            ana_renk: { type: SchemaType.STRING, description: "Dominant color name in Turkish" },
            ikincil_renk: { type: SchemaType.STRING, description: "Secondary color or detail color" }
          },
          required: ["ana_renk"]
        },
        tasarim_detaylari: {
          type: SchemaType.OBJECT,
          properties: {
            yaka_stili: { type: SchemaType.STRING, description: "Collar style" },
            kol_boyu: { type: SchemaType.STRING, description: "Sleeve length/style" },
            mansetler: { type: SchemaType.STRING, description: "Cuff details" },
            etek_ucu: { type: SchemaType.STRING, description: "Hemline details" },
            kapama_sistemi: { type: SchemaType.STRING, description: "Closure (buttons, zipper, etc.)" },
            kesim: { type: SchemaType.STRING, description: "Fit (Oversize, Slim, Regular)" }
          }
        },
        malzeme_tahmini: {
          type: SchemaType.OBJECT,
          properties: {
            kumas_tipi: { type: SchemaType.STRING, description: "Fabric type guess" },
            doku: { type: SchemaType.STRING, description: "Texture description" }
          }
        },
        stil_kullanimi: {
          type: SchemaType.OBJECT,
          properties: {
            // BURASI ÖNEMLİ: Array (Liste) yapısı
            tarz: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "List of styles (e.g. ['Klasik', 'Spor'])"
            },
            kullanim_alani: { type: SchemaType.STRING, description: "Where to wear" }
          }
        }
      },
      required: ["genel_bilgi", "renk_paleti", "tasarim_detaylari", "malzeme_tahmini", "stil_kullanimi"]
    }
  },
  required: ["id", "kiyafet_analizi"],

};

export const analyzeImageWithAI = async (imageUri) => {
  console.log('AI Analysis (Complex JSON): Processing image...', imageUri);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: complexClothingSchema, // Yeni şemayı buraya bağladık
      }
    });

    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    // Prompt'u Türkçe analiz yapması için yönlendiriyoruz
    const prompt = `Bu kıyafeti bir moda uzmanı gibi analiz et. 
                    Çıktı tamamen Türkçe olmalı. 
                    Verilen JSON şemasına sadık kal.
                    'genel_bilgi.mevsim' alanını mutlaka doldur. "Spor" bir mevsim değildir.
                    Renkleri ve kumaş detaylarını spesifik olarak tanımla
                    eğer giyim ürünü (ayakkabı, üst giyim, alt giyim, her türlü kıyafet, mont ve aksesuarlar yani bileklik, çantalar, takılar şal, saat vs.) değilse  success alanı false yap.
                    (örn: 'Mavi' yerine 'Gece Mavisi').`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    console.log(result.response);
    const response = await result.response;

    const jsonString = response.text();
    const aiResponse = JSON.parse(jsonString);

    console.log('AI Analysis Complete:', JSON.stringify(aiResponse, null, 2)); // Konsolda okunaklı görünsün diye formatladım
    return { success: true, data: aiResponse };

  } catch (error) {
    const standardError = errorHandler.handleAIError(error, { operation: 'analyzeImage', imageUri });
    return {
      success: false,
      error: standardError,
      data: null
    };
  }
};
