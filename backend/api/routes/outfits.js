var express = require('express');
var router = express.Router();
var Outfits = require('../db/models/Outfits');
var response = require("../lib/Response");
var _enum = require("../config/enum");
var verifyToken = require("../lib/authToken");
const { generateAndSaveOutfit, updateOutfitStatus } = require('../controllers/outfitController');

/* GET: Kullanıcının tüm kombinlerini getir (Kıyafet detaylarıyla birlikte) */
router.get("/", verifyToken, async (req, res) => {
    try {
        const outfits = await Outfits.find({ userId: req.user.id })
            .populate('items'); // <--- SİHİRLİ KISIM: ID yerine kıyafetin resmini/adını getirir.

        return res.status(_enum.HTTP_STATUS.OK).json(
            response.successResponse(_enum.HTTP_STATUS.OK, outfits)
        );
    } catch (err) {
        console.error("Error:", err);
        return res.status(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
            response.errorResponse(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message)
        );
    }
});

/* POST: Yapay zeka ile yeni kombin oluştur */
router.post("/generate", verifyToken, generateAndSaveOutfit);

/* PUT: Kombin durumunu güncelle (beğen/beğenme) */
router.put("/status/:id", verifyToken, updateOutfitStatus);

/* POST: Yeni Kombin Oluştur */
router.post("/add", verifyToken, async (req, res) => {
    try {
        const { name, items, description } = req.body;

        // items bir dizi (array) olmalı ve dolu olmalı
        if (!name || !items || items.length === 0) {
            return res.status(_enum.HTTP_STATUS.BAD_REQUEST).json(
                response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
                    message: "Eksik bilgi",
                    description: "Kombin adı ve en az bir kıyafet seçilmelidir."
                })
            );
        }

        const newOutfit = new Outfits({
            userId: req.user.id,
            name,
            items, // Örn: ["ID_TSHIRT", "ID_PANTOLON"]
            description
        });

        const savedOutfit = await newOutfit.save();

        return res.status(_enum.HTTP_STATUS.CREATED).json(
            response.successResponse(_enum.HTTP_STATUS.CREATED, {
                message: "Kombin başarıyla oluşturuldu",
                outfit: savedOutfit
            })
        );

    } catch (err) {
        console.error("Error:", err);
        return res.status(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
            response.errorResponse(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message)
        );
    }
});

/* DELETE: Kombin Sil */
router.delete("/delete/:id", verifyToken, async (req, res) => {
    try {
        const deleted = await Outfits.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.user.id 
        });

        if (!deleted) {
            return res.status(_enum.HTTP_STATUS.NOT_FOUND).json(
                response.errorResponse(_enum.HTTP_STATUS.NOT_FOUND, "Kombin bulunamadı")
            );
        }

        return res.status(_enum.HTTP_STATUS.OK).json(
            response.successResponse(_enum.HTTP_STATUS.OK, "Kombin silindi")
        );
    } catch (err) {
        return res.status(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
            response.errorResponse(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message)
        );
    }
});

module.exports = router;