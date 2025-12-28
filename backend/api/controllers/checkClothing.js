const ClothingItems = require("../db/models/ClothingItems"); // model yolunu kontrol et

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
        message: "En az 3 kıyafet eklemeden kombin oluşturulamaz",
        currentCount: count,
      });
    }

    const hasUpper = await ClothingItems.exists({ userId, category: "Üst Giyim" });
    const hasLower = await ClothingItems.exists({ userId, category: "Alt Giyim" });
    const hasFootwear = await ClothingItems.exists({ userId, category: "Ayakkabı" });

    if (!hasUpper || !hasLower || !hasFootwear) {
      return res.status(400).json({
        success: false,
        message: "To create an outfit, you need 1 bottom, 1 top, and 1 pair of shoes.",
      });
    }

    // ✅ Şart sağlandı → devam
    next();
  } catch (error) {
    console.error("🔥 checkClothingCount error:", error);
    res.status(500).json({
      success: false,
      message: "Kıyafet sayısı kontrol edilirken hata oluştu",
    });
  }
};

module.exports = checkClothingCount;
