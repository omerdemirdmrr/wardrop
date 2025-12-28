var express = require('express');
var router = express.Router();
console.log("Clothes.js file loaded!"); // <--- ADD THIS LINE
var ClothingItems = require('../db/models/ClothingItems'); // Model yolunu kontrol et
var response = require("../lib/Response");
var _enum = require("../config/enum");
var verifyToken = require("../lib/authToken");
const upload = require("../lib/upload");
const cloudinary = require("../config/cloudinary");

router.get('/test', (req, res) => {
    res.send("Connection successful! You reached the Clothes route.");
});

/* GET all clothes for the logged-in user */
router.get("/list", verifyToken, async (req, res) => {
    try {
        // Sadece token'daki kullanıcıya ait kıyafetleri getir
        const items = await ClothingItems.find({ userId: req.user.id });

        res.json({ success: true, data: items });
    } catch (err) {
        console.error("Error: get clothes", err);
        return res.status(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
            response.errorResponse(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message)
        );
    }
});

/* POST add a new cloth */
router.post("/add", verifyToken, upload.single("image"), async (req, res) => {
    console.log("[/clothes/add] - Request received");
    try {
        const { name, category, subCategory, color, season, material, size } = req.body;
        console.log("[/clothes/add] - Body:", req.body);
        console.log("[/clothes/add] - File:", req.file ? `Exists, ${req.file.size} bytes` : "No file uploaded");

        // Zorunlu alan kontrolü (Modelde required olanlar) - Geçici olarak occasionId ve season kaldırıldı
        if (!name || !category || !color) {
            return res.status(_enum.HTTP_STATUS.BAD_REQUEST).json(
                response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
                    message: "Missing required fields",
                    description: "Name, Category, SubCategory and Color are required."
                })
            );
        }

        let imageUrl = null;
        let imagePublicId = null;

        if (!req.file) {
            return response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
                message: "missing required fields",
                description: "photo is required"
            })
        } else {
            console.log("[/clothes/add] - Starting Cloudinary upload...");
            const cloudinaryUpload = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: "CombineApp/clothes" },
                    (error, result) => {
                        if (error) {
                            console.error("[/clothes/add] - Cloudinary Error:", error);
                            reject(error);
                        }
                        else {
                            console.log("[/clothes/add] - Cloudinary Success:", result.secure_url);
                            resolve(result);
                        }
                    }
                ).end(req.file.buffer);
            });

            imageUrl = cloudinaryUpload.secure_url;
            imagePublicId = cloudinaryUpload.public_id
        }

        console.log("[/clothes/add] - Cloudinary upload finished. Image URL:", imageUrl);

        const newClothData = {
            userId: req.user.id, // Token'dan gelen user ID'yi kullanıyoruz
            name,
            category,
            subCategory,
            color,
            imageUrl,
            imagePublicId,
            isActive: true
        };

        // İsteğe bağlı alanları varsa ekle
        if (size) newClothData.size = size;
        if (material) newClothData.material = material;

        if (season) newClothData.season = season;



        const newCloth = new ClothingItems(newClothData);

        console.log("[/clothes/add] - Saving new cloth to database...");
        const savedCloth = await newCloth.save();
        console.log("[/clothes/add] - Cloth saved successfully.");

        return res.status(_enum.HTTP_STATUS.CREATED).json(
            response.successResponse(_enum.HTTP_STATUS.CREATED, {
                message: "Clothing item added successfully",
                item: savedCloth
            })
        );

    } catch (err) {
        console.error("[/clothes/add] - Error in route handler:", err);
        return res.status(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
            response.errorResponse(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message)
        );
    }
});

/* PUT update a cloth */
router.put("/update/:id", verifyToken, async (req, res) => {
    try {
        const updates = req.body;

        // Güvenlik: Kullanıcı başkasının kıyafetini güncelleyememeli
        // Hem ID eşleşmeli hem de userId token'daki ile aynı olmalı
        const updatedCloth = await ClothingItems.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            updates,
            { new: true } // Güncellenmiş veriyi döndür
        );

        if (!updatedCloth) {
            return res.status(_enum.HTTP_STATUS.NOT_FOUND).json(
                response.errorResponse(_enum.HTTP_STATUS.NOT_FOUND, {
                    message: "Item not found or unauthorized",
                    description: "Could not find the clothing item to update."
                })
            );
        }

        return res.status(_enum.HTTP_STATUS.OK).json(
            response.successResponse(_enum.HTTP_STATUS.OK, {
                message: "Item updated successfully",
                item: updatedCloth
            })
        );

    } catch (err) {
        console.error("Error: update cloth", err);
        return res.status(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
            response.errorResponse(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message)
        );
    }
});

/* DELETE a cloth */
router.delete("/delete/:id", verifyToken, async (req, res) => {
    console.log("User ID:", req.user.id);
    console.log("Param ID:", req.params.id);
    try {
        // Güvenlik: Sadece kendi eklediği kıyafeti silebilir
        const deletedCloth = await ClothingItems.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });


        if (deletedCloth.imagePublicId) {
            await cloudinary.uploader.destroy(deletedCloth.imagePublicId);
        }

        if (!deletedCloth) {
            return res.status(_enum.HTTP_STATUS.NOT_FOUND).json(
                response.errorResponse(_enum.HTTP_STATUS.NOT_FOUND, {
                    message: "Error: delete item",
                    description: "Item not found or you are not authorized to delete it."
                })
            );
        }

        return res.status(_enum.HTTP_STATUS.OK).json(
            response.successResponse(_enum.HTTP_STATUS.OK, "Item deleted successfully")
        );

    } catch (err) {
        console.error("Delete error:", err);
        return res.status(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
            response.errorResponse(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message)
        );
    }
});


router.get("/test", (req, res) => {

    console.log("Clothes test endpoint reached");
    res.send("Clothes route is working!");
})

module.exports = router;