
const ClothingItem = require('../db/models/ClothingItems');
const Outfit = require('../db/models/Outfits');
const OutfitItem = require('../db/models/OutfitItems');
const { generateOutfitWithGemini } = require('../services/geminiService');
const Response  = require('../lib/Response');
const  CustomError  = require('../lib/CustomError');

/**
 * Gemini kullanarak yeni bir kombin oluşturur, kaydeder ve döndürür.
 */
const generateAndSaveOutfit = async (req, res, next) => {
  console.log("generateAndSaveOutfit called");
  try {
    const userId = req.user.id;
    console.log("userId:", userId);

    if (!userId) {
      throw new CustomError(401,"User not authenticated.");
    }

    // Kullanıcının tüm kıyafetlerini ve hariç tutulacak kombinlerini çek
    const [userClothingItems, excludedOutfits] = await Promise.all([
      ClothingItem.find({ userId: userId }),
      Outfit.find({ 
        userId: userId, 
        status: { $in: ['disliked', 'suggested'] } 
      }).populate('items') // Gemini'ye daha iyi bilgi vermek için item detaylarını al
    ]);
    console.log("userClothingItems count:", userClothingItems.length);
    console.log("excludedOutfits count:", excludedOutfits.length);


    if (!userClothingItems || userClothingItems.length < 3) {
      throw new CustomError(400, "Not enough clothing items to generate an outfit. Please add more items to your wardrobe.","hjg"
      );
    }

    // Gemini servisinden kombin için kıyafet ID'lerini al (hariç tutulacakları da gönder)
    const outfitItemIds = await generateOutfitWithGemini(userClothingItems, excludedOutfits);
    console.log("outfitItemIds from geminiService:", outfitItemIds);


    if (!outfitItemIds || outfitItemIds.length === 0) {
      throw new CustomError(500,"Could not generate a new unique outfit with the available items.","hehe"
      );
    }
    
    // Yeni bir Outfit nesnesi oluştur ve Gemini'den gelen item'ları direkt ekle
    const newOutfit = new Outfit({
      userId: userId,
      name: `New Outfit - ${new Date().toLocaleDateString()}`, // Örnek bir isim
      items: outfitItemIds, // Gemini'den gelen ID'leri direkt ata
      status: 'suggested', // Yeni status alanını kullan
    });
    console.log("newOutfit before saving:", newOutfit);


    await newOutfit.save();

    // Oluşturulan kombini detaylarıyla birlikte geri döndür
    const finalOutfit = await Outfit.findById(newOutfit._id).populate('items');
    console.log("finalOutfit after saving and populating:", finalOutfit);


    res.status(201).json(Response.successResponse(201, {
      message: "Outfit generated successfully.",
      description: finalOutfit
    }));
      

  } catch (error) {
    // Hata durumunda loglama yap
    console.error("Error during outfit generation:", error.message, error.stack);
    
    // CustomError'ı istemciye daha anlaşılır bir şekilde gönder
    if (error instanceof CustomError) {
      return res.status(error.code).json(Response.errorResponse(404,{
        message: error.message,
      }));
    }
    
    // Diğer beklenmedik hatalar için
    next(error);
  }
};

const updateOutfitStatus = async (req, res, next) => {
  try {
    const { id: outfitId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!status || !['suggested', 'worn', 'disliked'].includes(status)) {
      throw new CustomError(400,
         "Invalid status provided.","dd"
      );
    }

    const outfit = await Outfit.findOne({ _id: outfitId, userId: userId });

    if (!outfit) {
      throw new CustomError(404,"Outfit not found or you don't have permission to change it.","dd");
    }

    outfit.status = status;
    await outfit.save();

    res.status(200).json(Response.success(201, {
      message: "Outfit status updated successfully."
    }));

  } catch (error) {
    // Hata durumunda loglama yap
    console.error("Error during outfit status update:", error.message);
    
    // CustomError'ı istemciye daha anlaşılır bir şekilde gönder
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json(Response.errorResponse(404,error.message));
    }
    
    // Diğer beklenmedik hatalar için
    next(error);
  }
};

module.exports = {
  generateAndSaveOutfit,
  updateOutfitStatus,
};
