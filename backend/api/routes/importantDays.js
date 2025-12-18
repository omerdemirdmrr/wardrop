var express = require('express');
var router = express.Router();
var ImportantDays = require('../db/models/ImportantDays');
var response = require("../lib/Response");
var _enum = require("../config/enum");
var verifyToken = require("../lib/authToken");

/* GET: Kullanıcının tüm önemli günlerini listele */
router.get("/", verifyToken, async (req, res) => {
    try {
        // Kullanıcıya ait günleri getir ve 'occasionId' bilgisini detaylandır (populate)
        // Eğer Occasions tablon boşsa .populate hata vermez, sadece null döner.
        const days = await ImportantDays.find({ userId: req.user.id });

        return res.status(_enum.HTTP_STATUS.OK).json(
            response.successResponse(_enum.HTTP_STATUS.OK, days)
        );
    } catch (err) {
        console.error("Error: get important days", err);
        return res.status(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
            response.errorResponse(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message)
        );
    }
});

/* POST: Yeni bir önemli gün ekle */
router.post("/add", verifyToken, async (req, res) => {
    try {
        const { date, name, occasionId, notes } = req.body;

        // Zorunlu alan kontrolü (Modelde required olanlar)
        if (!date || !occasionId) {
            return res.status(_enum.HTTP_STATUS.BAD_REQUEST).json(
                response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
                    message: "Eksik bilgi",
                    description: "Tarih (date) ve Durum ID (occasionId) zorunludur."
                })
            );
        }

        const newDay = new ImportantDays({
            userId: req.user.id,
            date,
            name,
            occasionId,
            notes
        });

        const savedDay = await newDay.save();

        return res.status(_enum.HTTP_STATUS.CREATED).json(
            response.successResponse(_enum.HTTP_STATUS.CREATED, {
                message: "Önemli gün başarıyla eklendi",
                item: savedDay
            })
        );

    } catch (err) {
        console.error("Error: add important day", err);
        return res.status(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
            response.errorResponse(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message)
        );
    }
});

/* PUT: Önemli günü güncelle */
router.put("/update/:id", verifyToken, async (req, res) => {
    try {
        const updates = req.body;

        // Güvenlik: Sadece kendi eklediği günü güncelleyebilir
        const updatedDay = await ImportantDays.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            updates,
            { new: true } // Güncel halini döndür
        );

        if (!updatedDay) {
            return res.status(_enum.HTTP_STATUS.NOT_FOUND).json(
                response.errorResponse(_enum.HTTP_STATUS.NOT_FOUND, {
                    message: "Gün bulunamadı",
                    description: "Güncellenecek kayıt bulunamadı veya yetkiniz yok."
                })
            );
        }

        return res.status(_enum.HTTP_STATUS.OK).json(
            response.successResponse(_enum.HTTP_STATUS.OK, {
                message: "Güncellendi",
                item: updatedDay
            })
        );

    } catch (err) {
        console.error("Error: update important day", err);
        return res.status(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
            response.errorResponse(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message)
        );
    }
});

/* DELETE: Önemli günü sil */
router.delete("/delete/:id", verifyToken, async (req, res) => {
    try {
        const deletedDay = await ImportantDays.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!deletedDay) {
            return res.status(_enum.HTTP_STATUS.NOT_FOUND).json(
                response.errorResponse(_enum.HTTP_STATUS.NOT_FOUND, "Silinecek kayıt bulunamadı")
            );
        }

        return res.status(_enum.HTTP_STATUS.OK).json(
            response.successResponse(_enum.HTTP_STATUS.OK, "Kayıt başarıyla silindi")
        );

    } catch (err) {
        console.error("Delete error:", err);
        return res.status(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
            response.errorResponse(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message)
        );
    }
});

module.exports = router;