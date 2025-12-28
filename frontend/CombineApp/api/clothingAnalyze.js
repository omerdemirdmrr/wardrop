import * as FileSystem from 'expo-file-system/legacy';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { errorHandler } from '../utils';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);


const complexClothingSchema = {
  description: "Detailed clothing analysis",
  type: SchemaType.OBJECT,
  properties: {
    id: { type: SchemaType.NUMBER, description: "Unique ID" },
    clothing_analysis: {
      type: SchemaType.OBJECT,
      properties: {
        success: {
          type: SchemaType.BOOLEAN
        },
        general_info: { 
          type: SchemaType.OBJECT,
          properties: {
            category: { type: SchemaType.STRING, description: "Ex: Top, Bottom, Shoe" },
            type: { type: SchemaType.STRING, description: "Ex: Trench coat, Sweater, T-shirt" },
            gender_group: { type: SchemaType.STRING, description: "Women, Men, or Unisex" },
            season: {
              type: SchemaType.STRING,
              enum: ["Spring", "Summer", "Autumn", "Winter", "All Seasons"],
              description: "Select the most appropriate season."
            }
          },
          required: ["category", "type", "gender_group", "season"]
        },
        color_palette: { 
          type: SchemaType.OBJECT,
          properties: {
            primary_color: { type: SchemaType.STRING, description: "Dominant color name" },
            secondary_color: { type: SchemaType.STRING, description: "Secondary color or detail color" }
          },
          required: ["primary_color"]
        },
        design_details: { 
          type: SchemaType.OBJECT,
          properties: {
            collar_style: { type: SchemaType.STRING, description: "Collar style (e.g., V-neck, Crew neck)" },
            sleeve_length: { type: SchemaType.STRING, description: "Sleeve length/style (e.g., Long sleeve, Short sleeve)" },
            cuffs: { type: SchemaType.STRING, description: "Cuff details" },
            hemline: { type: SchemaType.STRING, description: "Hemline details" },
            closure_type: { type: SchemaType.STRING, description: "Closure (buttons, zipper, etc.)" },
            fit: { type: SchemaType.STRING, description: "Fit (Oversize, Slim, Regular)" }
          }
        },
        material_estimation: { 
          type: SchemaType.OBJECT,
          properties: {
            fabric_type: { type: SchemaType.STRING, description: "Fabric type guess (e.g., Cotton, Denim, Silk)" },
            texture: { type: SchemaType.STRING, description: "Texture description (e.g., Smooth, Ribbed)" }
          }
        },
        style_usage: { 
          type: SchemaType.OBJECT,
          properties: {
            style: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "List of styles (e.g. ['Classic', 'Casual', 'Streetwear'])"
            },
            occasion: { type: SchemaType.STRING, description: "Where to wear (e.g., Office, Daily, Party)" }
          }
        }
      },
      required: ["general_info", "color_palette", "design_details", "material_estimation", "style_usage"]
    }
  },
  required: ["id", "clothing_analysis"],

};

export const analyzeImageWithAI = async (imageUri) => {
  console.log('AI Analysis (Complex JSON): Processing image...', imageUri);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: complexClothingSchema,
      }
    });

    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    // Prompt'u Türkçe analiz yapması için yönlendiriyoruz
    const prompt = `Analyze this outfit like a fashion expert. 
                    The output must be strictly in English. 
                    Strictly adhere to the provided JSON schema.
                    You must fill in the 'general_info.season' field correctly; 'Sports' is not a season.
                    Define colors and fabric details specifically (e.g., instead of 'Blue', use 'Midnight Blue').
                    If the image is not a clothing item (shoes, tops, bottoms, any garment, coats, or accessories like bracelets,
                    bags, jewelry, scarves, watches, etc.), set the 'success' field to false.`;

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
