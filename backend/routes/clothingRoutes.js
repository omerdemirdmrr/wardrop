import express from "express";
import multer from "multer";
import Clothing from "../models/Clothing.js";
import { auth } from "../middleware/authMiddleware.js";
import path from "path";
import fs from "fs";

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage });

router.post("/add", auth, upload.single('image'), async (req, res) => {
    try {
        const { name, category, subCategory, color, season, material, size } = req.body;
        
        if(!req.file) return res.status(400).json({message: "Image required"});

        // Construct image URL
        // req.protocol might be http. req.get('host') is host:port.
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        const newClothing = new Clothing({
            user: req.user.id, // Corrected to match JWT payload
            name,
            imageUrl,
            category,
            subCategory,
            color,
            season,
            material,
            size
        });

        await newClothing.save();
        res.status(201).json(newClothing);

    } catch (error) {
        console.error("Error adding clothing:", error);
        res.status(500).json({ message: "Error adding clothing" });
    }
});

router.get("/list", auth, async (req, res) => {
    try {
        const clothes = await Clothing.find({ user: req.user.id }); // Corrected
        res.json({ success: true, data: clothes }); 
    } catch(err) {
        console.error(err);
        res.status(500).json({message: "Error fetching clothes"});
    }
});

export default router;
