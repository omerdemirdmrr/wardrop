const ClothingItem = require('../db/models/ClothingItems');
const Outfit = require('../db/models/Outfits');
const { generateOutfitWithGemini } = require('../services/geminiService');
const Response = require('../lib/Response');
const CustomError = require('../lib/CustomError');

/**
 * Gemini kullanarak yeni bir kombin oluşturur, kaydeder ve döndürür.
 */
const generateAndSaveOutfit = async (req, res, next) => {
  console.log("generateAndSaveOutfit called");
  try {
    const userId = req.user.id;
    const { weather } = req.body; // Hava durumu bilgisini request body'den al

    if (!userId) {
      throw new CustomError(401, "User not authenticated.");
    }

    const [userClothingItems, excludedOutfits] = await Promise.all([
      ClothingItem.find({ userId: userId }),
      Outfit.find({
        userId: userId,
        status: { $in: ['disliked', 'suggested'] }
      })
        .sort({ createdAt: -1 })   // son eklenenler
        .limit(4)                  // sadece 4 tane
        .populate('items')
    ]);

    if (!userClothingItems || userClothingItems.length < 3) {
      throw new CustomError(400, "Not enough clothing items.");
    }

    const outfitItemIds = await generateOutfitWithGemini(userClothingItems, excludedOutfits, weather);

    if (!outfitItemIds || outfitItemIds.length === 0) {
      throw new CustomError(500, "Could not generate a new unique outfit.");
    }

    const newOutfit = new Outfit({
      userId: userId,
      name: `New Outfit - ${new Date().toLocaleDateString()}`,
      items: outfitItemIds,
      status: 'suggested',
    });

    await newOutfit.save();

    const finalOutfit = await Outfit.findById(newOutfit._id).populate('items');

    res.status(201).json({
      success: true,
      data: finalOutfit,
      description: "Outfit generated and saved successfully."
    });

  } catch (error) {
    console.error("Error during outfit generation:", error.message);
    if (error instanceof CustomError) {
      return res.status(error.code || 400).json(Response.errorResponse(error.code || 400, error.message));
    }
    next(error);
  }
};

const updateOutfitStatus = async (req, res, next) => {
  try {
    const { id: outfitId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!status || !['suggested', 'worn', 'disliked'].includes(status)) {
      throw new CustomError(400, "Invalid status provided.");
    }

    const outfit = await Outfit.findOne({ _id: outfitId, userId: userId });

    if (!outfit) {
      throw new CustomError(404, "Outfit not found.");
    }

    outfit.status = status;
    await outfit.save();

    // DÜZELTİLEN SATIR BURASI: Response.success -> Response.successResponse
    res.status(200).json(Response.successResponse(200, {
      message: "Outfit status updated successfully."
    }));

  } catch (error) {
    console.error("Error during outfit status update:", error.message);

    if (error instanceof CustomError) {
      const statusCode = error.code || 400;
      return res.status(statusCode).json(Response.errorResponse(statusCode, error.message));
    }

    next(error);
  }
};

module.exports = {
  generateAndSaveOutfit,
  updateOutfitStatus,
};