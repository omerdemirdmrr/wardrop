import express from "express";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

const router = express.Router();

// Middleware: Token kontrolü
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token yok, erişim reddedildi" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // token içinden kullanıcıyı al ({ id: ... })
    next();
  } catch (err) {
    res.status(403).json({ error: "Geçersiz token" });
  }
}

// Örnek korumalı endpoint
router.get("/profile", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
        res.json({ message: `Hoşgeldin ${user.username}`, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Profil güncelleme
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, profileImageUrl } = req.body;
    // req.user.id authController'dan geliyor
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    if (name !== undefined) user.name = name;
    if (profileImageUrl !== undefined) user.profileImageUrl = profileImageUrl;

    await user.save();
    
    // Şifreyi gönderme
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ message: "Profil güncellendi", user: userResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
