import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Clothing from "../models/Clothing.js";
import Outfit from "../models/Outfit.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Initialize AI - Prefer env var, fallback to placeholder (which will fail if not replaced)
// Helper to get random item
const getRandom = (arr) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

router.post("/generate", auth, async (req, res) => {
    try {
        // 1. Get user's wardrobe
        const clothes = await Clothing.find({ user: req.user.id });
        
        if (clothes.length < 2) {
             return res.json({ success: false, message: "Yeterli kıyafet yok. Lütfen en az bir alt ve bir üst giyim ekleyin." });
        }

        let selectedItems = [];
        let apiError = null;
        let dislikedCombinations = [];

        // 2. Try AI Generation
        try {
             const apiKey = process.env.GEMINI_API_KEY;
             if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
                 throw new Error("API Key is missing or invalid in backend .env");
             }

             const genAI = new GoogleGenerativeAI(apiKey);
             const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

             // Prepare data for AI
            const wardrobeSummary = clothes.map(c => ({
                id: c._id,
                type: c.category,
                subType: c.subCategory,
                color: c.color,
                season: c.season,
                name: c.name
            }));

            // Fetch disliked outfits safely
            try {
                const dislikedOutfits = await Outfit.find({ user: req.user.id, status: 'disliked' }).populate('items');
                if (dislikedOutfits) {
                    dislikedCombinations = dislikedOutfits.map(o => {
                         if (!o.items || !Array.isArray(o.items)) return [];
                         return o.items.filter(i => i && i._id).map(i => i._id.toString());
                    }).filter(combo => combo.length > 0);
                }
                
                // Handle immediate feedback
                if (req.body.exclude && req.body.feedback === 'disliked') {
                     const justDisliked = await Outfit.findById(req.body.exclude);
                     if (justDisliked && justDisliked.items) {
                         dislikedCombinations.push(justDisliked.items.map(i => i.toString()));
                     }
                }
            } catch (fetchErr) {
                console.warn("Could not fetch disliked outfits:", fetchErr.message);
            }

            const prompt = `
                Bir moda stilistisin. Aşağıdaki gardırop envanterine sahibim:
                ${JSON.stringify(wardrobeSummary)}
                
                Kullanıcı daha önce şu kombinasyonları beğenmedi (Bu kombinlerin aynısını tekrar önerme!):
                ${JSON.stringify(dislikedCombinations)}

                Bu parçalardan şık bir kombin oluştur. Beğenilmeyen kombinlerdeki parçaları EŞLEŞTİRMEKTEN KAÇIN (Farklı kombinlerde kullanılabilirler ama aynı gruplamayı yapma).
                Bir Üst (Top), bir Alt (Bottom) ve varsa Ayakkabı (Shoes) seç.
                SADECE aşağıdaki JSON formatında yanıt ver (Markdown kullanma):
                {
                    "outfit_ids": ["item_id_1", "item_id_2", ...],
                    "explanation": "Kombin açıklaması..."
                }
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();
            
            // Clean up markdown
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const aiData = JSON.parse(text);
            
            if (aiData.outfit_ids && Array.isArray(aiData.outfit_ids)) {
                 selectedItems = clothes.filter(c => aiData.outfit_ids.includes(c._id.toString()));
            }

        } catch (error) {
            console.error("AI Generation Error (Falling back to random):", error.message);
            apiError = error.message;
            // Fallback continues below...
        }
        
        // 3. Fallback logic if AI failed or returned no items
        if (selectedItems.length === 0) {
             console.log("Using Random Fallback Logic");
             const tops = clothes.filter(c => ['Top', 'Outerwear', 'Üst Giyim', 'Dış Giyim'].includes(c.category) || c.category?.toLowerCase().includes('top'));
             const bottoms = clothes.filter(c => ['Bottom', 'Alt Giyim'].includes(c.category) || c.category?.toLowerCase().includes('bottom'));
             const shoes = clothes.filter(c => ['Shoes', 'Ayakkabı'].includes(c.category) || c.category?.toLowerCase().includes('shoe'));
             
             // If categories are messy, try to just pick 2-3 random items that are different
             if (tops.length === 0 && bottoms.length === 0) {
                 // No known categories, pick random 2
                 const shuffled = clothes.sort(() => 0.5 - Math.random());
                 selectedItems = shuffled.slice(0, 2);
             } else {
                 const t = getRandom(tops);
                 const b = getRandom(bottoms);
                 const s = getRandom(shoes);
                 if(t) selectedItems.push(t);
                 if(b) selectedItems.push(b);
                 if(s) selectedItems.push(s);
             }
        }

        if (selectedItems.length === 0) {
             return res.json({ success: false, message: "Kombin oluşturulamadı. Gardırobunuzu zenginleştirin." });
        }

        const newOutfit = new Outfit({
            user: req.user.id,
            items: selectedItems.map(i => i._id),
            status: 'new'
        });
        
        await newOutfit.save();
        
        // Populate items for frontend
        const populatedOutfit = await Outfit.findById(newOutfit._id).populate('items');

        res.json({ success: true, data: populatedOutfit, warning: apiError });

    } catch (error) {
        console.error("Critical Outfit generation error:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası: Kombin oluşturulamadı." });
    }
});

// GET all outfits for the user
router.get("/", auth, async (req, res) => {
    try {
        const outfits = await Outfit.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .populate('items');
        res.json({ success: true, data: outfits });
    } catch (error) {
        console.error("Error fetching outfits:", error);
        res.status(500).json({ success: false, message: "Kombinler getirilemedi." });
    }
});

router.put("/status/:id", auth, async (req, res) => {
    try {
        const { status } = req.body;
        await Outfit.findByIdAndUpdate(req.params.id, { status });
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ success: false });
    }
});

// DELETE all disliked outfits
router.delete("/disliked", auth, async (req, res) => {
    try {
        await Outfit.deleteMany({ user: req.user.id, status: 'disliked' });
        res.json({ success: true, message: "Tüm beğenilmeyen kombinler temizlendi." });
    } catch (error) {
        console.error("Clear disliked error:", error);
        res.status(500).json({ success: false, message: "Temizleme işlemi başarısız." });
    }
});

// DELETE outfit
router.delete("/:id", auth, async (req, res) => {
    try {
        const outfit = await Outfit.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!outfit) {
             return res.status(404).json({ success: false, message: "Kombin bulunamadı." });
        }
        res.json({ success: true, message: "Kombin silindi." });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ success: false, message: "Silme işlemi başarısız." });
    }
});

export default router;
