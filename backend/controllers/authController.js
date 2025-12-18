import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Bu e-posta zaten kayıtlı." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, name: username, email, password: hashedPassword });
    await user.save();

    res.json({ message: "Kayıt başarılı" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Kullanıcı bulunamadı" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Hatalı şifre" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ message: "Giriş başarılı", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

export const verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Şifre eşleşmedi" });

    res.json({ success: true, message: "Şifre doğrulandı" });
  } catch (error) {
    console.error("Verify password error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Eski şifre hatalı" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Şifre başarıyla değiştirildi" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    // 6 haneli kod üret
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Veritabanına kaydet (15 dakika geçerli)
    user.resetPasswordCode = code;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    // --- NODEMAILER SETUP ---
    // Not: Gerçek projelerde bu bilgileri .env dosyasında saklayın!
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "combine.gtu@gmail.com",
        pass: "lihj omrt xbnh esum", 
      },
    });

    const mailOptions = {
      from: '"Combine Security" <combine.gtu@gmail.com>',
      to: email,
      subject: "Verification Code - Combine App",
      text: `Hello,\n\nYou requested a password reset for your Combine App account.\nYour verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe Combine Team`,
      html: `
        <div style="font-family: Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
            <h2 style="color: #6C63FF; text-align: center; margin-bottom: 30px;">Password Reset Request</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.5;">Hello,</p>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">You recently requested to reset your password for your <strong>Combine App</strong> account. Please use the verification code below to complete the process:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0; border: 1px solid #e9ecef;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2d3436;">${code}</span>
            </div>
            
            <p style="color: #555; font-size: 14px;">This code is valid for <strong>15 minutes</strong>.</p>
            <p style="color: #888; font-size: 13px; margin-top: 30px;">If you did not initiate this request, you can safely ignore this email.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            
            <p style="color: #aaa; font-size: 12px; text-align: center;">
                Combine App Team<br>
                Secure your style.
            </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[MAIL SENT] To: ${email} | Code: ${code}`);

    res.json({ message: "Doğrulama kodu e-postanıza gönderildi." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Sunucu hatası veya mail gönderilemedi." });
  }
};

export const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Geçersiz veya süresi dolmuş kod." });

    res.json({ success: true, message: "Kod doğrulandı." });
  } catch (error) {
    console.error("Verify code error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Geçersiz veya süresi dolmuş işlem." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Şifreniz başarıyla yenilendi." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};
