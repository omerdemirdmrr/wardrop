const ClothingItems = require("../db/models/ClothingItems"); 

const checkClothingCount = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const count = await ClothingItems.countDocuments({ userId });

    if (count < 3) {
      return res.status(400).json({
        success: false,
        message: "You can't create an outfit without adding at least 3 clothing items.",
        currentCount: count,
      });
    }

    const hasUpper = await ClothingItems.exists({ userId, category: "Top" });
    const hasLower = await ClothingItems.exists({ userId, category: "Bottom" });
    const hasFootwear = await ClothingItems.exists({ userId, category: "Shoe" });

    if (!hasUpper || !hasLower || !hasFootwear) {
      return res.status(400).json({
        success: false,
        message: "To create an outfit, you need 1 bottom, 1 top, and 1 pair of shoes.",
      });
    }

    
    next();
  } catch (error) {
    console.error("🔥 checkClothingCount error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while checking the number of garments",
    });
  }
};

module.exports = checkClothingCount;
