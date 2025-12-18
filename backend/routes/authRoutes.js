import express from "express";
import { register, login, changePassword, verifyPassword, forgotPassword, verifyCode, resetPassword } from "../controllers/authController.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-password", auth, verifyPassword);
router.post("/change-password", auth, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyCode);
router.post("/reset-password", resetPassword);

export default router;
